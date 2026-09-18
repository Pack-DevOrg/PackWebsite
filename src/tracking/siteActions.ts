/**
 * Closed CTA names for website PostHog `site_action` events.
 * Unknown names throw — do not pass free strings.
 */

export const SITE_ACTION_NAMES = [
  'text_me',
  'waitlist_submit',
  'deep_link',
] as const;

export type SiteActionName = (typeof SITE_ACTION_NAMES)[number];

const SITE_ACTION_NAME_SET: ReadonlySet<string> = new Set(SITE_ACTION_NAMES);

export const isSiteActionName = (value: string): value is SiteActionName =>
  SITE_ACTION_NAME_SET.has(value);

export type SiteActionProperties = {
  readonly action: SiteActionName;
  readonly duration_ms: number;
};

export const durationMsSinceNavigation = (
  nowMs: number = typeof performance !== 'undefined' ? performance.now() : 0,
): number => Math.max(0, Math.round(nowMs));

export const siteActionProperties = (
  action: string,
  durationMs: number = durationMsSinceNavigation(),
): SiteActionProperties => {
  if (!isSiteActionName(action)) {
    throw new Error(`unknown site_action name: ${action}`);
  }
  return {
    action,
    duration_ms: Math.max(0, Math.round(durationMs)),
  };
};
