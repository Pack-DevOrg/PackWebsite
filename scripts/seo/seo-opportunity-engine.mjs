import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { readdir } from "node:fs/promises";
import { basename, dirname, extname, join, relative, resolve } from "node:path";

const SITE_ORIGIN = "https://www.trypackai.com";
const DEFAULT_OUTPUT_DIR = "seo";
const STOP_WORDS = new Set([
  "a",
  "about",
  "across",
  "after",
  "all",
  "an",
  "and",
  "app",
  "are",
  "as",
  "at",
  "be",
  "best",
  "but",
  "by",
  "can",
  "for",
  "from",
  "how",
  "in",
  "into",
  "is",
  "it",
  "of",
  "on",
  "or",
  "that",
  "the",
  "their",
  "this",
  "to",
  "travel",
  "trip",
  "with",
  "what",
  "when",
  "where",
  "why",
  "you",
  "your"
]);

const OFFICIAL_GUIDANCE = [
  {
    source: "Google Search Central",
    checkedOn: "2026-05-12",
    url: "https://developers.google.com/search/docs/appearance/ai-features",
    principle:
      "AI Overviews and AI Mode rely on foundational SEO: crawlable pages, internal links, page experience, textual content, matching structured data, and eligible snippets."
  },
  {
    source: "Google Search Central",
    checkedOn: "2026-05-12",
    url: "https://developers.google.com/search/docs/fundamentals/using-gen-ai-content",
    principle:
      "Automation is useful for research and structure, but scaled generated pages without added user value can violate spam policies."
  },
  {
    source: "Google Search Central",
    checkedOn: "2026-05-12",
    url: "https://developers.google.com/search/docs/appearance/structured-data/sd-policies",
    principle:
      "Structured data should use JSON-LD, describe visible page content, and avoid misleading or irrelevant markup."
  },
  {
    source: "Google Search Central",
    checkedOn: "2026-05-12",
    url: "https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls",
    principle:
      "Canonical URLs should be consistent across rel=canonical and sitemap inclusion."
  }
];

const INTENTIONALLY_NOINDEX_ROUTES = new Set([
  "/do-not-sell",
  "/oauth/callback",
  "/privacy-request",
  "/privacy-request/access",
  "/privacy-request/correction",
  "/privacy-request/delete",
  "/privacy-request/limit",
  "/privacy-request/opt-out",
  "/privacy-request/verify",
  "/setup/email-forwarding",
  "/share",
  "/unsubscribe"
]);

function readJson(filePath) {
  return JSON.parse(readFileSync(filePath, "utf8"));
}

function readTextIfExists(filePath) {
  return existsSync(filePath) ? readFileSync(filePath, "utf8") : "";
}

async function walkFiles(rootDir, extensions) {
  const output = [];

  async function walk(currentDir) {
    const entries = await readdir(currentDir, { withFileTypes: true });

    for (const entry of entries) {
      const entryPath = join(currentDir, entry.name);

      if (entry.isDirectory()) {
        if (entry.name === "node_modules" || entry.name === "dist" || entry.name === "dist-ssr") {
          continue;
        }
        await walk(entryPath);
        continue;
      }

      if (extensions.has(extname(entry.name))) {
        output.push(entryPath);
      }
    }
  }

  await walk(rootDir);
  return output.sort();
}

function normalizeWhitespace(value) {
  return value.replace(/\s+/g, " ").trim();
}

function stripMarkdown(value) {
  return normalizeWhitespace(
    value
      .replace(/```[\s\S]*?```/g, " ")
      .replace(/`([^`]+)`/g, "$1")
      .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
      .replace(/[#>*_~|-]/g, " ")
  );
}

function extractQuotedStrings(source) {
  const values = [];
  const stringPattern = /(?:"([^"\\]*(?:\\.[^"\\]*)*)"|'([^'\\]*(?:\\.[^'\\]*)*)'|`([^`\\]*(?:\\.[^`\\]*)*)`)/g;
  let match = stringPattern.exec(source);

  while (match) {
    const value = match[1] ?? match[2] ?? match[3] ?? "";
    const cleaned = normalizeWhitespace(value.replace(/\\n/g, " "));
    if (
      cleaned.length >= 24 &&
      !cleaned.includes("http") &&
      !cleaned.includes("@/") &&
      !cleaned.includes("data:image")
    ) {
      values.push(cleaned);
    }
    match = stringPattern.exec(source);
  }

  return values;
}

function extractSitemapUrls(sitemapXml) {
  const urls = [];
  const locPattern = /<loc>([^<]+)<\/loc>/g;
  let match = locPattern.exec(sitemapXml);

  while (match) {
    urls.push(match[1]);
    match = locPattern.exec(sitemapXml);
  }

  return urls;
}

function extractPrerenderRoutes(prerenderSource) {
  const routeBlock = prerenderSource.match(/const routesToPrerender = \[([\s\S]*?)\];/);
  if (!routeBlock) {
    return [];
  }

  const routes = [];
  const routePattern = /"([^"]+)"/g;
  let match = routePattern.exec(routeBlock[1]);

  while (match) {
    routes.push(match[1]);
    match = routePattern.exec(routeBlock[1]);
  }

  return routes;
}

function pathFromPublicMarkdown(filePath) {
  const slug = basename(filePath, ".md");

  if (slug === "index") {
    return "/";
  }

  if (slug === "PrivacyPolicy") {
    return "/privacy";
  }

  if (slug === "TermsOfService") {
    return "/terms";
  }

  return `/${slug}`;
}

function getHeading(markdown) {
  const heading = markdown.match(/^#\s+(.+)$/m);
  return heading ? normalizeWhitespace(heading[1]) : "";
}

function tokenize(value) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, " ")
    .split(/\s+/)
    .map((token) => token.replace(/^-+|-+$/g, ""))
    .filter((token) => token.length > 2 && !STOP_WORDS.has(token));
}

function keywordTokens(keyword) {
  return tokenize(keyword);
}

function includesPhrase(text, phrase) {
  return text.toLowerCase().includes(phrase.toLowerCase());
}

function countTokenMatches(text, tokens) {
  const pageTokens = new Set(tokenize(text));
  return tokens.filter((token) => pageTokens.has(token)).length;
}

function getPageCoverage(page, keyword) {
  const tokens = keywordTokens(keyword);
  if (tokens.length === 0) {
    return 0;
  }

  const bodyScore = countTokenMatches(page.text, tokens) / tokens.length;
  const titleBonus = includesPhrase(page.title, keyword) ? 0.35 : 0;
  const headingBonus = includesPhrase(page.heading, keyword) ? 0.2 : 0;
  const exactBonus = includesPhrase(page.text, keyword) ? 0.3 : 0;

  return Math.min(1, bodyScore * 0.55 + titleBonus + headingBonus + exactBonus);
}

function scoreKeywordOpportunity(cluster, keyword, pages) {
  const pageScores = pages.map((page) => ({
    path: page.path,
    title: page.title || page.heading || page.path,
    score: getPageCoverage(page, keyword)
  })).sort((left, right) => right.score - left.score);

  const bestScore = pageScores[0]?.score ?? 0;
  const preferredPath = cluster.preferredPages.find((path) =>
    pageScores.some((pageScore) => pageScore.path === path)
  );
  const preferredScore = pageScores.find((pageScore) => pageScore.path === preferredPath)?.score ?? 0;
  const gapScore = Math.round(
    cluster.priority * 8 +
      (1 - bestScore) * 45 +
      (preferredScore < 0.45 ? 10 : 0) +
      (keyword.split(/\s+/).length >= 4 ? 8 : 0)
  );

  return {
    keyword,
    clusterId: cluster.id,
    clusterLabel: cluster.label,
    intent: cluster.intent,
    priority: cluster.priority,
    gapScore,
    currentBestCoverage: Number(bestScore.toFixed(2)),
    recommendedPage: preferredPath ?? pageScores[0]?.path ?? "/",
    strongestExistingPages: pageScores.slice(0, 3),
    nextAction:
      bestScore >= 0.72
        ? "Refresh title, internal links, and FAQ coverage on the existing page."
        : preferredScore >= 0.45
          ? "Expand the preferred page with a focused section, FAQ, and internal links."
          : "Create or substantially rewrite a focused page before pursuing outreach."
  };
}

function buildKeywordOpportunities(seedTopics, pages) {
  return seedTopics.topicClusters
    .flatMap((cluster) =>
      cluster.keywords.map((keyword) => scoreKeywordOpportunity(cluster, keyword, pages))
    )
    .sort((left, right) => right.gapScore - left.gapScore);
}

function buildQuestionOpportunities(seedTopics, pages) {
  return seedTopics.topicClusters
    .flatMap((cluster) =>
      cluster.questions.map((question) => {
        const matches = pages
          .map((page) => ({
            path: page.path,
            score: getPageCoverage(page, question)
          }))
          .sort((left, right) => right.score - left.score);

        return {
          question,
          clusterId: cluster.id,
          clusterLabel: cluster.label,
          answerTarget: cluster.preferredPages[0] ?? matches[0]?.path ?? "/",
          currentBestCoverage: Number((matches[0]?.score ?? 0).toFixed(2)),
          recommendedFormat: "Short direct answer, visible evidence, FAQ schema only when the answer is visible on the page."
        };
      })
    )
    .sort((left, right) => left.currentBestCoverage - right.currentBestCoverage);
}

function buildContentOpportunities(seedTopics, keywordOpportunities) {
  const topByCluster = new Map();

  for (const opportunity of keywordOpportunities) {
    const existing = topByCluster.get(opportunity.clusterId);
    if (!existing || opportunity.gapScore > existing.gapScore) {
      topByCluster.set(opportunity.clusterId, opportunity);
    }
  }

  return seedTopics.topicClusters.map((cluster) => {
    const topOpportunity = topByCluster.get(cluster.id);
    const primaryKeyword = topOpportunity?.keyword ?? cluster.keywords[0];
    const competitor = seedTopics.competitorTerms.slice(0, 4).join(" vs ");

    return {
      clusterId: cluster.id,
      title: `${cluster.label}: ${primaryKeyword}`,
      recommendedSlug: `/guides/${cluster.id}`,
      format: seedTopics.contentFormats[cluster.priority % seedTopics.contentFormats.length],
      score: topOpportunity?.gapScore ?? cluster.priority * 10,
      brief: [
        `Lead with the user problem behind "${primaryKeyword}".`,
        "Use Pack product evidence: visible workflows, screenshots, benchmark data, or public utility pages.",
        `Include a comparison section covering when Pack differs from ${competitor}.`,
        "Add 3 to 5 visible question answers that can support both classic search snippets and AI answer retrieval."
      ],
      internalLinks: cluster.preferredPages
    };
  }).sort((left, right) => right.score - left.score);
}

function getGoogleNewsUrl(query) {
  const params = new URLSearchParams({ q: query });
  return `https://news.google.com/search?${params.toString()}`;
}

function getGoogleNewsRssUrl(query) {
  const params = new URLSearchParams({
    q: query,
    hl: "en-US",
    gl: "US",
    ceid: "US:en"
  });
  return `https://news.google.com/rss/search?${params.toString()}`;
}

function getGoogleSearchUrl(query) {
  const params = new URLSearchParams({ q: query });
  return `https://www.google.com/search?${params.toString()}`;
}

function buildOutreachOpportunities(seedTopics, keywordOpportunities) {
  const topKeywords = keywordOpportunities.slice(0, 12).map((opportunity) => opportunity.keyword);

  return seedTopics.outreachAngles.map((angle) => ({
    id: angle.id,
    label: angle.label,
    pitch: angle.pitch,
    discoveryQueries: [
      ...angle.queries.map((query) => ({
        query,
        googleNewsUrl: getGoogleNewsUrl(query),
        googleNewsRssUrl: getGoogleNewsRssUrl(query),
        googleSearchUrl: getGoogleSearchUrl(`${query} -site:trypackai.com`)
      })),
      ...topKeywords.slice(0, 3).map((keyword) => ({
        query: `"${keyword}" "best" OR "tools"`,
        googleNewsUrl: getGoogleNewsUrl(`"${keyword}" "best" OR "tools"`),
        googleNewsRssUrl: getGoogleNewsRssUrl(`"${keyword}" "best" OR "tools"`),
        googleSearchUrl: getGoogleSearchUrl(`"${keyword}" "best" OR "tools" -site:trypackai.com`)
      }))
    ],
    qualificationChecklist: [
      "Article is indexed, recent, and relevant to travel planning, AI tools, airport operations, or itinerary organization.",
      "Article mentions competing tools, roundups, missing workflow details, or outdated product lists.",
      "Pack has a specific proof point to add rather than a generic backlink request."
    ]
  }));
}

function decodeXmlEntities(value) {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, "\"")
    .replace(/&#39;/g, "'");
}

function getXmlValue(xml, tagName) {
  const match = xml.match(new RegExp(`<${tagName}(?:\\s[^>]*)?>(?:<!\\[CDATA\\[)?([\\s\\S]*?)(?:\\]\\]>)?<\\/${tagName}>`));
  return match ? decodeXmlEntities(normalizeWhitespace(match[1])) : "";
}

function parseGoogleNewsItems(xml, query) {
  const items = [];
  const itemPattern = /<item>([\s\S]*?)<\/item>/g;
  let match = itemPattern.exec(xml);

  while (match && items.length < 5) {
    const itemXml = match[1];
    const title = getXmlValue(itemXml, "title");
    const url = getXmlValue(itemXml, "link");
    const publishedAt = getXmlValue(itemXml, "pubDate");
    const source = getXmlValue(itemXml, "source");

    if (title && url) {
      items.push({
        query,
        title,
        url,
        source,
        publishedAt
      });
    }

    match = itemPattern.exec(xml);
  }

  return items;
}

async function fetchWithTimeout(url, timeoutMs) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent": "PackWebsite SEO opportunity analyzer"
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    return await response.text();
  } finally {
    clearTimeout(timeoutId);
  }
}

async function discoverArticleProspects(outreachOpportunities) {
  const queries = outreachOpportunities
    .flatMap((opportunity) => opportunity.discoveryQueries.slice(0, 2))
    .slice(0, 8);
  const prospects = [];

  for (const discoveryQuery of queries) {
    try {
      const xml = await fetchWithTimeout(discoveryQuery.googleNewsRssUrl, 8000);
      prospects.push(...parseGoogleNewsItems(xml, discoveryQuery.query));
    } catch (error) {
      prospects.push({
        query: discoveryQuery.query,
        title: "Discovery fetch failed",
        url: discoveryQuery.googleNewsRssUrl,
        source: "Google News RSS",
        publishedAt: "",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  }

  return prospects;
}

function buildGenerativeEngineOpportunities(seedTopics, pages, questionOpportunities) {
  const llmsPage = pages.find((page) => page.path === "/llms.txt");
  const capabilitiesPage = pages.find((page) => page.path === "/capabilities.md");
  const missingAnswerTargets = questionOpportunities
    .filter((opportunity) => opportunity.currentBestCoverage < 0.45)
    .slice(0, 10);

  return [
    {
      id: "answer-readiness",
      title: "Add direct answers for high-intent conversational questions",
      score: 95,
      rationale:
        "AI retrieval benefits from crawlable textual answers that directly address query fan-out subquestions.",
      targets: missingAnswerTargets.map((opportunity) => ({
        question: opportunity.question,
        page: opportunity.answerTarget
      }))
    },
    {
      id: "agent-resource-map",
      title: "Keep agent-facing resource maps complete",
      score: llmsPage && capabilitiesPage ? 70 : 100,
      rationale:
        "Pack already exposes llms.txt and capability markdown; missing or stale entries weaken retrieval routing.",
      targets: [
        {
          page: "/llms.txt",
          status: llmsPage ? "present" : "missing"
        },
        {
          page: "/capabilities.md",
          status: capabilitiesPage ? "present" : "missing"
        }
      ]
    },
    {
      id: "entity-consistency",
      title: "Use consistent brand and entity language across answer surfaces",
      score: 78,
      rationale:
        "Brand aliases, founder profiles, organization schema, and sameAs links should stay aligned so retrieval systems can resolve Pack as one entity.",
      targets: seedTopics.brandTerms.map((term) => ({
        entity: term,
        occurrences: pages.filter((page) => includesPhrase(page.text, term)).length
      }))
    }
  ];
}

function buildTechnicalFindings({ pages, sitemapUrls, prerenderRoutes, robotsText, llmsText }) {
  const sitemapPaths = sitemapUrls
    .filter((url) => url.startsWith(SITE_ORIGIN))
    .map((url) => new URL(url).pathname);
  const sitemapPathSet = new Set(sitemapPaths);
  const pagePathSet = new Set(pages.map((page) => page.path));
  const prerenderRouteSet = new Set(prerenderRoutes);
  const missingFromSitemap = prerenderRoutes
    .filter((route) => !INTENTIONALLY_NOINDEX_ROUTES.has(route))
    .filter((route) => !sitemapPathSet.has(route));
  const sitemapWithoutPage = sitemapPaths.filter((path) => !pagePathSet.has(path) && !prerenderRouteSet.has(path));
  const missingFromPrerender = sitemapPaths.filter((path) => !prerenderRouteSet.has(path));
  const findings = [];

  if (!robotsText.includes("Sitemap: https://www.trypackai.com/sitemap.xml")) {
    findings.push({
      severity: "critical",
      title: "robots.txt does not advertise the primary sitemap",
      action: "Add the canonical sitemap URL to robots.txt."
    });
  }

  if (!llmsText.includes("Capability Pages")) {
    findings.push({
      severity: "high",
      title: "llms.txt is missing capability routing",
      action: "Add a capability page index so AI assistants can route to specific Pack pages."
    });
  }

  if (missingFromSitemap.length > 0) {
    findings.push({
      severity: "high",
      title: "Prerendered public routes are missing from sitemap.xml",
      action: "Add these routes to sitemap.xml or remove them from public prerendering.",
      paths: missingFromSitemap
    });
  }

  if (missingFromPrerender.length > 0) {
    findings.push({
      severity: "medium",
      title: "Sitemap routes are not all prerendered",
      action: "Prerender sitemap routes that need static SEO HTML.",
      paths: missingFromPrerender
    });
  }

  if (sitemapWithoutPage.length > 0) {
    findings.push({
      severity: "medium",
      title: "Sitemap routes do not map to scanned public content",
      action: "Confirm these are real routes with canonical content.",
      paths: sitemapWithoutPage
    });
  }

  return findings;
}

const RENDERED_TITLE_MAX_LENGTH = 65;
const RENDERED_DESCRIPTION_MAX_LENGTH = 165;
const RENDERED_DESCRIPTION_MIN_LENGTH = 60;
// Root-level auxiliary shells (PWA offline fallback, legacy share shim, CCPA
// form) are not canonical routes, so they skip the indexable-page checks.
const AUXILIARY_RENDERED_FILES = new Set(["404.html", "offline.html", "ccpa-request.html"]);

function extractRenderedHead(html) {
  const title = (html.match(/<title[^>]*>([^<]*)<\/title>/) ?? [])[1] ?? "";
  const description =
    (html.match(/<meta[^>]*name="description"[^>]*content="([^"]*)"/) ?? [])[1] ?? "";
  const canonical =
    (html.match(/<link[^>]*rel="canonical"[^>]*href="([^"]*)"/) ?? [])[1] ?? "";
  const robots = (html.match(/<meta[^>]*name="robots"[^>]*content="([^"]*)"/) ?? [])[1] ?? "";
  const jsonLdBlocks = [
    ...html.matchAll(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)
  ].map((match) => match[1]);
  return { title, description, canonical, robots, jsonLdBlocks };
}

export async function buildRenderedHtmlFindings(rootDir) {
  const distDir = join(rootDir, "dist");
  if (!existsSync(distDir)) {
    return [
      {
        severity: "info",
        title: "dist/ is not present, so rendered HTML checks were skipped",
        action: "Run npm run build before seo:check to lint prerendered HTML output."
      }
    ];
  }

  const htmlFiles = (await walkFiles(distDir, new Set([".html"]))).filter(
    (filePath) => !relative(distDir, filePath).startsWith("assets")
  );
  const missingHead = [];
  const longTitles = [];
  const badDescriptions = [];
  const duplicateTitles = [];
  const missingBreadcrumbs = [];
  const staleArticles = [];
  const invalidJsonLd = [];
  const unexpectedIndexable = [];
  const titleOwners = new Map();

  for (const filePath of htmlFiles) {
    const relPath = relative(distDir, filePath);
    const route =
      "/" +
      relPath
        .replace(/index\.html$/, "")
        .replace(/\.html$/, "")
        .replace(/\/$/, "");
    const html = readFileSync(filePath, "utf8");
    const head = extractRenderedHead(html);
    const noindex = head.robots.includes("noindex");

    for (const block of head.jsonLdBlocks) {
      try {
        JSON.parse(block);
      } catch {
        invalidJsonLd.push(route);
      }
    }

    if (!noindex && INTENTIONALLY_NOINDEX_ROUTES.has(route)) {
      unexpectedIndexable.push(route);
    }

    if (noindex || AUXILIARY_RENDERED_FILES.has(relPath)) {
      continue;
    }

    if (!head.title || !head.description || !head.canonical) {
      missingHead.push(route);
      continue;
    }
    if (head.title.length > RENDERED_TITLE_MAX_LENGTH) {
      longTitles.push(`${route} (${head.title.length})`);
    }
    if (
      head.description.length > RENDERED_DESCRIPTION_MAX_LENGTH ||
      head.description.length < RENDERED_DESCRIPTION_MIN_LENGTH
    ) {
      badDescriptions.push(`${route} (${head.description.length})`);
    }
    if (titleOwners.has(head.title)) {
      duplicateTitles.push(`${route} = ${titleOwners.get(head.title)}`);
    }
    titleOwners.set(head.title, route);

    const jsonLdText = head.jsonLdBlocks.join(" ");
    if (route !== "/" && !jsonLdText.includes("BreadcrumbList")) {
      missingBreadcrumbs.push(route);
    }
    if (jsonLdText.includes('"Article"') && !jsonLdText.includes("dateModified")) {
      staleArticles.push(route);
    }
  }

  const findings = [];
  if (invalidJsonLd.length > 0) {
    findings.push({
      severity: "critical",
      title: "Rendered pages contain invalid JSON-LD",
      action: "Fix the structured data so it parses as JSON.",
      paths: invalidJsonLd
    });
  }
  if (missingHead.length > 0) {
    findings.push({
      severity: "critical",
      title: "Indexable rendered pages are missing title, description, or canonical",
      action: "Add PageSeo (or a noindex robots meta) to these routes.",
      paths: missingHead
    });
  }
  if (unexpectedIndexable.length > 0) {
    findings.push({
      severity: "high",
      title: "Routes expected to be noindex rendered without a noindex robots meta",
      action: "Add a noindex robots meta or remove the route from INTENTIONALLY_NOINDEX_ROUTES.",
      paths: unexpectedIndexable
    });
  }
  if (duplicateTitles.length > 0) {
    findings.push({
      severity: "high",
      title: "Indexable rendered pages share duplicate titles",
      action: "Give each indexable page a unique title.",
      paths: duplicateTitles
    });
  }
  if (longTitles.length > 0) {
    findings.push({
      severity: "medium",
      title: `Rendered titles exceed ${RENDERED_TITLE_MAX_LENGTH} characters and will truncate in SERPs`,
      action: "Shorten the title or add a seoTitle override.",
      paths: longTitles
    });
  }
  if (badDescriptions.length > 0) {
    findings.push({
      severity: "medium",
      title: `Rendered meta descriptions fall outside ${RENDERED_DESCRIPTION_MIN_LENGTH}-${RENDERED_DESCRIPTION_MAX_LENGTH} characters`,
      action: "Rewrite the description or add a seoDescription override.",
      paths: badDescriptions
    });
  }
  if (missingBreadcrumbs.length > 0) {
    findings.push({
      severity: "medium",
      title: "Indexable rendered pages are missing BreadcrumbList structured data",
      action: "Ensure the Breadcrumbs route map covers these routes.",
      paths: missingBreadcrumbs
    });
  }
  if (staleArticles.length > 0) {
    findings.push({
      severity: "medium",
      title: "Article structured data is missing dateModified",
      action: "Set datePublished and dateModified on the guide definition.",
      paths: staleArticles
    });
  }
  return findings;
}

async function buildPageInventory(rootDir) {
  const publicDir = join(rootDir, "public");
  const srcDir = join(rootDir, "src");
  const pages = [];
  const markdownFiles = await walkFiles(publicDir, new Set([".md", ".txt"]));

  for (const filePath of markdownFiles) {
    const text = readTextIfExists(filePath);
    const relativePath = relative(publicDir, filePath);
    const publicPath = `/${relativePath}`.replace(/\\/g, "/");
    const path = extname(filePath) === ".md" ? pathFromPublicMarkdown(filePath) : publicPath;

    pages.push({
      path,
      source: relative(rootDir, filePath),
      title: getHeading(text) || basename(filePath),
      heading: getHeading(text),
      text: stripMarkdown(text)
    });
  }

  const sourceFiles = await walkFiles(srcDir, new Set([".tsx", ".ts"]));

  for (const filePath of sourceFiles) {
    const source = readTextIfExists(filePath);
    const strings = extractQuotedStrings(source);

    if (strings.length === 0) {
      continue;
    }

    const relativePath = relative(rootDir, filePath);
    pages.push({
      path: `/source/${relativePath}`,
      source: relativePath,
      title: basename(filePath),
      heading: basename(filePath),
      text: strings.join(" ")
    });
  }

  return pages;
}

export async function analyzeSeoOpportunities(options = {}) {
  const rootDir = resolve(options.rootDir ?? process.cwd());
  const seedTopicsPath = resolve(rootDir, options.seedTopicsPath ?? "seo/seed-topics.json");
  const seedTopics = readJson(seedTopicsPath);
  const pages = await buildPageInventory(rootDir);
  const sitemapXml = readTextIfExists(join(rootDir, "public/sitemap.xml"));
  const robotsText = readTextIfExists(join(rootDir, "public/robots.txt"));
  const llmsText = readTextIfExists(join(rootDir, "public/llms.txt"));
  const prerenderSource = readTextIfExists(join(rootDir, "scripts/prerender.mjs"));
  const sitemapUrls = extractSitemapUrls(sitemapXml);
  const prerenderRoutes = extractPrerenderRoutes(prerenderSource);
  const keywordOpportunities = buildKeywordOpportunities(seedTopics, pages);
  const questionOpportunities = buildQuestionOpportunities(seedTopics, pages);
  const contentOpportunities = buildContentOpportunities(seedTopics, keywordOpportunities);
  const outreachOpportunities = buildOutreachOpportunities(seedTopics, keywordOpportunities);
  const articleProspects = options.discoverArticles
    ? await discoverArticleProspects(outreachOpportunities)
    : [];
  const generativeEngineOpportunities = buildGenerativeEngineOpportunities(
    seedTopics,
    pages,
    questionOpportunities
  );
  const technicalFindings = [
    ...buildTechnicalFindings({
      pages,
      sitemapUrls,
      prerenderRoutes,
      robotsText,
      llmsText
    }),
    ...(await buildRenderedHtmlFindings(rootDir))
  ];

  return {
    generatedAt: new Date().toISOString(),
    siteOrigin: SITE_ORIGIN,
    officialGuidance: OFFICIAL_GUIDANCE,
    inventory: {
      scannedPages: pages.length,
      sitemapUrls: sitemapUrls.length,
      prerenderRoutes: prerenderRoutes.length
    },
    keywordOpportunities,
    questionOpportunities,
    contentOpportunities,
    outreachOpportunities,
    articleProspects,
    generativeEngineOpportunities,
    technicalFindings
  };
}

function toMarkdownList(items, renderItem) {
  return items.map((item, index) => `${index + 1}. ${renderItem(item)}`).join("\n");
}

export function renderMarkdownReport(report) {
  const topKeywords = report.keywordOpportunities.slice(0, 12);
  const topContent = report.contentOpportunities.slice(0, 8);
  const topOutreach = report.outreachOpportunities.slice(0, 6);
  const articleProspects = report.articleProspects.slice(0, 12);
  const findings = report.technicalFindings.length > 0
    ? report.technicalFindings
    : [{ severity: "info", title: "No critical technical SEO findings", action: "Keep monitoring sitemap, robots, llms.txt, and prerender output." }];

  return `# PackWebsite SEO and GEO Opportunities

Generated: ${report.generatedAt}

## Technical Findings

${toMarkdownList(findings, (finding) => `**${finding.severity}**: ${finding.title}. ${finding.action}${finding.paths ? ` Paths: ${finding.paths.join(", ")}` : ""}`)}

## Keyword Opportunities

${toMarkdownList(topKeywords, (opportunity) => `**${opportunity.keyword}** (${opportunity.clusterLabel}, score ${opportunity.gapScore}) -> ${opportunity.recommendedPage}. ${opportunity.nextAction}`)}

## Content Opportunities

${toMarkdownList(topContent, (opportunity) => `**${opportunity.title}** -> ${opportunity.recommendedSlug}. Format: ${opportunity.format}. Links: ${opportunity.internalLinks.join(", ")}`)}

## GEO Opportunities

${toMarkdownList(report.generativeEngineOpportunities, (opportunity) => `**${opportunity.title}** (score ${opportunity.score}). ${opportunity.rationale}`)}

## Outreach Discovery

${toMarkdownList(topOutreach, (opportunity) => `**${opportunity.label}**: ${opportunity.pitch} First query: ${opportunity.discoveryQueries[0].googleSearchUrl}`)}

## Article Prospects

${articleProspects.length > 0 ? toMarkdownList(articleProspects, (prospect) => `**${prospect.source || "Unknown source"}**: ${prospect.title}. Query: ${prospect.query}. ${prospect.url}`) : "Run `npm run seo:discover` to fetch live article prospects from the outreach queries."}

## Guidance Used

${toMarkdownList(report.officialGuidance, (guidance) => `${guidance.source}, checked ${guidance.checkedOn}: ${guidance.principle} ${guidance.url}`)}
`;
}

export function writeSeoReport(report, options = {}) {
  const rootDir = resolve(options.rootDir ?? process.cwd());
  const outputDir = resolve(rootDir, options.outputDir ?? DEFAULT_OUTPUT_DIR);
  mkdirSync(outputDir, { recursive: true });

  const jsonPath = join(outputDir, "opportunities.json");
  const markdownPath = join(outputDir, "opportunities.md");
  writeFileSync(jsonPath, `${JSON.stringify(report, null, 2)}\n`);
  writeFileSync(markdownPath, renderMarkdownReport(report));

  return {
    jsonPath,
    markdownPath
  };
}

export function hasBlockingFindings(report) {
  return report.technicalFindings.some((finding) => finding.severity === "critical");
}
