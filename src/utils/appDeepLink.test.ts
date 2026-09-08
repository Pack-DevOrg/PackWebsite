/**
 * Open-in-Pack deep-link logic: scheme attempt, timed App Store fallback,
 * and the page-hide cancel path (app actually opened).
 */

import {
  APP_OPEN_FALLBACK_DELAY_MS,
  attemptOpenInApp,
  buildAccountAppSchemeUrl,
  buildAccountUniversalLink,
  buildAppStoreUrl,
  buildShareAppSchemeUrl,
  buildShareUniversalLink,
  isAppleMobileUserAgent,
  type AccountAppSection,
  type OpenInAppEnvironment,
} from './appDeepLink';

const IOS_UA =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15';
const ANDROID_UA = 'Mozilla/5.0 (Linux; Android 14; Pixel 8)';
const APP_ID = '6761626050';

interface FakeEnv {
  readonly env: OpenInAppEnvironment;
  readonly navigations: string[];
  fireTimer: () => void;
  firePageHide: () => void;
  hidden: boolean;
  timerCleared: boolean;
  hideUnsubscribed: boolean;
}

const createFakeEnv = (): FakeEnv => {
  let timerHandler: (() => void) | null = null;
  let hideHandler: (() => void) | null = null;
  const fake: FakeEnv = {
    navigations: [],
    hidden: false,
    timerCleared: false,
    hideUnsubscribed: false,
    fireTimer: () => timerHandler?.(),
    firePageHide: () => hideHandler?.(),
    env: {
      navigate: (url) => fake.navigations.push(url),
      isPageHidden: () => fake.hidden,
      setTimer: (handler) => {
        timerHandler = handler;
        return 1;
      },
      clearTimer: () => {
        fake.timerCleared = true;
        timerHandler = null;
      },
      onPageHide: (handler) => {
        hideHandler = handler;
        return () => {
          fake.hideUnsubscribed = true;
          hideHandler = null;
        };
      },
    },
  };
  return fake;
};

describe('appDeepLink builders', () => {
  it('builds the query-param universal link on the serving host', () => {
    expect(buildShareUniversalLink('https://trips.trypackai.com/', 'abc/123')).toBe(
      'https://trips.trypackai.com/share?shareId=abc%2F123'
    );
  });

  it('builds the custom scheme url from the app scheme', () => {
    expect(buildShareAppSchemeUrl('xyz')).toBe('com.packai.app://share/xyz');
  });

  it('builds the App Store url from the app id', () => {
    expect(buildAppStoreUrl(APP_ID)).toBe('https://apps.apple.com/app/id6761626050');
  });

  it('detects Apple mobile user agents only', () => {
    expect(isAppleMobileUserAgent(IOS_UA)).toBe(true);
    expect(isAppleMobileUserAgent(ANDROID_UA)).toBe(false);
  });

  it('builds a navigation-only account scheme with no query', () => {
    expect(buildAccountAppSchemeUrl('settings')).toMatch(
      /^com\.packai\.app:\/\/account\/settings$/
    );
    expect(buildAccountAppSchemeUrl('friends')).toBe(
      'com.packai.app://account/friends'
    );
    expect(buildAccountAppSchemeUrl('connected')).toBe(
      'com.packai.app://account/connected'
    );
  });

  it('rejects unknown account sections instead of interpolating attacker strings', () => {
    const adversarial = [
      'settings?token=abc',
      'settings?code=1',
      'email',
      'sub',
      'friends?email=hidden@trypackai.com',
    ];
    for (const section of adversarial) {
      expect(() =>
        buildAccountAppSchemeUrl(section as AccountAppSection)
      ).toThrow(/unknown account section/);
    }
  });

  it('builds an https account universal link on the serving host with no secrets', () => {
    const url = buildAccountUniversalLink(
      'https://trips.trypackai.com/',
      'settings'
    );
    expect(url).toBe('https://trips.trypackai.com/app/settings');
    expect(url.startsWith('https://trips.trypackai.com/')).toBe(true);
    expect(url).not.toMatch(/token|code|email|sub/i);
  });
});

describe('attemptOpenInApp', () => {
  it('navigates to the custom scheme immediately', () => {
    const fake = createFakeEnv();
    attemptOpenInApp({ shareId: 'abc', userAgent: IOS_UA, appleAppId: APP_ID, env: fake.env });
    expect(fake.navigations[0]).toBe('com.packai.app://share/abc');
  });

  it('falls back to the App Store when the page stays visible on iOS', () => {
    const fake = createFakeEnv();
    attemptOpenInApp({ shareId: 'abc', userAgent: IOS_UA, appleAppId: APP_ID, env: fake.env });
    fake.fireTimer();
    expect(fake.navigations).toEqual([
      'com.packai.app://share/abc',
      'https://apps.apple.com/app/id6761626050',
    ]);
    expect(fake.hideUnsubscribed).toBe(true);
  });

  it('does NOT fall back when the app opened (page hidden at timer)', () => {
    const fake = createFakeEnv();
    attemptOpenInApp({ shareId: 'abc', userAgent: IOS_UA, appleAppId: APP_ID, env: fake.env });
    fake.hidden = true;
    fake.fireTimer();
    expect(fake.navigations).toEqual(['com.packai.app://share/abc']);
  });

  it('cancels the fallback when the page hides before the timer', () => {
    const fake = createFakeEnv();
    attemptOpenInApp({ shareId: 'abc', userAgent: IOS_UA, appleAppId: APP_ID, env: fake.env });
    fake.firePageHide();
    expect(fake.timerCleared).toBe(true);
    fake.fireTimer();
    expect(fake.navigations).toEqual(['com.packai.app://share/abc']);
  });

  it('never arms a store fallback for non-Apple browsers', () => {
    const fake = createFakeEnv();
    attemptOpenInApp({ shareId: 'abc', userAgent: ANDROID_UA, appleAppId: APP_ID, env: fake.env });
    fake.fireTimer();
    expect(fake.navigations).toEqual(['com.packai.app://share/abc']);
  });

  it('returned cancel disarms the timer and listener', () => {
    const fake = createFakeEnv();
    const cancel = attemptOpenInApp({
      shareId: 'abc',
      userAgent: IOS_UA,
      appleAppId: APP_ID,
      env: fake.env,
    });
    cancel();
    expect(fake.timerCleared).toBe(true);
    expect(fake.hideUnsubscribed).toBe(true);
    fake.fireTimer();
    expect(fake.navigations).toEqual(['com.packai.app://share/abc']);
  });

  it('uses the documented fallback delay', () => {
    expect(APP_OPEN_FALLBACK_DELAY_MS).toBe(1600);
  });

  it('cancels the App Store fallback on pagehide for the account scheme', () => {
    const fake = createFakeEnv();
    attemptOpenInApp({
      schemeUrl: buildAccountAppSchemeUrl('settings'),
      userAgent: IOS_UA,
      appleAppId: APP_ID,
      env: fake.env,
    });
    expect(fake.navigations[0]).toBe('com.packai.app://account/settings');
    fake.firePageHide();
    expect(fake.timerCleared).toBe(true);
    fake.fireTimer();
    expect(fake.navigations).toEqual(['com.packai.app://account/settings']);
  });
});
