/**
 * App deep-link helpers for share/invite landing pages.
 *
 * The "Open in Pack" affordance keeps the page's own https universal link as
 * its href (iOS opens the app directly when it is installed and the link is
 * tapped from another app). For taps that happen INSIDE the browser — where
 * universal links to the same domain never leave Safari — the click handler
 * attempts the custom scheme and falls back to the App Store after a short
 * window, unless the page was hidden (meaning the app actually opened).
 *
 * Kept free of import.meta/env access so the logic is directly unit-testable.
 */

export const APP_SCHEME_PREFIX = "com.packai.app://";

export const DEFAULT_APPLE_APP_ID = "6761626050";

export const buildAppStoreUrl = (appleAppId: string): string =>
  `https://apps.apple.com/app/id${appleAppId}`;

/**
 * Canonical https universal link for a shared plan, on WHATEVER host is
 * serving the page (www.trypackai.com today, trips.trypackai.com soon).
 * Query-param form: /share/<id> 404s on the static host.
 */
export const buildShareUniversalLink = (
  origin: string,
  shareId: string
): string =>
  `${origin.replace(/\/+$/, "")}/share?shareId=${encodeURIComponent(shareId)}`;

export const buildShareAppSchemeUrl = (shareId: string): string =>
  `${APP_SCHEME_PREFIX}share/${encodeURIComponent(shareId)}`;

export const ACCOUNT_APP_SECTIONS = ["settings", "friends", "connected"] as const;

export type AccountAppSection = (typeof ACCOUNT_APP_SECTIONS)[number];

const ACCOUNT_UNIVERSAL_PATH: Record<AccountAppSection, string> = {
  settings: "/app/settings",
  friends: "/app/friends",
  connected: "/app/connected",
};

const accountSectionOrThrow = (section: string): AccountAppSection => {
  if (section === "settings") {
    return "settings";
  }
  if (section === "friends") {
    return "friends";
  }
  if (section === "connected") {
    return "connected";
  }
  throw new Error("unknown account section");
};

/**
 * Account links are navigation only. Drop query, fragment, path, and userinfo
 * so a caller cannot thread token, session, email, or OAuth secrets through
 * the origin they pass us (including a current-page Google/Apple callback).
 * Native auth is the app session.
 */
const originWithoutQueryOrFragmentBecauseAccountLinksAreNavigationOnly = (
  origin: string
): string => new URL(origin).origin;

/**
 * Navigation-only custom scheme into native account UI. Never carries a
 * token, session id, email, or query secret — auth is the native session.
 */
export const buildAccountAppSchemeUrl = (section: AccountAppSection): string => {
  const allowed = accountSectionOrThrow(section);
  return `${APP_SCHEME_PREFIX}account/${allowed}`;
};

export const buildAccountUniversalLink = (
  origin: string,
  section: AccountAppSection
): string => {
  const allowed = accountSectionOrThrow(section);
  return `${originWithoutQueryOrFragmentBecauseAccountLinksAreNavigationOnly(origin)}${ACCOUNT_UNIVERSAL_PATH[allowed]}`;
};

export const isAppleMobileUserAgent = (userAgent: string): boolean =>
  /iphone|ipad|ipod/i.test(userAgent);

export interface OpenInAppEnvironment {
  /** Navigate the top-level page (assigning location.href). */
  readonly navigate: (url: string) => void;
  /** True when the page is currently hidden (app switch already happened). */
  readonly isPageHidden: () => boolean;
  readonly setTimer: (handler: () => void, ms: number) => number;
  readonly clearTimer: (timerId: number) => void;
  /**
   * Subscribe to page-hide signals (pagehide/visibilitychange). Returns an
   * unsubscribe function. When the page hides before the fallback timer
   * fires, the app took over and the App Store fallback must be cancelled.
   */
  readonly onPageHide: (handler: () => void) => () => void;
}

export const APP_OPEN_FALLBACK_DELAY_MS = 1600;

/**
 * Try to open the installed app via its custom scheme; if the page is still
 * visible after the fallback window on an Apple mobile device, send the user
 * to the App Store. Non-Apple browsers just stay on the web page (it already
 * shows the full trip).
 *
 * Returns a cancel function (for unmount).
 */
export const attemptOpenInApp = (options: {
  readonly shareId: string;
  readonly userAgent: string;
  readonly appleAppId: string;
  readonly env: OpenInAppEnvironment;
}): (() => void) => {
  const { shareId, userAgent, appleAppId, env } = options;

  env.navigate(buildShareAppSchemeUrl(shareId));

  if (!isAppleMobileUserAgent(userAgent)) {
    return () => undefined;
  }

  let cancelled = false;
  let unsubscribe: () => void = () => undefined;

  const cancel = (): void => {
    if (cancelled) {
      return;
    }
    cancelled = true;
    env.clearTimer(timerId);
    unsubscribe();
  };

  const timerId = env.setTimer(() => {
    const hidden = env.isPageHidden();
    cancel();
    if (!hidden) {
      env.navigate(buildAppStoreUrl(appleAppId));
    }
  }, APP_OPEN_FALLBACK_DELAY_MS);

  unsubscribe = env.onPageHide(cancel);

  return cancel;
};
