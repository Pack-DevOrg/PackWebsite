/**
 * Tall stitched captures of the REAL app screens — made in the simulator by
 * scrolling each screen and template-match stitching the shots (capture
 * pipeline recipe). The features page renders these inside ScrollablePhone
 * so visitors scroll the actual screen; entries appear here as screens are
 * captured, and screens without one fall back to their demo clip.
 *
 * width/height are the intrinsic pixel dimensions of the capture; they hold
 * the layout (aspect-ratio) before the image loads.
 */
export interface FeatureCapture {
  readonly src: string;
  readonly width: number;
  readonly height: number;
  readonly alt: string;
  /** Single-screen capture that carries its own real chrome — the shell
   * skips the shared header strip for these. */
  readonly fullBleed?: boolean;
}

export const FEATURE_CAPTURES: Partial<Record<string, FeatureCapture>> = {
  plan: {
    src: "/images/feature-captures/plan.webp",
    width: 1320,
    height: 4588,
    alt: "Pack planner: a Tokyo group-trip prompt with tagged friends becomes a full travel outline — flights, hotel with activity availability, car rental, and return",
  },
  search: {
    src: "/images/feature-captures/search.webp",
    width: 1320,
    height: 6644,
    alt: "Pack search results: ANA first-class flight, Park Hyatt Tokyo with pool hero, Porsche Panamera rental, return flight, and the $5,520 trip total ready to book",
  },
  book: {
    src: "/images/feature-captures/book.webp",
    width: 1320,
    height: 5475,
    alt: "Pack booking: passengers, bags, seat selection, payment, hotel options, and the full price breakdown for the whole party in one checkout",
  },
  trips: {
    src: "/images/feature-captures/trips.webp",
    width: 1320,
    height: 8996,
    alt: "Pack trips: upcoming trips with seats, gates, hotel nights, and time to depart — every trip in one place",
  },
  stats: {
    src: "/images/feature-captures/stats.webp",
    width: 1320,
    height: 2709,
    alt: "Pack stats: 22.7 times around the earth, travel-day streaks, geography and records, and a world map of visited regions",
  },
  "day-of": {
    src: "/images/feature-captures/day-of.webp",
    width: 1320,
    height: 9096,
    alt: "Pack trip details: destination, route map, day-by-day timeline with hotels and flights, trip statistics, and insights",
  },
  packs: {
    src: "/images/feature-captures/packs.webp",
    width: 1320,
    height: 2675,
    alt: "Pack packs: friends you plan with, friend requests, and the planning circle ready for trip context",
  },
  preferences: {
    src: "/images/feature-captures/preferences.webp",
    width: 1320,
    height: 7760,
    alt: "Pack profile and preferences: traveler profile, airline and hotel loyalty programs with points balances, rental car memberships, and event arrival buffers",
  },
  home: {
    src: "/images/feature-captures/home.webp",
    width: 1320,
    height: 2868,
    alt: "Pack home: a live in-flight Live Activity, tonight's hotel and the queue, and the composer ready for the next trip",
    fullBleed: true,
  },
  onboarding: {
    src: "/images/feature-captures/onboarding.webp",
    width: 1320,
    height: 2868,
    alt: "Pack welcome: sign in with Google, Apple, or SSO and start planning in under a minute",
    fullBleed: true,
  },
};
