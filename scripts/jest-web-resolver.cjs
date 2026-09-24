const fs = require('node:fs');
const path = require('node:path');

const WEB_LIBS = [
  'expo-linear-gradient',
  'react-native-svg',
  'react-native-safe-area-context',
];

const SOURCE_EXTS = ['.tsx', '.ts', '.jsx', '.js', '.json'];

function insideWebLib(basedir) {
  return WEB_LIBS.some((name) =>
    basedir.includes(`${path.sep}node_modules${path.sep}${name}${path.sep}`),
  );
}

function webBuild(abs) {
  if (abs.endsWith('.js')) {
    return abs.replace(/\.js$/, '.web.js');
  }
  return `${abs}.web.js`;
}

function packAppRoot(rootDir) {
  const candidates = [
    path.join(rootDir, '..', 'PackApp'),
    path.join(rootDir, '..', '..', 'PackApp'),
  ];
  return (
    candidates.find((dir) =>
      fs.existsSync(
        path.join(dir, 'src', 'components', 'onboarding', 'OnboardingComponents.tsx'),
      ),
    ) ?? candidates[candidates.length - 1]
  );
}

function resolveSourceFile(absBase) {
  if (fs.existsSync(absBase) && fs.statSync(absBase).isFile()) {
    return absBase;
  }
  for (const ext of SOURCE_EXTS) {
    if (fs.existsSync(absBase + ext)) {
      return absBase + ext;
    }
  }
  for (const ext of SOURCE_EXTS) {
    const indexFile = path.join(absBase, `index${ext}`);
    if (fs.existsSync(indexFile)) {
      return indexFile;
    }
  }
  return null;
}

module.exports = function resolveWebBuild(request, options) {
  const basedir = options.basedir;
  if (
    request === '../Icon' &&
    basedir.endsWith(`${path.sep}icons${path.sep}svg`)
  ) {
    return path.join(options.rootDir, 'src/onboarding/packAppIconPropsStub.ts');
  }
  if (request.startsWith('.') && insideWebLib(basedir)) {
    const abs = path.resolve(basedir, request);
    const web = webBuild(abs);
    if (fs.existsSync(web)) {
      return web;
    }
  }
  if (request.startsWith('@/')) {
    const inPackApp = basedir.includes(`${path.sep}PackApp${path.sep}`);
    const root = inPackApp
      ? path.join(packAppRoot(options.rootDir), 'src')
      : path.join(options.rootDir, 'src');
    const resolved = resolveSourceFile(path.join(root, request.slice(2)));
    if (resolved) {
      return resolved;
    }
  }
  return options.defaultResolver(request, options);
};
