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
  /** This screen's OWN fixed header (status bar + its real title bar),
   * cropped from the same screenshot at exactly the row the capture starts,
   * so strip and capture are continuous pixels. Absent on full-bleed
   * single-screen captures that carry their chrome inside the capture. */
  readonly headerSrc?: string;
  readonly headerHeight?: number;
}

export const FEATURE_CAPTURES: Partial<Record<string, FeatureCapture>> = {
  plan: {
    src: "/images/feature-captures/plan.webp",
    width: 1320,
    height: 4588,
    alt: "Pack planner: a Tokyo group-trip prompt with tagged friends becomes a full travel outline — flights, hotel with activity availability, car rental, and return",
    headerSrc: "/images/feature-captures/header-plan.webp",
    headerHeight: 320,
  },
  search: {
    src: "/images/feature-captures/search.webp",
    width: 1320,
    height: 6644,
    alt: "Pack search results: ANA first-class flight, Park Hyatt Tokyo with pool hero, Porsche Panamera rental, return flight, and the $5,520 trip total ready to book",
    headerSrc: "/images/feature-captures/header-search.webp",
    headerHeight: 320,
  },
  book: {
    src: "/images/feature-captures/book.webp",
    width: 1320,
    height: 5475,
    alt: "Pack booking: passengers, bags, seat selection, payment, hotel options, and the full price breakdown for the whole party in one checkout",
    headerSrc: "/images/feature-captures/header-book.webp",
    headerHeight: 380,
  },
  trips: {
    src: "/images/feature-captures/trips.webp",
    width: 1320,
    height: 8996,
    alt: "Pack trips: upcoming trips with seats, gates, hotel nights, and time to depart — every trip in one place",
    headerSrc: "/images/feature-captures/header-trips.webp",
    headerHeight: 480,
  },
  stats: {
    src: "/images/feature-captures/stats.webp",
    width: 1320,
    height: 2709,
    alt: "Pack stats: 22.7 times around the earth, travel-day streaks, geography and records, and a world map of visited regions",
    headerSrc: "/images/feature-captures/header-stats.webp",
    headerHeight: 460,
  },
  packs: {
    src: "/images/feature-captures/packs.webp",
    width: 1320,
    height: 2675,
    alt: "Pack packs: friends you plan with, friend requests, and the planning circle ready for trip context",
    headerSrc: "/images/feature-captures/header-packs.webp",
    headerHeight: 480,
  },
  preferences: {
    src: "/images/feature-captures/preferences.webp",
    width: 1320,
    height: 7760,
    alt: "Pack profile and preferences: traveler profile, airline and hotel loyalty programs with points balances, rental car memberships, and event arrival buffers",
    headerSrc: "/images/feature-captures/header-preferences.webp",
    headerHeight: 380,
  },
  home: {
    src: "/images/feature-captures/home.webp",
    width: 1320,
    height: 2868,
    alt: "Pack home: a live in-flight Live Activity, tonight's hotel and the queue, and the composer ready for the next trip",
  },
};
