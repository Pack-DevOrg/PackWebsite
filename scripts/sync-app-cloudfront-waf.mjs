#!/usr/bin/env node

import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";

const DISTRIBUTION_ALIAS =
  process.env.DONEAI_APP_DISTRIBUTION_ALIAS?.trim() || "app.trypackai.com";
const WEB_ACL_NAME =
  process.env.DONEAI_WEB_ACL_NAME?.trim() ||
  `${DISTRIBUTION_ALIAS.replace(/\./g, "-")}-waf`;
const WEB_ACL_METRIC_NAME =
  process.env.DONEAI_WEB_ACL_METRIC_NAME?.trim() || WEB_ACL_NAME;
const ALLOW_SHARED_DISTRIBUTION =
  process.env.DONEAI_ALLOW_SHARED_APP_DISTRIBUTION === "1";
const DRY_RUN = process.argv.includes("--dry-run");

const desiredRules = [
  {
    Name: "RateLimitPerIp",
    Priority: 0,
    Action: { Block: {} },
    Statement: {
      RateBasedStatement: {
        AggregateKeyType: "IP",
        Limit: 1000,
      },
    },
    VisibilityConfig: {
      SampledRequestsEnabled: true,
      CloudWatchMetricsEnabled: true,
      MetricName: `${WEB_ACL_METRIC_NAME}-rate-limit`,
    },
  },
  {
    Name: "AWSManagedRulesAmazonIpReputationList",
    Priority: 1,
    OverrideAction: { None: {} },
    Statement: {
      ManagedRuleGroupStatement: {
        VendorName: "AWS",
        Name: "AWSManagedRulesAmazonIpReputationList",
      },
    },
    VisibilityConfig: {
      SampledRequestsEnabled: true,
      CloudWatchMetricsEnabled: true,
      MetricName: `${WEB_ACL_METRIC_NAME}-ip-reputation`,
    },
  },
  {
    Name: "AWSManagedRulesKnownBadInputsRuleSet",
    Priority: 2,
    OverrideAction: { None: {} },
    Statement: {
      ManagedRuleGroupStatement: {
        VendorName: "AWS",
        Name: "AWSManagedRulesKnownBadInputsRuleSet",
      },
    },
    VisibilityConfig: {
      SampledRequestsEnabled: true,
      CloudWatchMetricsEnabled: true,
      MetricName: `${WEB_ACL_METRIC_NAME}-known-bad-inputs`,
    },
  },
];

function runAws(args, options = {}) {
  const result = spawnSync("aws", args, {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
    ...options,
  });

  if (result.status !== 0) {
    throw new Error(result.stderr.trim() || result.stdout.trim() || `aws ${args.join(" ")} failed`);
  }

  return result.stdout.trim();
}

function runAwsJson(args) {
  const output = runAws([...args, "--output", "json"]);
  return output.length > 0 ? JSON.parse(output) : {};
}

function writeTempJson(dir, name, data) {
  const filePath = path.join(dir, name);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
  return filePath;
}

function findDistributionByAlias(alias) {
  const distributions = runAwsJson([
    "cloudfront",
    "list-distributions",
    "--query",
    "DistributionList.Items[]",
  ]);

  return distributions.find((distribution) =>
    distribution.Aliases?.Items?.includes(alias)
  );
}

function ensureDistributionIsSafe(distribution) {
  const aliases = distribution.Aliases?.Items || [];
  const sharesLegacyAlias = aliases.some(
    (alias) => alias !== DISTRIBUTION_ALIAS && alias.endsWith(".itsdoneai.com"),
  );

  if (sharesLegacyAlias && !ALLOW_SHARED_DISTRIBUTION) {
    throw new Error(
      `Distribution ${distribution.Id} for ${DISTRIBUTION_ALIAS} still shares legacy aliases (${aliases.join(
        ", ",
      )}). Duplicate CloudFront first, then rerun sync-app-cloudfront-waf against the trypack-only distribution.`,
    );
  }
}

function ensureWebAcl(tmpDir) {
  const webAcls = runAwsJson([
    "wafv2",
    "list-web-acls",
    "--scope",
    "CLOUDFRONT",
    "--region",
    "us-east-1",
    "--query",
    "WebACLs[]",
  ]);

  const existing = webAcls.find((acl) => acl.Name === WEB_ACL_NAME);
  if (!existing) {
    if (DRY_RUN) {
      console.log(`[dry-run] would create WebACL ${WEB_ACL_NAME}`);
      return { arn: `arn:aws:wafv2:us-east-1:dry-run:global/webacl/${WEB_ACL_NAME}` };
    }

    const rulesPath = writeTempJson(tmpDir, "rules.json", desiredRules);
    const created = runAwsJson([
      "wafv2",
      "create-web-acl",
      "--name",
      WEB_ACL_NAME,
      "--scope",
      "CLOUDFRONT",
      "--region",
      "us-east-1",
      "--default-action",
      "Allow={}",
      "--visibility-config",
      `SampledRequestsEnabled=true,CloudWatchMetricsEnabled=true,MetricName=${WEB_ACL_METRIC_NAME}`,
      "--rules",
      `file://${rulesPath}`,
      "--query",
      "Summary",
    ]);

    console.log(`Created WebACL ${created.Name}`);
    return { arn: created.ARN, id: created.Id };
  }

  const details = runAwsJson([
    "wafv2",
    "get-web-acl",
    "--scope",
    "CLOUDFRONT",
    "--region",
    "us-east-1",
    "--id",
    existing.Id,
    "--name",
    existing.Name,
  ]);

  const webAcl = details.WebACL;
  const needsUpdate =
    JSON.stringify(webAcl.Rules) !== JSON.stringify(desiredRules) ||
    webAcl.VisibilityConfig?.MetricName !== WEB_ACL_METRIC_NAME;

  if (needsUpdate) {
    if (DRY_RUN) {
      console.log(`[dry-run] would update WebACL ${existing.Name}`);
    } else {
      const inputPath = writeTempJson(tmpDir, "update-webacl.json", {
        Name: existing.Name,
        Scope: "CLOUDFRONT",
        Id: existing.Id,
        DefaultAction: { Allow: {} },
        VisibilityConfig: {
          SampledRequestsEnabled: true,
          CloudWatchMetricsEnabled: true,
          MetricName: WEB_ACL_METRIC_NAME,
        },
        Rules: desiredRules,
        LockToken: details.LockToken,
      });

      runAws([
        "wafv2",
        "update-web-acl",
        "--region",
        "us-east-1",
        "--cli-input-json",
        `file://${inputPath}`,
      ]);
      console.log(`Updated WebACL ${existing.Name}`);
    }
  } else {
    console.log(`WebACL ${existing.Name} already matches desired config`);
  }

  return { arn: existing.ARN, id: existing.Id };
}

function ensureDistributionAssociation(distributionId, webAclArn, tmpDir) {
  const configResponse = runAwsJson([
    "cloudfront",
    "get-distribution-config",
    "--id",
    distributionId,
  ]);

  const currentArn = configResponse.DistributionConfig.WebACLId || "";
  if (currentArn === webAclArn) {
    console.log(`Distribution ${distributionId} already attached to ${webAclArn}`);
    return;
  }

  if (DRY_RUN) {
    console.log(`[dry-run] would attach ${webAclArn} to distribution ${distributionId}`);
    return;
  }

  configResponse.DistributionConfig.WebACLId = webAclArn;
  const configPath = writeTempJson(tmpDir, "distribution-config.json", configResponse.DistributionConfig);
  runAws([
    "cloudfront",
    "update-distribution",
    "--id",
    distributionId,
    "--if-match",
    configResponse.ETag,
    "--distribution-config",
    `file://${configPath}`,
  ]);
  console.log(`Attached ${webAclArn} to distribution ${distributionId}`);
}

function main() {
  const distribution = findDistributionByAlias(DISTRIBUTION_ALIAS);
  if (!distribution) {
    throw new Error(`No CloudFront distribution found for alias ${DISTRIBUTION_ALIAS}`);
  }
  ensureDistributionIsSafe(distribution);

  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "doneai-app-waf-"));
  try {
    const webAcl = ensureWebAcl(tmpDir);
    ensureDistributionAssociation(distribution.Id, webAcl.arn, tmpDir);
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
}

main();
