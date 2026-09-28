import fs from "node:fs";
import path from "node:path";

const root = path.resolve(__dirname, "../..");

const read = (relativePath: string) =>
  fs.readFileSync(path.join(root, relativePath), "utf8");

const PINNED = {
  "@pack/schemas": "npm:@pack-devorg/schemas@1.0.0-3287c1e5a528",
  "@pack/locality-catalog":
    "npm:@pack-devorg/locality-catalog@1.0.0-3287c1e5a528",
  "@pack/web-effects": "npm:@pack-devorg/web-effects@1.0.0-3287c1e5a528",
} as const;

describe("published @pack packages", () => {
  it("pins GitHub Packages aliases and does not file-link PackServer", () => {
    const pkg = JSON.parse(read("package.json")) as {
      dependencies: Record<string, string>;
    };
    for (const [name, spec] of Object.entries(PINNED)) {
      expect(pkg.dependencies[name]).toBe(spec);
    }
    const joined = JSON.stringify(pkg.dependencies);
    expect(joined.includes("file:../PackServer")).toBe(false);

    const npmrc = read(".npmrc");
    expect(npmrc).toContain("@pack-devorg:registry=https://npm.pkg.github.com");
    expect(npmrc).toContain("NODE_AUTH_TOKEN");
  });

  it("resolves installed packages from node_modules", () => {
    const installed = [
      ["@pack/schemas", "dist/travel.js"],
      ["@pack/locality-catalog", "dist/locality-catalog.js"],
      ["@pack/web-effects", "vendor/border-beam/dist/index.es.js"],
    ] as const;
    for (const [name, entry] of installed) {
      const resolved = fs.realpathSync(path.join(root, "node_modules", name, entry));
      expect(resolved.includes(`${path.sep}node_modules${path.sep}`)).toBe(true);
      expect(resolved.includes("PackServer")).toBe(false);
    }
  });

  it("keeps CI and deploy off the PackServer checkout and pack-ci-read", () => {
    for (const workflow of [".github/workflows/ci.yml", ".github/workflows/deploy.yml"]) {
      const text = read(workflow);
      expect(text.includes("PACK_CI_READ")).toBe(false);
      expect(text.includes("Pack-DevOrg/PackServer")).toBe(false);
      expect(text.includes("sparse-checkout")).toBe(false);
      expect(text).toContain("NODE_AUTH_TOKEN: ${{ secrets.GITHUB_TOKEN }}");
    }
    const vite = read("vite.config.ts");
    expect(vite.includes("pack-server-bare-imports-from-site")).toBe(false);
    expect(vite.includes("PackServer")).toBe(false);
  });
});
