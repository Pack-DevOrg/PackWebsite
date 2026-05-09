import {
  CalendarCheck,
  Clock3,
  DollarSign,
  MailSearch,
  Plane,
  SearchCheck,
  ShieldCheck,
  Trophy,
} from "lucide-react";

export const benchmarkOverview = {
  version: "travel-context-scaffold-v0",
  officialRunStatus: "Full 100-case Pack run pending",
  corpus: {
    household: "Fakerson household",
    people: 4,
    emailsPerPerson: "10,000",
    totalEmails: "40,000",
    travelEmails: "~16,000",
    nonTravelEmails: "~24,000",
    flightInventory: "1,000,000",
    hotelInventory: "1,000,000",
  },
  protocol: [
    "Extractor receives Gmail-like and Calendar-like APIs over the synthetic household corpus.",
    "Planner receives the extracted private travel context plus the natural user prompt.",
    "Search receives Pack planner outlines and ranks deterministic flight and hotel inventory.",
    "Official scoring gives no grace for failed phases, invalid IDs, missing evidence, or malformed outputs.",
  ],
};

export const latestVerifiedPackRun = {
  label: "Latest verified local Pack smoke",
  artifactPath: "PackServer/tmp/hartwell-pack-phased-calendar-smoke/aggregate.json",
  caseCount: 1,
  prompt:
    "Book two weeks in Japan for @family in June 2027. Start with Tokyo and keep our usual two-room family split.",
  extractionProfiles: 4,
  historicalTrips: 8,
  scannedFlights: "2,000,000",
  scannedHotels: "1,000,000",
  selectedFlights: 2,
  selectedHotels: 1,
  costs: {
    extraction: "$0.1352",
    planning: "$0.2111",
    search: "$0.0000",
    total: "$0.3464",
  },
  runtime: {
    planning: "38.9s",
    search: "5.7s",
  },
  scores: {
    planningAccuracy: "1.00",
    searchAccuracy: "1.00",
    userValue: "1.00",
    caseCompletion: "1.00",
  },
};

export const phaseCards = [
  {
    title: "1. Travel Extractor",
    metric: "40k emails",
    body:
      "Runs Pack's real streaming extractor over Gmail-shaped messages and calendar events, then emits profile JSON for trips, cancellations, stale evidence, loyalty, preferences, and costs.",
    icon: MailSearch,
  },
  {
    title: "2. Trip Planner",
    metric: "100 hard prompts",
    body:
      "Runs Pack's real planner on human-written requests with extracted family context, obligations, public-event timing, prior travel, and red-herring private context.",
    icon: CalendarCheck,
  },
  {
    title: "3. Travel Search",
    metric: "1M + 1M inventory",
    body:
      "Executes deterministic flight and hotel search from Pack planner outlines, then scores seat fit, price, stops, refundability, room capacity, location, and preference match.",
    icon: Plane,
  },
];

export const scoreCards = [
  {
    label: "Extraction Accuracy",
    body: "Correct trips, travelers, cancellations, changes, stale bookings, loyalty, and preference evidence.",
    icon: SearchCheck,
  },
  {
    label: "Planning Accuracy",
    body: "Correct dates, travelers, public timing, calendar constraints, active context, and trip outline structure.",
    icon: CalendarCheck,
  },
  {
    label: "User Value",
    body: "Whether selected flights and hotels actually match family seats, fare flexibility, price, rooms, and location preferences.",
    icon: Trophy,
  },
  {
    label: "Grounding",
    body: "Evidence quality for inbox, calendar, public-event, planner, and search decisions.",
    icon: ShieldCheck,
  },
  {
    label: "Runtime",
    body: "Wall-clock time by extractor, planner, search, and full case execution.",
    icon: Clock3,
  },
  {
    label: "Fully Loaded Cost",
    body: "Model calls, Pack phase costs, and local/AWS runner costs reported separately.",
    icon: DollarSign,
  },
];
