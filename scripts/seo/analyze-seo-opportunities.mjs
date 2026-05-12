#!/usr/bin/env node
import {
  analyzeSeoOpportunities,
  hasBlockingFindings,
  writeSeoReport
} from "./seo-opportunity-engine.mjs";

function parseArgs(argv) {
  const options = {
    rootDir: process.cwd(),
    outputDir: "seo",
    failOnCritical: false,
    discoverArticles: false
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

    if (arg === "--root") {
      options.rootDir = argv[index + 1];
      index += 1;
      continue;
    }

    if (arg === "--out-dir") {
      options.outputDir = argv[index + 1];
      index += 1;
      continue;
    }

    if (arg === "--fail-on-critical") {
      options.failOnCritical = true;
      continue;
    }

    if (arg === "--discover-articles") {
      options.discoverArticles = true;
      continue;
    }

    throw new Error(`Unknown option: ${arg}`);
  }

  return options;
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const report = await analyzeSeoOpportunities({
    rootDir: options.rootDir,
    discoverArticles: options.discoverArticles
  });
  const output = writeSeoReport(report, {
    rootDir: options.rootDir,
    outputDir: options.outputDir
  });

  console.log(`[seo] Scanned ${report.inventory.scannedPages} pages`);
  console.log(`[seo] Keyword opportunities: ${report.keywordOpportunities.length}`);
  console.log(`[seo] Content opportunities: ${report.contentOpportunities.length}`);
  console.log(`[seo] Outreach angles: ${report.outreachOpportunities.length}`);
  console.log(`[seo] Article prospects: ${report.articleProspects.length}`);
  console.log(`[seo] Technical findings: ${report.technicalFindings.length}`);
  console.log(`[seo] Wrote ${output.jsonPath}`);
  console.log(`[seo] Wrote ${output.markdownPath}`);

  if (options.failOnCritical && hasBlockingFindings(report)) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error("[seo] Failed to analyze opportunities", error?.message ?? error);
  if (error?.stack) {
    console.error(error.stack);
  }
  process.exit(1);
});
