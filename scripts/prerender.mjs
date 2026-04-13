import { mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const distDir = resolve(__dirname, "../dist");
const ssrDir = resolve(__dirname, "../dist-ssr");

const routesToPrerender = [
  "/",
  "/features",
  "/faq",
  "/how-it-works",
  "/travel-history",
  "/travel-stats",
  "/loyalty-details",
  "/trip-planning-from-events",
  "/trip-updates",
  "/travel-booking",
  "/upcoming-trip-details",
  "/airport-security-wait-times",
  "/trip-calendar-sync",
  "/connected-accounts",
  "/traveler-profiles",
  "/trip-sharing",
  "/live-trip-views",
  "/trip-expenses",
  "/privacy",
  "/terms",
  "/do-not-sell",
  "/privacy-request",
  "/privacy-request/access",
  "/privacy-request/correction",
  "/privacy-request/delete",
  "/privacy-request/limit",
  "/privacy-request/opt-out",
  "/accessibility",
  "/support",
  "/unsubscribe",
  "/setup/email-forwarding",
  "/share",
  "/tsa",
  "/oauth/callback",
];

async function prerender() {
  rmSync(join(distDir, "labs"), { recursive: true, force: true });
  rmSync(join(distDir, "lab"), { recursive: true, force: true });

  const template = readFileSync(join(distDir, "index.html"), "utf-8");
  const manifestPath = join(ssrDir, ".vite/manifest.json");
  const ssrManifest = JSON.parse(readFileSync(manifestPath, "utf-8"));
  const ssrEntry = ssrManifest["src/ssg.tsx"];

  if (!ssrEntry || !ssrEntry.file) {
    throw new Error("Unable to locate SSR bundle for src/ssg.tsx");
  }

  const ssrModule = await import(join(ssrDir, ssrEntry.file));
  const render = ssrModule.render;

  for (const route of routesToPrerender) {
    const { html, head } = await render(route);
    const finalHtml = template
      .replace(
        '<div id="root"></div>',
        `<div id="root" data-prerendered-path="${route}">${html}</div>`
      )
      .replace("</head>", `${head}</head>`);

    const outputPath =
      route === "/"
        ? join(distDir, "index.html")
        : join(distDir, route.replace(/^\//, ""), "index.html");

    mkdirSync(dirname(outputPath), { recursive: true });
    writeFileSync(outputPath, finalHtml);
  }
}

prerender()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error("[prerender] Failed to prerender routes", error?.message ?? error);
    if (error?.stack) {
      console.error(error.stack);
    }
    process.exit(1);
  });
