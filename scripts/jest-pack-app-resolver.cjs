const fs = require('node:fs');
const path = require('node:path');

// CI and deploy sparse-check PackApp out into ./PackApp; a laptop keeps it beside this repo (../PackApp, two levels
// up from scripts/). A session worktree keeps that checkout one level further.
function packAppCheckout(candidates) {
  for (const dir of candidates) {
    if (fs.existsSync(path.join(dir, 'src'))) {
      return dir;
    }
  }
  return candidates[0];
}
const PACK_APP_DIR = packAppCheckout([
  path.resolve(__dirname, '../PackApp'),
  path.resolve(__dirname, '../../PackApp'),
  path.resolve(__dirname, '../../../PackApp'),
]);
const PACK_APP_SRC = path.join(PACK_APP_DIR, 'src');
const WEBSITE_SRC = path.resolve(__dirname, '../src');
const SITE_NODE_MODULES = path.resolve(__dirname, '../node_modules');
const FALLBACK_NODE_MODULES = [
  path.join(PACK_APP_DIR, 'node_modules'),
  path.resolve(__dirname, '../../../node_modules'),
];

function packageName(request) {
  if (request.startsWith('@')) {
    const [scope, name] = request.split('/');
    return `${scope}/${name}`;
  }
  return request.split('/')[0];
}

function resolveFallback(request, options) {
  const base = (options.basedir || '').split(path.sep).join('/');
  if (base.includes('/node_modules/')) {
    return null;
  }
  if (
    request.startsWith('.') ||
    path.isAbsolute(request) ||
    request.startsWith('@pack/') ||
    request.startsWith('@/')
  ) {
    return null;
  }
  const name = packageName(request);
  if (fs.existsSync(path.join(SITE_NODE_MODULES, name))) {
    return null;
  }
  for (const root of FALLBACK_NODE_MODULES) {
    if (!fs.existsSync(path.join(root, name))) {
      continue;
    }
    return options.defaultResolver(request, {
      ...options,
      basedir: path.dirname(root),
    });
  }
  return null;
}

function inPackApp(file) {
  return file.split(path.sep).join('/').includes('/PackApp/');
}

function webBuild(abs) {
  const ext = path.extname(abs);
  if (ext) {
    const web = `${abs.slice(0, -ext.length)}.web${ext}`;
    return fs.existsSync(web) ? web : null;
  }
  for (const suffix of ['.web.js', '.web.jsx', '.web.ts', '.web.tsx']) {
    if (fs.existsSync(abs + suffix)) {
      return abs + suffix;
    }
  }
  return null;
}

module.exports = function resolvePackApp(request, options) {
  if (request === 'react-native-reanimated') {
    return path.join(__dirname, 'pack-app-reanimated.cjs');
  }
  let next = request;
  const fromPackApp = inPackApp(options.basedir || '');
  if (request.startsWith('@pack/app/')) {
    next = path.join(PACK_APP_SRC, request.slice('@pack/app/'.length));
  } else if (fromPackApp && request.startsWith('@/')) {
    next = path.join(PACK_APP_SRC, request.slice(2));
  } else if (fromPackApp && (request === WEBSITE_SRC || request.startsWith(WEBSITE_SRC + path.sep))) {
    next = path.join(PACK_APP_SRC, path.relative(WEBSITE_SRC, request));
  }
  if (next === request || !path.isAbsolute(next)) {
    const fallback = resolveFallback(next, options);
    if (fallback) {
      return fallback;
    }
  }
  if (next.startsWith('.') || path.isAbsolute(next)) {
    const abs = path.isAbsolute(next) ? next : path.resolve(options.basedir, next);
    const web = webBuild(abs);
    if (web) {
      return web;
    }
  }
  return options.defaultResolver(next, options);
};
