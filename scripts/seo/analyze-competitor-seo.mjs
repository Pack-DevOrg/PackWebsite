#!/usr/bin/env node
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { gunzipSync } from "node:zlib";
import { analyzeSeoOpportunities } from "./seo-opportunity-engine.mjs";

const DEFAULT_OUTPUT_DIR = "seo";
const DEFAULT_MAX_SITEMAP_URLS = 2500;
const DEFAULT_MAX_PAGE_FETCHES = 18;
const REQUEST_TIMEOUT_MS = 10000;
const STOP_WORDS = new Set([
  "about",
  "after",
  "also",
  "and",
  "are",
  "booking",
  "com",
  "for",
  "from",
  "have",
  "https",
  "into",
  "more",
  "our",
  "the",
  "this",
  "travel",
  "trip",
  "with",
  "www",
  "you",
  "your"
]);

function readJson(filePath) {
  return JSON.parse(readFileSync(filePath, "utf8"));
}

function normalizeWhitespace(value) {
  return value.replace(/\s+/g, " ").trim();
}

function stripTags(value) {
  return normalizeWhitespace(
    value
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ")
      .replace(/<[^>]+>/g, " ")
  );
}

function decodeHtmlEntities(value) {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, "\"")
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ");
}

function tokenize(value) {
  return decodeHtmlEntities(value)
    .toLowerCase()
    .replace(/[^a-z0-9\s/-]/g, " ")
    .split(/\s+/)
    .map((token) => token.replace(/^[-/]+|[-/]+$/g, ""))
    .filter((token) => token.length > 2 && !STOP_WORDS.has(token));
}

function getOriginUrl(origin, path) {
  return new URL(path, origin).toString();
}

async function fetchText(url, options = {}) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), options.timeoutMs ?? REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      redirect: "follow",
      headers: {
        "User-Agent": "PackWebsite SEO competitor analyzer",
        Accept: "text/html,application/xhtml+xml,application/xml,text/xml,text/plain;q=0.9,*/*;q=0.8"
      }
    });
    const buffer = Buffer.from(await response.arrayBuffer());
    const isGzip =
      /\.gz(?:\?|$)/i.test(response.url) ||
      /gzip/i.test(response.headers.get("content-encoding") ?? "") ||
      /gzip/i.test(response.headers.get("content-type") ?? "");
    let text = buffer.toString("utf8");
    if (isGzip) {
      try {
        text = gunzipSync(buffer).toString("utf8");
      } catch {
        text = buffer.toString("utf8");
      }
    }

    return {
      ok: response.ok,
      status: response.status,
      finalUrl: response.url,
      contentType: response.headers.get("content-type") ?? "",
      text
    };
  } catch (error) {
    return {
      ok: false,
      status: 0,
      finalUrl: url,
      contentType: "",
      text: "",
      error: error instanceof Error ? error.message : "Unknown fetch error"
    };
  } finally {
    clearTimeout(timeoutId);
  }
}

function extractXmlLocs(xml) {
  const locs = [];
  const locPattern = /<loc>([^<]+)<\/loc>/gi;
  let match = locPattern.exec(xml);

  while (match) {
    locs.push(decodeHtmlEntities(match[1].trim()));
    match = locPattern.exec(xml);
  }

  return locs;
}

function extractPlainTextUrls(text) {
  return text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => /^https?:\/\//i.test(line));
}

function extractSitemapEntries(text) {
  return [...new Set([...extractXmlLocs(text), ...extractPlainTextUrls(text)])];
}

function isSitemapUrl(url) {
  try {
    const pathname = new URL(url).pathname.toLowerCase();
    return (
      pathname.includes("sitemap") ||
      pathname.endsWith(".xml") ||
      pathname.endsWith(".xml.gz") ||
      pathname.endsWith(".txt")
    );
  } catch {
    return false;
  }
}

function extractRobotsSitemaps(robotsText) {
  return robotsText
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => /^sitemap:/i.test(line))
    .map((line) => line.replace(/^sitemap:\s*/i, "").trim())
    .filter(Boolean);
}

function extractTitle(html) {
  const match = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  return match ? decodeHtmlEntities(normalizeWhitespace(match[1])) : "";
}

function extractMetaDescription(html) {
  const match = html.match(/<meta\s+[^>]*name=["']description["'][^>]*content=["']([^"']+)["'][^>]*>/i)
    ?? html.match(/<meta\s+[^>]*content=["']([^"']+)["'][^>]*name=["']description["'][^>]*>/i);
  return match ? decodeHtmlEntities(normalizeWhitespace(match[1])) : "";
}

function extractH1s(html) {
  const headings = [];
  const pattern = /<h1[^>]*>([\s\S]*?)<\/h1>/gi;
  let match = pattern.exec(html);

  while (match && headings.length < 5) {
    headings.push(decodeHtmlEntities(stripTags(match[1])));
    match = pattern.exec(html);
  }

  return headings.filter(Boolean);
}

function extractCanonical(html) {
  const match = html.match(/<link\s+[^>]*rel=["']canonical["'][^>]*href=["']([^"']+)["'][^>]*>/i)
    ?? html.match(/<link\s+[^>]*href=["']([^"']+)["'][^>]*rel=["']canonical["'][^>]*>/i);
  return match ? decodeHtmlEntities(match[1]) : "";
}

function extractSchemaTypes(html) {
  const types = new Set();
  const jsonLdPattern = /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let match = jsonLdPattern.exec(html);

  function collectTypes(node) {
    if (!node || typeof node !== "object") {
      return;
    }

    if (Array.isArray(node)) {
      node.forEach(collectTypes);
      return;
    }

    const type = node["@type"];
    if (Array.isArray(type)) {
      type.forEach((entry) => types.add(String(entry)));
    } else if (type) {
      types.add(String(type));
    }

    if (Array.isArray(node["@graph"])) {
      node["@graph"].forEach(collectTypes);
    }
  }

  while (match) {
    try {
      collectTypes(JSON.parse(match[1].trim()));
    } catch {
      // Invalid third-party JSON-LD should not stop competitive analysis.
    }
    match = jsonLdPattern.exec(html);
  }

  return [...types].sort();
}

function summarizePage(url, response) {
  const html = response.text;

  return {
    url,
    finalUrl: response.finalUrl,
    status: response.status,
    ok: response.ok,
    title: extractTitle(html),
    description: extractMetaDescription(html),
    h1s: extractH1s(html),
    canonical: extractCanonical(html),
    schemaTypes: extractSchemaTypes(html),
    wordCount: tokenize(stripTags(html)).length,
    text: stripTags(html).slice(0, 18000)
  };
}

function scoreTextCoverage(text, keyword) {
  const keywordTokens = tokenize(keyword);
  if (keywordTokens.length === 0) {
    return 0;
  }

  const textTokens = new Set(tokenize(text));
  const matched = keywordTokens.filter((token) => textTokens.has(token)).length;
  const exactBonus = text.toLowerCase().includes(keyword.toLowerCase()) ? 0.35 : 0;

  return Math.min(1, matched / keywordTokens.length * 0.65 + exactBonus);
}

function getPathSegments(urls, origin) {
  const counts = new Map();

  for (const url of urls) {
    try {
      const parsed = new URL(url);
      if (parsed.origin !== origin) {
        continue;
      }

      const first = parsed.pathname.split("/").filter(Boolean)[0] ?? "/";
      counts.set(first, (counts.get(first) ?? 0) + 1);
    } catch {
      // Ignore invalid sitemap entries.
    }
  }

  return [...counts.entries()]
    .sort((left, right) => right[1] - left[1])
    .slice(0, 14)
    .map(([segment, count]) => ({ segment, count }));
}

function getUrlKeywordCorpus(urls) {
  return urls
    .slice(0, DEFAULT_MAX_SITEMAP_URLS)
    .map((url) => {
      try {
        const parsed = new URL(url);
        return parsed.pathname.replace(/[-_/]/g, " ");
      } catch {
        return "";
      }
    })
    .join(" ");
}

function getTopicKeywords(seedTopics) {
  return seedTopics.topicClusters.flatMap((cluster) =>
    cluster.keywords.map((keyword) => ({
      keyword,
      clusterId: cluster.id,
      clusterLabel: cluster.label,
      priority: cluster.priority
    }))
  );
}

function selectSitemapPages(competitor, sitemapUrls, seedTopics, maxPageFetches) {
  const origin = competitor.origin;
  const preferredTerms = [
    competitor.id,
    "ai",
    "planner",
    "itinerary",
    "business-travel",
    "expense",
    "guide",
    "blog",
    "destination",
    "things-to-do",
    "travel-management",
    ...seedTopics.topicClusters.flatMap((cluster) => cluster.id.split("-"))
  ];
  const scored = [];

  for (const url of sitemapUrls) {
    try {
      const parsed = new URL(url);
      if (parsed.origin !== origin) {
        continue;
      }

      const path = parsed.pathname.toLowerCase();
      const score = preferredTerms.reduce(
        (sum, term) => sum + (path.includes(term.toLowerCase()) ? 1 : 0),
        0
      );

      if (score > 0) {
        scored.push({ url, score });
      }
    } catch {
      // Ignore invalid sitemap entries.
    }
  }

  return scored
    .sort((left, right) => right.score - left.score)
    .slice(0, maxPageFetches)
    .map((entry) => entry.url);
}

async function collectSitemapUrls(competitor, robotsText, maxSitemapUrls) {
  const sitemapCandidates = [
    ...extractRobotsSitemaps(robotsText),
    getOriginUrl(competitor.origin, "/sitemap.xml"),
    getOriginUrl(competitor.origin, "/sitemap_index.xml"),
    getOriginUrl(competitor.origin, "/global/sitemap")
  ];
  const seenSitemaps = new Set();
  const urls = [];
  const sitemapStatus = [];

  for (const sitemapUrl of sitemapCandidates) {
    if (seenSitemaps.has(sitemapUrl) || urls.length >= maxSitemapUrls) {
      continue;
    }
    seenSitemaps.add(sitemapUrl);

    const response = await fetchText(sitemapUrl, { timeoutMs: REQUEST_TIMEOUT_MS });
    sitemapStatus.push({
      url: sitemapUrl,
      status: response.status,
      ok: response.ok,
      contentType: response.contentType
    });

    if (!response.ok) {
      continue;
    }

    const locs = extractSitemapEntries(response.text);
    const nestedSitemaps = locs.filter(isSitemapUrl).slice(0, 16);
    const pageUrls = locs.filter((loc) => !isSitemapUrl(loc));
    urls.push(...pageUrls);

    for (const nestedUrl of nestedSitemaps) {
      if (seenSitemaps.has(nestedUrl) || urls.length >= maxSitemapUrls) {
        continue;
      }
      seenSitemaps.add(nestedUrl);
      const nestedResponse = await fetchText(nestedUrl, { timeoutMs: REQUEST_TIMEOUT_MS });
      sitemapStatus.push({
        url: nestedUrl,
        status: nestedResponse.status,
        ok: nestedResponse.ok,
        contentType: nestedResponse.contentType
      });

      if (nestedResponse.ok) {
        urls.push(...extractSitemapEntries(nestedResponse.text).filter((loc) => !isSitemapUrl(loc)));
      }
    }
  }

  return {
    urls: [...new Set(urls)].slice(0, maxSitemapUrls),
    sitemapStatus
  };
}

function inferStrengths(competitor, pages, sitemapUrls, pathSegments, schemaTypes) {
  const corpus = [
    ...pages.map((page) => `${page.title} ${page.description} ${page.h1s.join(" ")} ${page.text}`),
    getUrlKeywordCorpus(sitemapUrls)
  ].join(" ").toLowerCase();
  const strengths = [];

  if (sitemapUrls.length >= 1000) {
    strengths.push(`Large indexed URL surface sampled from sitemaps (${sitemapUrls.length}+ URLs observed).`);
  }

  if (pathSegments.some((entry) => /blog|guide|article|resources|travel-guide/i.test(entry.segment))) {
    strengths.push("Dedicated editorial or guide directory structure.");
  }

  if (pathSegments.some((entry) => /hotel|stays|destination|things|attractions|flights|cars/i.test(entry.segment))) {
    strengths.push("Programmatic travel inventory or destination landing pages.");
  }

  if (/ai|artificial intelligence|planner|itinerary/.test(corpus)) {
    strengths.push("Visible AI/planning language in crawlable page copy or URL paths.");
  }

  if (/business travel|corporate travel|expense|travel management/.test(corpus)) {
    strengths.push("Business-travel and expense-management authority content.");
  }

  if (schemaTypes.length > 0) {
    strengths.push(`Structured data types observed: ${schemaTypes.slice(0, 8).join(", ")}.`);
  }

  if (competitor.category.includes("OTA")) {
    strengths.push("High-authority transactional marketplace footprint across flights, hotels, packages, and destinations.");
  }

  return strengths.length > 0 ? strengths : ["No strong public SEO pattern detected from accessible pages."];
}

function buildCompetitorKeywordCoverage(competitor, pages, sitemapUrls, seedTopics) {
  const textCorpus = [
    ...pages.map((page) => `${page.title} ${page.description} ${page.h1s.join(" ")} ${page.text}`),
    getUrlKeywordCorpus(sitemapUrls)
  ].join(" ");

  return getTopicKeywords(seedTopics)
    .map((entry) => ({
      ...entry,
      coverage: Number(scoreTextCoverage(textCorpus, entry.keyword).toFixed(2))
    }))
    .filter((entry) => entry.coverage >= 0.35)
    .sort((left, right) => right.coverage - left.coverage || right.priority - left.priority);
}

function buildPackGapMatrix(packReport, competitorReports, seedTopics) {
  const packKeywordMap = new Map(
    packReport.keywordOpportunities.map((opportunity) => [
      opportunity.keyword,
      opportunity.currentBestCoverage
    ])
  );
  const keywordEntries = getTopicKeywords(seedTopics);

  return keywordEntries.map((entry) => {
    const competitorCoverage = competitorReports
      .map((competitor) => {
        const coverage = competitor.keywordCoverage.find(
          (item) => item.keyword === entry.keyword
        )?.coverage ?? 0;
        return {
          competitorId: competitor.id,
          competitorName: competitor.name,
          coverage
        };
      })
      .filter((item) => item.coverage > 0)
      .sort((left, right) => right.coverage - left.coverage);
    const bestCompetitorCoverage = competitorCoverage[0]?.coverage ?? 0;
    const packCoverage = packKeywordMap.get(entry.keyword) ?? 0;

    return {
      keyword: entry.keyword,
      clusterId: entry.clusterId,
      clusterLabel: entry.clusterLabel,
      packCoverage,
      bestCompetitorCoverage,
      leaders: competitorCoverage.slice(0, 4),
      gapScore: Math.round(
        entry.priority * 10 +
          Math.max(0, bestCompetitorCoverage - packCoverage) * 60 +
          (packCoverage < 0.45 ? 20 : 0)
      )
    };
  }).sort((left, right) => right.gapScore - left.gapScore);
}

function buildStrategicGaps(gapMatrix, competitorReports) {
  const topClusters = new Map();

  for (const gap of gapMatrix.slice(0, 30)) {
    topClusters.set(gap.clusterLabel, (topClusters.get(gap.clusterLabel) ?? 0) + 1);
  }

  const competitorStrengths = competitorReports.flatMap((competitor) =>
    competitor.strengths.map((strength) => `${competitor.name}: ${strength}`)
  );

  return [
    {
      priority: "critical",
      gap: "Own the AI travel planning category with direct comparison and proof pages.",
      evidence: gapMatrix
        .filter((gap) => gap.clusterId === "ai-travel-planning")
        .slice(0, 6)
        .map((gap) => `${gap.keyword}: Pack ${gap.packCoverage}, best competitor ${gap.bestCompetitorCoverage}`),
      action:
        "Build a strong /ai-travel-planner or /guides/ai-travel-planning page with screenshots, workflow proof, FAQs, and comparison sections for Mindtrip, Layla, TripIt, Expedia, Booking, and Navan."
    },
    {
      priority: "critical",
      gap: "Trip organization and email-confirmation organization are under-owned by Pack relative to itinerary organizer competitors.",
      evidence: gapMatrix
        .filter((gap) => gap.clusterId === "trip-organization")
        .slice(0, 6)
        .map((gap) => `${gap.keyword}: leaders ${gap.leaders.map((leader) => leader.competitorName).join(", ") || "none detected"}`),
      action:
        "Turn /travel-history and /upcoming-trip-details into stronger itinerary-organizer pages, then add a focused guide targeting travel itinerary organizer, trip organizer app, and email itinerary organizer."
    },
    {
      priority: "high",
      gap: "Pack has no programmatic destination or city inventory moat like OTAs and consumer planners.",
      evidence: competitorStrengths.filter((strength) => /Programmatic|inventory|marketplace|destination/i.test(strength)).slice(0, 8),
      action:
        "Avoid shallow destination spam. Use Pack-owned utility data instead: TSA airport pages, live wait time explainers, public event planning examples, and benchmark pages."
    },
    {
      priority: "high",
      gap: "Business-travel language is weak against Navan and TravelPerk.",
      evidence: competitorStrengths.filter((strength) => /Business-travel|expense|corporate/i.test(strength)).slice(0, 6),
      action:
        "Add business-traveler and executive-assistant angles to existing capability pages before creating B2B landing pages."
    },
    {
      priority: "medium",
      gap: "GEO answer readiness should be expanded around comparison questions, not AI-only markup.",
      evidence: [...topClusters.entries()].map(([cluster, count]) => `${cluster}: ${count} high-gap terms`),
      action:
        "Add visible answers for comparison, use-case, and how-it-works questions; keep structured data representative of visible content."
    }
  ];
}

async function analyzeCompetitor(competitor, seedTopics, options) {
  const robotsUrl = getOriginUrl(competitor.origin, "/robots.txt");
  const robotsResponse = await fetchText(robotsUrl, { timeoutMs: REQUEST_TIMEOUT_MS });
  const sitemapCollection = await collectSitemapUrls(
    competitor,
    robotsResponse.text,
    options.maxSitemapUrls
  );
  const selectedSitemapPages = selectSitemapPages(
    competitor,
    sitemapCollection.urls,
    seedTopics,
    options.maxPageFetches
  );
  const pageUrls = [
    ...competitor.seedPaths.map((path) => getOriginUrl(competitor.origin, path)),
    ...selectedSitemapPages
  ];
  const uniquePageUrls = [...new Set(pageUrls)].slice(0, options.maxPageFetches);
  const pages = [];

  for (const url of uniquePageUrls) {
    const response = await fetchText(url, { timeoutMs: REQUEST_TIMEOUT_MS });
    pages.push(summarizePage(url, response));
  }

  const schemaTypes = [...new Set(pages.flatMap((page) => page.schemaTypes))].sort();
  const pathSegments = getPathSegments(sitemapCollection.urls, competitor.origin);

  return {
    id: competitor.id,
    name: competitor.name,
    origin: competitor.origin,
    category: competitor.category,
    priority: competitor.priority,
    robots: {
      url: robotsUrl,
      status: robotsResponse.status,
      ok: robotsResponse.ok,
      sitemapCount: extractRobotsSitemaps(robotsResponse.text).length,
      error: robotsResponse.error
    },
    sitemapStatus: sitemapCollection.sitemapStatus,
    sitemapUrlCount: sitemapCollection.urls.length,
    topPathSegments: pathSegments,
    fetchedPages: pages.map((page) => ({
      url: page.url,
      finalUrl: page.finalUrl,
      status: page.status,
      ok: page.ok,
      title: page.title,
      description: page.description,
      h1s: page.h1s,
      canonical: page.canonical,
      schemaTypes: page.schemaTypes,
      wordCount: page.wordCount
    })),
    schemaTypes,
    keywordCoverage: buildCompetitorKeywordCoverage(
      competitor,
      pages,
      sitemapCollection.urls,
      seedTopics
    ).slice(0, 24),
    strengths: inferStrengths(competitor, pages, sitemapCollection.urls, pathSegments, schemaTypes),
    crawlLimitations: pages
      .filter((page) => !page.ok)
      .map((page) => `${page.url} returned ${page.status}`)
      .slice(0, 8)
  };
}

export async function analyzeCompetitorSeo(options = {}) {
  const rootDir = resolve(options.rootDir ?? process.cwd());
  const seedTopics = readJson(resolve(rootDir, "seo/seed-topics.json"));
  const competitorConfig = readJson(resolve(rootDir, "seo/competitors.json"));
  const competitors = options.competitors?.length
    ? competitorConfig.competitors.filter((competitor) =>
        options.competitors.includes(competitor.id)
      )
    : competitorConfig.competitors;
  const packReport = await analyzeSeoOpportunities({ rootDir });
  const competitorReports = [];

  for (const competitor of competitors) {
    competitorReports.push(await analyzeCompetitor(competitor, seedTopics, {
      maxSitemapUrls: options.maxSitemapUrls ?? DEFAULT_MAX_SITEMAP_URLS,
      maxPageFetches: options.maxPageFetches ?? DEFAULT_MAX_PAGE_FETCHES
    }));
  }

  const packGapMatrix = buildPackGapMatrix(packReport, competitorReports, seedTopics);

  return {
    generatedAt: new Date().toISOString(),
    methodology: {
      maxSitemapUrls: options.maxSitemapUrls ?? DEFAULT_MAX_SITEMAP_URLS,
      maxPageFetches: options.maxPageFetches ?? DEFAULT_MAX_PAGE_FETCHES,
      note:
        "Public technical SEO crawl based on robots.txt, sitemap URLs, selected public pages, visible metadata, URL structures, and Pack seed-topic coverage. It is not a paid rank/traffic/backlink database."
    },
    competitors: competitorReports,
    packGapMatrix,
    strategicGaps: buildStrategicGaps(packGapMatrix, competitorReports)
  };
}

function renderList(items, renderItem) {
  if (items.length === 0) {
    return "- None observed.";
  }

  return items.map((item) => `- ${renderItem(item)}`).join("\n");
}

function renderNumbered(items, renderItem) {
  if (items.length === 0) {
    return "1. None observed.";
  }

  return items.map((item, index) => `${index + 1}. ${renderItem(item)}`).join("\n");
}

export function renderCompetitorMarkdown(report) {
  const topGaps = report.packGapMatrix.slice(0, 25);

  return `# PackWebsite Competitor SEO Gap Analysis

Generated: ${report.generatedAt}

Methodology: ${report.methodology.note}

## Strategic Gaps

${renderNumbered(report.strategicGaps, (gap) => `**${gap.priority}**: ${gap.gap} ${gap.action} Evidence: ${gap.evidence.join("; ")}`)}

## Highest Keyword Gaps

${renderNumbered(topGaps, (gap) => `**${gap.keyword}** (${gap.clusterLabel}) - Pack coverage ${gap.packCoverage}, best competitor ${gap.bestCompetitorCoverage}. Leaders: ${gap.leaders.map((leader) => `${leader.competitorName} ${leader.coverage}`).join(", ") || "none detected"}. Gap score: ${gap.gapScore}`)}

## Competitor Breakdowns

${report.competitors.map((competitor) => `### ${competitor.name}

- Origin: ${competitor.origin}
- Category: ${competitor.category}
- Robots: ${competitor.robots.ok ? "accessible" : `limited (${competitor.robots.status || competitor.robots.error})`}
- Sitemap URLs sampled: ${competitor.sitemapUrlCount}
- Fetched pages: ${competitor.fetchedPages.filter((page) => page.ok).length}/${competitor.fetchedPages.length}
- Top path segments: ${competitor.topPathSegments.map((entry) => `${entry.segment} (${entry.count})`).join(", ") || "none"}
- Schema types: ${competitor.schemaTypes.join(", ") || "none observed"}

Strengths:
${renderList(competitor.strengths, (strength) => strength)}

Keyword coverage observed:
${renderList(competitor.keywordCoverage.slice(0, 10), (coverage) => `${coverage.keyword} (${coverage.clusterLabel}) coverage ${coverage.coverage}`)}

Representative fetched pages:
${renderList(competitor.fetchedPages.slice(0, 8), (page) => `${page.status} ${page.url} - ${page.title || "No title"}`)}

Crawl limitations:
${renderList(competitor.crawlLimitations, (limitation) => limitation)}
`).join("\n")}
`;
}

export function writeCompetitorReport(report, options = {}) {
  const rootDir = resolve(options.rootDir ?? process.cwd());
  const outputDir = resolve(rootDir, options.outputDir ?? DEFAULT_OUTPUT_DIR);
  mkdirSync(outputDir, { recursive: true });

  const jsonPath = join(outputDir, "competitor-analysis.json");
  const markdownPath = join(outputDir, "competitor-analysis.md");
  writeFileSync(jsonPath, `${JSON.stringify(report, null, 2)}\n`);
  writeFileSync(markdownPath, renderCompetitorMarkdown(report));

  return { jsonPath, markdownPath };
}

function parseArgs(argv) {
  const options = {
    rootDir: process.cwd(),
    outputDir: DEFAULT_OUTPUT_DIR,
    maxSitemapUrls: DEFAULT_MAX_SITEMAP_URLS,
    maxPageFetches: DEFAULT_MAX_PAGE_FETCHES,
    competitors: []
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

    if (arg === "--max-sitemap-urls") {
      options.maxSitemapUrls = Number(argv[index + 1]);
      index += 1;
      continue;
    }

    if (arg === "--max-page-fetches") {
      options.maxPageFetches = Number(argv[index + 1]);
      index += 1;
      continue;
    }

    if (arg === "--competitors") {
      options.competitors = argv[index + 1].split(",").map((value) => value.trim()).filter(Boolean);
      index += 1;
      continue;
    }

    throw new Error(`Unknown option: ${arg}`);
  }

  return options;
}

if (process.argv[1] && process.argv[1].endsWith("analyze-competitor-seo.mjs")) {
  const options = parseArgs(process.argv.slice(2));
  analyzeCompetitorSeo(options)
    .then((report) => {
      const output = writeCompetitorReport(report, options);
      console.log(`[seo:competitors] Competitors analyzed: ${report.competitors.length}`);
      console.log(`[seo:competitors] Gap keywords: ${report.packGapMatrix.length}`);
      console.log(`[seo:competitors] Wrote ${output.jsonPath}`);
      console.log(`[seo:competitors] Wrote ${output.markdownPath}`);
    })
    .catch((error) => {
      console.error("[seo:competitors] Failed", error?.message ?? error);
      if (error?.stack) {
        console.error(error.stack);
      }
      process.exit(1);
    });
}
