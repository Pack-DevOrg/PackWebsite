import type { CapabilityPageSlug } from "./capabilityPages";

/**
 * The canonical map from demo screens to capability pages. Each screen matches
 * one clip exported by the PackApp demo pipeline (feature-<id>.mp4) and lists
 * the capability landing pages that the screen actually demonstrates, so the
 * features page can show the SEO capability cards next to the screen they
 * belong to — and each capability page can play the clip of its own screen.
 */
export interface FeatureScreen {
  readonly id: string;
  readonly label: string;
  readonly caption: string;
  readonly blurb: string;
  readonly capabilitySlugs: readonly CapabilityPageSlug[];
}

export const FEATURE_SCREENS: readonly FeatureScreen[] = [
  {
    id: "plan",
    label: "Plan",
    caption: "One message becomes a full trip",
    blurb:
      "Tell Pack where you're headed — or let it catch the meeting invite first. It drafts the whole trip around your real calendar, party, and preferences, then asks only the questions that matter.",
    capabilitySlugs: ["trip-planning-from-events"],
  },
  {
    id: "search",
    label: "Search",
    caption: "Real prices for the whole party",
    blurb:
      "Flights, hotels, and cars priced for everyone going, side by side. Pack ranks options by what you actually choose, not by what paid to be first.",
    capabilitySlugs: ["travel-booking"],
  },
  {
    id: "book",
    label: "Book",
    caption: "One checkout for everything",
    blurb:
      "Review the plan, then check out once — flights, stay, and car together. Loyalty numbers and traveler details are already filled in.",
    capabilitySlugs: ["loyalty-details", "trip-expenses"],
  },
  {
    id: "day-of",
    label: "Day-of",
    caption: "Your day live, down to the Lock Screen",
    blurb:
      "The travel day runs itself: leave-by times, security waits, and a Live Activity that keeps the whole trip on your Lock Screen.",
    capabilitySlugs: [
      "upcoming-trip-details",
      "live-trip-views",
      "airport-security-wait-times",
    ],
  },
  {
    id: "trips",
    label: "Trips",
    caption: "Every trip, past and future",
    blurb:
      "Every trip lives in one place — the one next month and the one from 2019. Confirmations, calendars, and costs stay attached to the trip they belong to.",
    capabilitySlugs: ["travel-history", "trip-calendar-sync"],
  },
  {
    id: "stats",
    label: "Stats",
    caption: "Your travel, measured",
    blurb:
      "Miles, countries, airports, streaks — your travel history turned into maps, numbers, and trophies worth showing off.",
    capabilitySlugs: ["travel-stats"],
  },
  {
    id: "packs",
    label: "Packs",
    caption: "The people you go places with",
    blurb:
      "Travel is better with the same people. Packs remembers your crews so the next group trip starts from one tap, not a group chat.",
    capabilitySlugs: ["trip-sharing"],
  },
  {
    id: "preferences",
    label: "Prefs",
    caption: "Set once, used everywhere",
    blurb:
      "Aisle or window, king bed, compact car — say it once. Every search, plan, and booking after that already knows.",
    capabilitySlugs: ["traveler-profiles"],
  },
  {
    id: "home",
    label: "Home",
    caption: "The surface that's already working",
    blurb:
      "Forwarded confirmations, calendar events, live updates — Pack is organizing your travel before you even open the app.",
    capabilitySlugs: ["trip-updates"],
  },
  {
    id: "onboarding",
    label: "Start",
    caption: "Ready in under a minute",
    blurb:
      "Sign in, connect what you like, done. Pack is useful in the first minute, not after an hour of setup.",
    capabilitySlugs: ["connected-accounts"],
  },
];

/**
 * Every capability page in journey order — the screens' order on the features
 * band, then each screen's own tag order. Drives the capability pages' shared
 * tab band so its chevrons walk the same journey as the features deck.
 */
export const journeyOrderedCapabilitySlugs: readonly CapabilityPageSlug[] = [
  ...new Set(FEATURE_SCREENS.flatMap((screen) => screen.capabilitySlugs)),
];

/** First screen that demonstrates the capability — drives its page's clip. */
export const capabilityScreenMap: Partial<Record<CapabilityPageSlug, FeatureScreen>> =
  Object.fromEntries(
    FEATURE_SCREENS.flatMap((screen) =>
      screen.capabilitySlugs.map((slug) => [slug, screen]),
    ).reverse(),
  );
