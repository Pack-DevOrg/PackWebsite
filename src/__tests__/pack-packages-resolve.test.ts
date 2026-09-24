import {readFileSync} from 'node:fs';
import {join} from 'node:path';

const ROOT = process.cwd();

function read(rel: string): string {
  return readFileSync(join(ROOT, rel), 'utf8');
}

const PUBLISHED = ['schemas', 'locality-catalog', 'web-effects'] as const;

describe('published @pack packages', () => {
  it('pins schemas, locality-catalog, and web-effects to GitHub Packages', () => {
    const pkg = JSON.parse(read('package.json')) as {
      dependencies: Record<string, string>;
    };
    const npmrc = read('.npmrc');
    expect(npmrc).toContain('@pack-devorg:registry=https://npm.pkg.github.com');
    expect(npmrc).toContain('//npm.pkg.github.com/:_authToken=${NODE_AUTH_TOKEN}');
    for (const name of PUBLISHED) {
      expect(pkg.dependencies[`@pack/${name}`]).toMatch(
        new RegExp(`^npm:@pack-devorg/${name}@\\d+\\.\\d+\\.\\d+-[0-9a-f]+$`),
      );
    }
  });

  it('installs those packages with GITHUB_TOKEN and does not check out PackServer', () => {
    for (const rel of ['.github/workflows/ci.yml', '.github/workflows/deploy.yml']) {
      const workflow = read(rel);
      expect(workflow).toContain('NODE_AUTH_TOKEN: ${{ secrets.GITHUB_TOKEN }}');
      expect(workflow).toContain('packages: read');
      expect(workflow).not.toMatch(/repository:\s*Pack-DevOrg\/PackServer/);
      expect(workflow).not.toMatch(/create-github-app-token/);
      expect(workflow).not.toMatch(/PACK_CI_READ_APP/);
      expect(workflow).not.toMatch(/sparse-checkout:/);
    }
    const vite = read('vite.config.ts');
    expect(vite).not.toMatch(/repoRootDir,\s*'PackServer'/);
    expect(vite).not.toMatch(/pack-server-bare-imports/);
  });
});
