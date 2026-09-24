const fs = require('node:fs');
const path = require('node:path');

const WEB_LIBS = [
  'expo-linear-gradient',
  'react-native-svg',
  'react-native-safe-area-context',
];

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
  return options.defaultResolver(request, options);
};
