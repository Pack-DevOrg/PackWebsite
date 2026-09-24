const fs = require('fs');
const path = require('path');

function findPackApp(rootDir) {
  if (!rootDir) {
    return null;
  }
  const candidates = [
    path.resolve(rootDir, '..', 'PackApp'),
    path.resolve(rootDir, '..', '..', 'PackApp'),
    path.resolve(rootDir, 'PackApp'),
  ];
  for (const dir of candidates) {
    const marker = path.join(dir, 'src', 'components', 'onboarding', 'OnboardingComponents.tsx');
    if (fs.existsSync(marker)) {
      return dir;
    }
  }
  return null;
}

function isInside(file, dir) {
  if (!file || !dir) {
    return false;
  }
  const rel = path.relative(dir, file);
  return rel !== '' && !rel.startsWith('..') && !path.isAbsolute(rel);
}

module.exports = function packAppResolver(request, options) {
  const rootDir = options.rootDir;
  const appDir = findPackApp(rootDir);
  const basedir = options.basedir || '';
  const fromApp = appDir !== null && isInside(basedir, appDir);
  const resolve = (mapped, nextOptions) => options.defaultResolver(mapped, nextOptions || options);

  if (request === 'react-native/Libraries/Utilities/codegenNativeComponent') {
    return path.join(rootDir, 'scripts', 'pack-app-codegen.cjs');
  }
  if (request === '@react-navigation/native') {
    return path.join(rootDir, 'scripts', 'pack-app-navigation.cjs');
  }
  if (request === 'react-native-reanimated') {
    return path.join(rootDir, 'scripts', 'pack-app-reanimated.cjs');
  }
  if (request === 'react-native-svg') {
    return path.join(rootDir, 'scripts', 'react-native-svg-web.cjs');
  }
  if (
    basedir.includes(`${path.sep}expo-linear-gradient${path.sep}`) &&
    (request === './NativeLinearGradient' || request.endsWith('/NativeLinearGradient'))
  ) {
    return resolve('expo-linear-gradient/build/NativeLinearGradient.web.js');
  }

  const packAppAliases = {
    '@pack/app/onboarding/OnboardingComponents': 'components/onboarding/OnboardingComponents.tsx',
    '@pack/app/icons/GoogleOutlineIcon': 'icons/svg/GoogleOutlineIcon.tsx',
    '@pack/app/icons/AppleOutlineIcon': 'icons/svg/AppleOutlineIcon.tsx',
    '@pack/app/icons/MicrosoftIcon': 'icons/svg/MicrosoftIcon.tsx',
    '@pack/app/icons/ChevronLeftIcon': 'icons/svg/ChevronLeftIcon.tsx',
  };
  if (appDir !== null && packAppAliases[request]) {
    return resolve(path.join(appDir, 'src', packAppAliases[request]), {
      ...options,
      basedir: path.join(appDir, 'src'),
    });
  }

  if (appDir !== null && fromApp && request.startsWith('@/')) {
    return resolve(path.join(appDir, 'src', request.slice(2)), {
      ...options,
      basedir: path.join(appDir, 'src'),
    });
  }

  if (appDir !== null && fromApp) {
    const websiteSrc = path.join(rootDir, 'src');
    if (request.startsWith(websiteSrc + path.sep) && !fs.existsSync(request)) {
      const rel = path.relative(websiteSrc, request);
      return resolve(path.join(appDir, 'src', rel), {
        ...options,
        basedir: path.join(appDir, 'src'),
      });
    }
  }

  return resolve(request);
};
