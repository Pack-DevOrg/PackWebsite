/**
 * @jest-environment node
 *
 * Renders every scripts/prerender.mjs route through the real SSG entry
 * (StaticRouter). jsdom hides the browser-only crash that fails /onboard.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { render } from "../ssg";

function routesToPrerender(): string[] {
  const source = readFileSync(join(process.cwd(), "scripts/prerender.mjs"), "utf8");
  const block = source.match(/const routesToPrerender = \[([\s\S]*?)\];/);
  if (!block) {
    throw new Error("routesToPrerender missing from scripts/prerender.mjs");
  }
  return [...block[1].matchAll(/"(\/[^"]*)"/g)].map((match) => match[1]);
}

describe("SSG prerender smoke", () => {
  const routes = routesToPrerender();

  it("lists /onboard", () => {
    expect(routes).toContain("/onboard");
  });

  it.each(routes)(
    "prerenders %s through StaticRouter",
    async (route) => {
      const errors: string[] = [];
      const original = console.error;
      console.error = (...args: unknown[]) => {
        const line = args.map((arg) => String(arg)).join(" ");
        if (line.includes("useLayoutEffect does nothing on the server")) {
          return;
        }
        errors.push(line);
        original(...args);
      };
      try {
        const { html } = await render(route);
        expect(html.length).toBeGreaterThan(0);
        if (route === "/onboard") {
          expect(html).toContain('data-testid="onboard-step"');
        }
        expect(errors.filter((line) => line.includes("<Navigate>"))).toEqual([]);
        expect(errors.filter((line) => line.includes("[ssg] render error"))).toEqual([]);
      } finally {
        console.error = original;
      }
    },
    30000,
  );
});
