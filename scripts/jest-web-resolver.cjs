const fs = require('node:fs');
const path = require('node:path');

function packAppRoots(websiteRoot) {
  return [path.join(websiteRoot, '..', 'PackApp'), path.join(websiteRoot, '..', '..', 'PackApp')].filter((root) =>
    fs.existsSync(path.join(root, 'src', 'components', 'onboarding', 'OnboardingComponents.tsx')),
  );
}

function resolveFile(absBase) {
  const candidates = ['', '.tsx', '.ts', '.jsx', '.js', '/index.tsx', '/index.ts', '/index.js'];
  for (const suffix of candidates) {
    const candidate = absBase + suffix;
    if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) {
      return candidate;
    }
  }
  return null;
}

module.exports = (request, options) => {
  if (path.isAbsolute(request) && fs.existsSync(request) && fs.statSync(request).isFile()) {
    return request;
  }
  const websiteRoot = options.rootDir || options.basedir || process.cwd();
  const roots = packAppRoots(websiteRoot);
  if (request === '@pack/app/onboarding/OnboardingComponents') {
    for (const root of roots) {
      const hit = resolveFile(path.join(root, 'src', 'components', 'onboarding', 'OnboardingComponents'));
      if (hit) {
        return hit;
      }
    }
  }
  if (request.startsWith('@pack/app/icons/')) {
    const name = request.slice('@pack/app/icons/'.length);
    for (const root of roots) {
      const hit = resolveFile(path.join(root, 'src', 'icons', 'svg', name));
      if (hit) {
        return hit;
      }
    }
  }
  if (request.startsWith('@/')) {
    const rel = request.slice(2);
    const basedir = options.basedir || '';
    const packRoot = roots.find((root) => basedir === root || basedir.startsWith(root + path.sep));
    const base = packRoot ? path.join(packRoot, 'src', rel) : path.join(websiteRoot, 'src', rel);
    const hit = resolveFile(base);
    if (hit) {
      return hit;
    }
  }
  if (typeof options.defaultResolver === 'function') {
    try {
      const resolved = options.defaultResolver(request, options);
      if (resolved) {
        return resolved;
      }
    } catch {
      // Jest's config lookup calls the resolver without extensions. Fall through.
    }
  }
  return require.resolve(request, {paths: [options.basedir || websiteRoot]});
};
