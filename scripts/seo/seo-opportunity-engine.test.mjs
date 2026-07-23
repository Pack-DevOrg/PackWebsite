import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

import {
  analyzeSeoOpportunities,
  buildRenderedHtmlFindings,
  hasBlockingFindings,
  renderMarkdownReport
} from "./seo-opportunity-engine.mjs";
import { renderCompetitorMarkdown } from "./analyze-competitor-seo.mjs";

function createFixtureSite() {
  const rootDir = mkdtempSync(join(tmpdir(), "pack-seo-"));
  mkdirSync(join(rootDir, "public"), { recursive: true });
  mkdirSync(join(rootDir, "src/pages"), { recursive: true });
  mkdirSync(join(rootDir, "scripts"), { recursive: true });
  mkdirSync(join(rootDir, "seo"), { recursive: true });

  writeFileSync(
    join(rootDir, "seo/seed-topics.json"),
    JSON.stringify({
      brandTerms: ["Pack"],
      audiences: ["business travelers"],
      competitorTerms: ["TripIt"],
      contentFormats: ["how-to"],
      topicClusters: [
        {
          id: "ai-travel-planning",
          label: "AI travel planning",
          priority: 10,
          intent: "commercial",
          keywords: ["AI travel planner", "calendar travel planner"],
          questions: ["Can AI turn calendar events into trips?"],
          preferredPages: ["/"]
        }
      ],
      outreachAngles: [
        {
          id: "roundups",
          label: "Roundups",
          queries: ["\"AI travel planner\""],
          pitch: "Pitch Pack."
        }
      ]
    })
  );
  writeFileSync(
    join(rootDir, "public/index.md"),
    "# Pack\n\nPack is an AI travel assistant for trip planning."
  );
  writeFileSync(
    join(rootDir, "public/llms.txt"),
    "# Pack\n\n## Capability Pages\n\n- Home: https://www.trypackai.com/"
  );
  writeFileSync(
    join(rootDir, "public/robots.txt"),
    "User-agent: *\nAllow: /\nSitemap: https://www.trypackai.com/sitemap.xml\n"
  );
  writeFileSync(
    join(rootDir, "public/sitemap.xml"),
    "<urlset><url><loc>https://www.trypackai.com/</loc></url></urlset>"
  );
  writeFileSync(
    join(rootDir, "scripts/prerender.mjs"),
    "const routesToPrerender = [\"/\"];"
  );
  writeFileSync(
    join(rootDir, "src/pages/Home.tsx"),
    "const hero = \"AI travel planner that turns calendar events into trips\";"
  );

  return rootDir;
}

test("analyzes keyword, content, GEO, and outreach opportunities", async () => {
  const report = await analyzeSeoOpportunities({ rootDir: createFixtureSite() });

  assert.equal(report.keywordOpportunities.length, 2);
  assert.equal(report.contentOpportunities.length, 1);
  assert.equal(report.generativeEngineOpportunities.length, 3);
  assert.equal(report.outreachOpportunities.length, 1);
  assert.deepEqual(report.articleProspects, []);
  assert.equal(hasBlockingFindings(report), false);
});

test("renders a readable markdown report", async () => {
  const report = await analyzeSeoOpportunities({ rootDir: createFixtureSite() });
  const markdown = renderMarkdownReport(report);

  assert.match(markdown, /Keyword Opportunities/);
  assert.match(markdown, /GEO Opportunities/);
  assert.match(markdown, /Article Prospects/);
  assert.match(markdown, /Guidance Used/);
});

test("renders competitor gap analysis markdown", () => {
  const markdown = renderCompetitorMarkdown({
    generatedAt: "2026-05-12T00:00:00.000Z",
    methodology: {
      note: "Fixture methodology."
    },
    strategicGaps: [
      {
        priority: "critical",
        gap: "Own AI trip planning.",
        action: "Build proof-led pages.",
        evidence: ["AI trip planner: Pack 0.5, competitor 1"]
      }
    ],
    packGapMatrix: [
      {
        keyword: "AI trip planner",
        clusterLabel: "AI travel planning",
        packCoverage: 0.5,
        bestCompetitorCoverage: 1,
        leaders: [{ competitorName: "Example", coverage: 1 }],
        gapScore: 120
      }
    ],
    competitors: [
      {
        name: "Example",
        origin: "https://example.test",
        category: "AI trip planner",
        robots: { ok: true },
        sitemapUrlCount: 2,
        fetchedPages: [
          {
            ok: true,
            status: 200,
            url: "https://example.test/",
            title: "Example planner"
          }
        ],
        topPathSegments: [{ segment: "blog", count: 1 }],
        schemaTypes: ["WebSite"],
        strengths: ["Visible AI planning language."],
        keywordCoverage: [
          {
            keyword: "AI trip planner",
            clusterLabel: "AI travel planning",
            coverage: 1
          }
        ],
        crawlLimitations: []
      }
    ]
  });

  assert.match(markdown, /Competitor SEO Gap Analysis/);
  assert.match(markdown, /Highest Keyword Gaps/);
  assert.match(markdown, /Example planner/);
});

test("lints rendered dist HTML for head, breadcrumb, and article-date regressions", async () => {
  const rootDir = createFixtureSite();
  mkdirSync(join(rootDir, "dist/guides/sample"), { recursive: true });
  mkdirSync(join(rootDir, "dist/do-not-sell"), { recursive: true });
  const head = (title, description) =>
    `<title>${title}</title>` +
    `<meta data-rh="true" name="description" content="${description}"/>` +
    `<link data-rh="true" rel="canonical" href="https://www.trypackai.com/x"/>`;
  const okDescription =
    "A sufficiently long meta description that lands inside the allowed range for the check.";
  writeFileSync(
    join(rootDir, "dist/index.html"),
    `<html><head>${head("Pack", okDescription)}</head><body></body></html>`
  );
  writeFileSync(
    join(rootDir, "dist/guides/sample/index.html"),
    "<html><head>" +
      head(
        "A rendered guide title that is far too long for search results and truncates badly",
        okDescription
      ) +
      '<script type="application/ld+json">{"@type":"Article","headline":"x"}</script>' +
      "</head><body></body></html>"
  );
  writeFileSync(
    join(rootDir, "dist/do-not-sell/index.html"),
    "<html><head><title>Redirect</title></head><body></body></html>"
  );

  const findings = await buildRenderedHtmlFindings(rootDir);
  const titles = findings.map((finding) => finding.title);

  assert.ok(titles.some((title) => title.includes("exceed 65 characters")));
  assert.ok(titles.some((title) => title.includes("missing BreadcrumbList")));
  assert.ok(titles.some((title) => title.includes("missing dateModified")));
  assert.ok(
    titles.some((title) => title.includes("noindex rendered without a noindex robots meta"))
  );
  assert.ok(
    findings.some(
      (finding) =>
        finding.severity === "critical" &&
        finding.title.includes("missing title, description, or canonical")
    )
  );
});

test("skips rendered HTML checks with an info finding when dist is absent", async () => {
  const rootDir = createFixtureSite();
  const findings = await buildRenderedHtmlFindings(rootDir);

  assert.equal(findings.length, 1);
  assert.equal(findings[0].severity, "info");
});
