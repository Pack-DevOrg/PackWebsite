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
  name: "Pack DeeperBench",
  version: "pack-deeperbench-v0",
  officialRunStatus: "Local Pack planner validation updated May 18, 2026; raw-model shootout refreshed May 19, 2026",
  corpus: {
    household: "Synthetic household",
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
  label: "Hard-100 Pack validation",
  summary:
    "Pack passes the current hard-100 evidence set by extracting structured travel context first, then planning and searching against typed constraints.",
  hard100Composite: "100/100 hard cases",
  hard100TotalCost: "$3.70",
  averageHard100Cost: "$0.037",
  selectedComparisonSet: "10 hardest cases",
  selectedComparisonScope: "Pack vs raw GPT-5.5 xhigh and Claude Opus 4.7 max-thinking",
};

export const neurosymbolicComparison = {
  label: "Hardest-10 Shootout",
  headline: "Pack passes all 10 hardest cases; raw max-thinking agents did not pass a case.",
  summary:
    "Pack turns private travel context into compact symbolic state before planning. The raw agents had the same tools, but had to search, read, remember, reason, and ground evidence inside one expensive loop.",
  measuredCase: "10 hardest hard-100 cases, 5-minute raw-agent cutoff",
  packCorpusResult: "10/10 on the hardest subset",
  packCorpusCost: "$0.44 total on the hardest subset",
  estimateNote: "Raw LLM attempts used the same tools and a 5-minute per-case cutoff. Failures score 0 when they hit the cutoff, provider limits, budget caps, or invalid output.",
  rows: [
    {
      system: "Pack neurosymbolic planner",
      outcome: "Pass",
      cost: "$0.44 total",
      costMultiple: "1x",
      runtime: "10/10 hardest cases",
      calls: "$0.044 avg/case",
      note: "Structured extraction, typed planning, and deterministic search.",
    },
    {
      system: "GPT-5.5 xhigh raw agent",
      outcome: "Fail",
      cost: "$1.88 metered before failure",
      costMultiple: "4.3x Pack cost",
      runtime: "0/10 passed; 1 valid but unscored plan",
      calls: "Same tools, no Pack symbolic state",
      note: "Eight cases hit the 5-minute cutoff, one hit a TPM limit, and one returned a valid plan without a local hard-10 rubric entry.",
    },
    {
      system: "Claude Opus 4.7 max-thinking raw agent",
      outcome: "Fail",
      cost: "$7.78 metered before failure",
      costMultiple: "17.7x Pack cost",
      runtime: "0/10 passed",
      calls: "Same tools, no Pack symbolic state",
      note: "Seven cases hit the 5-minute cutoff and three returned malformed plans after multi-dollar tool loops.",
    },
  ],
};

export const hardestTenShootoutRows = [
  {
    number: "007",
    title: "Avery and Jamie wedding, then Tulum.",
    packScore: "1.00",
    packCost: "$0.094",
    gptScore: "0.00",
    gptCost: "5-minute cutoff",
    gptResult: "No valid plan",
    opusScore: "0.00",
    opusCost: "5-minute cutoff",
    opusResult: "No valid plan",
  },
  {
    number: "008",
    title: "Riley's bachelor weekend for @adam.",
    packScore: "1.00",
    packCost: "$0.043",
    gptScore: "0.00",
    gptCost: "5-minute cutoff",
    gptResult: "No valid plan",
    opusScore: "0.00",
    opusCost: "5-minute cutoff",
    opusResult: "No valid plan",
  },
  {
    number: "019",
    title: "Forwarded hotel for the upcoming trip.",
    packScore: "1.00",
    packCost: "$0.006",
    gptScore: "0.00",
    gptCost: "5-minute cutoff",
    gptResult: "No valid plan",
    opusScore: "0.00",
    opusCost: "5-minute cutoff",
    opusResult: "No valid plan",
  },
  {
    number: "029",
    title: "@adam and @bel Japan during their shared time off.",
    packScore: "1.00",
    packCost: "$0.052",
    gptScore: "Unscored",
    gptCost: "$1.16",
    gptResult: "Valid plan; no local rubric entry",
    opusScore: "0.00",
    opusCost: "$1.98",
    opusResult: "Invalid plan",
  },
  {
    number: "047",
    title: "Miami F1 trip.",
    packScore: "1.00",
    packCost: "$0.027",
    gptScore: "0.00",
    gptCost: "5-minute cutoff",
    gptResult: "No valid plan",
    opusScore: "0.00",
    opusCost: "5-minute cutoff",
    opusResult: "No valid plan",
  },
  {
    number: "050",
    title: "San Diego for all four of us.",
    packScore: "1.00",
    packCost: "$0.053",
    gptScore: "0.00",
    gptCost: "5-minute cutoff",
    gptResult: "No valid plan",
    opusScore: "0.00",
    opusCost: "$2.71",
    opusResult: "Invalid plan",
  },
  {
    number: "051",
    title: "@adam and @bel Maui.",
    packScore: "1.00",
    packCost: "$0.038",
    gptScore: "0.00",
    gptCost: "$0.72",
    gptResult: "TPM limit before valid plan",
    opusScore: "0.00",
    opusCost: "$3.10",
    opusResult: "Invalid plan",
  },
  {
    number: "060",
    title: "Ceremony near the Tahoe chapel.",
    packScore: "1.00",
    packCost: "$0.039",
    gptScore: "0.00",
    gptCost: "5-minute cutoff",
    gptResult: "No valid plan",
    opusScore: "0.00",
    opusCost: "5-minute cutoff",
    opusResult: "No valid plan",
  },
  {
    number: "064",
    title: "Watches and Wonders, then Annecy one night.",
    packScore: "1.00",
    packCost: "$0.059",
    gptScore: "0.00",
    gptCost: "5-minute cutoff",
    gptResult: "No valid plan",
    opusScore: "0.00",
    opusCost: "5-minute cutoff",
    opusResult: "No valid plan",
  },
  {
    number: "088",
    title: "Cancun wedding flight and hotel for @adam and @bel.",
    packScore: "1.00",
    packCost: "$0.032",
    gptScore: "0.00",
    gptCost: "5-minute cutoff",
    gptResult: "No valid plan",
    opusScore: "0.00",
    opusCost: "5-minute cutoff",
    opusResult: "No valid plan",
  },
] as const;

export const hard100Cases = [
  {
    "number": "001",
    "title": "@family Japan for about a week."
  },
  {
    "number": "002",
    "title": "@bel Paris fashion week."
  },
  {
    "number": "003",
    "title": "@adam to Tokyo, use the airline credit if we still can."
  },
  {
    "number": "004",
    "title": "@chase to Denver for that show."
  },
  {
    "number": "005",
    "title": "@danny Orlando theme park weekend."
  },
  {
    "number": "006",
    "title": "James wedding near Tahoe."
  },
  {
    "number": "007",
    "title": "Avery and Jamie wedding, then Tulum."
  },
  {
    "number": "008",
    "title": "Riley's bachelor weekend for @adam."
  },
  {
    "number": "009",
    "title": "US Open weekend for @adam."
  },
  {
    "number": "010",
    "title": "@adam Betaworks trip."
  },
  {
    "number": "011",
    "title": "Rome for @family."
  },
  {
    "number": "012",
    "title": "@bel London trip."
  },
  {
    "number": "013",
    "title": "Book the offsite travel."
  },
  {
    "number": "014",
    "title": "Broncos in Denver, then Vail ski nights for @chase."
  },
  {
    "number": "015",
    "title": "@danny museum weekend."
  },
  {
    "number": "016",
    "title": "Miami for @adam and @bel, with @bel staying longer."
  },
  {
    "number": "017",
    "title": "@family spring break in Japan."
  },
  {
    "number": "018",
    "title": "Japan trip with the reservations we have."
  },
  {
    "number": "019",
    "title": "Forwarded hotel for the upcoming trip."
  },
  {
    "number": "020",
    "title": "Fix the changed flight time."
  },
  {
    "number": "021",
    "title": "Japan again, but avoid that bad connection from last time."
  },
  {
    "number": "022",
    "title": "Use expiring points or credits for the next trip."
  },
  {
    "number": "023",
    "title": "@bel's Paris event weekend."
  },
  {
    "number": "024",
    "title": "@adam flight using Alaska or Delta if it makes sense."
  },
  {
    "number": "025",
    "title": "@chase gets a window seat if possible."
  },
  {
    "number": "026",
    "title": "@danny gets a window seat if possible."
  },
  {
    "number": "027",
    "title": "@adam and @bel Japan."
  },
  {
    "number": "028",
    "title": "@family Japan with the friend if that works."
  },
  {
    "number": "029",
    "title": "@adam and @bel Japan during their shared time off."
  },
  {
    "number": "030",
    "title": "@bel's conference travel."
  },
  {
    "number": "031",
    "title": "Airbnb for the upcoming trip."
  },
  {
    "number": "032",
    "title": "Airline follow-up for the next trip."
  },
  {
    "number": "033",
    "title": "Use that fare sale if it helps."
  },
  {
    "number": "034",
    "title": "Conference travel after the city changed."
  },
  {
    "number": "035",
    "title": "Finish the hotel for the trip."
  },
  {
    "number": "036",
    "title": "Finish the flights for the trip."
  },
  {
    "number": "037",
    "title": "Fix the return flight after the event."
  },
  {
    "number": "038",
    "title": "Move the return flight if there is a better option."
  },
  {
    "number": "039",
    "title": "@adam NYC meeting trip."
  },
  {
    "number": "040",
    "title": "One way after the conference."
  },
  {
    "number": "041",
    "title": "@bel and @adam to Paris around NYFW."
  },
  {
    "number": "042",
    "title": "Milan design week with @chase and @danny."
  },
  {
    "number": "043",
    "title": "NYC marathon weekend for @family."
  },
  {
    "number": "044",
    "title": "Tokyo cherry blossoms."
  },
  {
    "number": "045",
    "title": "@bel London theatre weekend."
  },
  {
    "number": "046",
    "title": "@bel to Austin GP."
  },
  {
    "number": "047",
    "title": "Miami F1 trip."
  },
  {
    "number": "048",
    "title": "Beach wedding, then investor breakfast."
  },
  {
    "number": "049",
    "title": "Riley's bachelor weekend in Nashville."
  },
  {
    "number": "050",
    "title": "San Diego for all four of us."
  },
  {
    "number": "051",
    "title": "@adam and @bel Maui."
  },
  {
    "number": "052",
    "title": "Barcelona Apr 4-7 for all four of us."
  },
  {
    "number": "053",
    "title": "Grandparents meet us in Orlando."
  },
  {
    "number": "054",
    "title": "Boston appointment travel."
  },
  {
    "number": "055",
    "title": "@adam to Lisbon after the conference."
  },
  {
    "number": "056",
    "title": "Customer summit travel."
  },
  {
    "number": "057",
    "title": "Seattle Apr 10-14."
  },
  {
    "number": "058",
    "title": "@adam Midtown and Roam week."
  },
  {
    "number": "059",
    "title": "NYC dinners next week."
  },
  {
    "number": "060",
    "title": "Ceremony near the Tahoe chapel."
  },
  {
    "number": "061",
    "title": "Event trip after the city moved."
  },
  {
    "number": "062",
    "title": "@bel to Pitti."
  },
  {
    "number": "063",
    "title": "Sundance, then a quiet cabin."
  },
  {
    "number": "064",
    "title": "Watches and Wonders, then Annecy one night."
  },
  {
    "number": "065",
    "title": "Osheaga, then somewhere calmer nearby."
  },
  {
    "number": "066",
    "title": "ACL, then somewhere cold and quiet."
  },
  {
    "number": "067",
    "title": "Met Gala, then Knicks."
  },
  {
    "number": "068",
    "title": "Primavera, then Menorca."
  },
  {
    "number": "069",
    "title": "Tokyo Marathon, then Kyoto."
  },
  {
    "number": "070",
    "title": "Gion Matsuri, then Nara."
  },
  {
    "number": "071",
    "title": "Nashville CMA for @bel."
  },
  {
    "number": "072",
    "title": "Santa Fe Indian Market with @family."
  },
  {
    "number": "073",
    "title": "@adam Zurich Street Parade."
  },
  {
    "number": "074",
    "title": "Lake Como during Milan derby."
  },
  {
    "number": "075",
    "title": "@adam and @bel Charleston weekend."
  },
  {
    "number": "076",
    "title": "Memorial Day beach in San Diego."
  },
  {
    "number": "077",
    "title": "@bel Palm Springs long weekend."
  },
  {
    "number": "078",
    "title": "@family long weekend to Vancouver or San Francisco."
  },
  {
    "number": "079",
    "title": "Hamilton in NYC this summer."
  },
  {
    "number": "080",
    "title": "Louis the Child in Chicago, then three quiet days nearby."
  },
  {
    "number": "081",
    "title": "Vegas two nights, maybe Warriors too."
  },
  {
    "number": "082",
    "title": "Salt Lake weekend with snow and hot springs."
  },
  {
    "number": "083",
    "title": "Extend Boston through Tuesday."
  },
  {
    "number": "084",
    "title": "NYC around Roam and Tanooki."
  },
  {
    "number": "085",
    "title": "Reno July Fourth."
  },
  {
    "number": "086",
    "title": "Cancun wedding flight only."
  },
  {
    "number": "087",
    "title": "Cancun wedding hotel only."
  },
  {
    "number": "088",
    "title": "Cancun wedding flight and hotel for @adam and @bel."
  },
  {
    "number": "089",
    "title": "After the wedding, somewhere cold for four nights."
  },
  {
    "number": "090",
    "title": "After the Cancun wedding, quiet scenic two nights."
  },
  {
    "number": "091",
    "title": "Lisbon four nights."
  },
  {
    "number": "092",
    "title": "One way to Paris."
  },
  {
    "number": "093",
    "title": "Chicago weekend trip after work Friday."
  },
  {
    "number": "094",
    "title": "After Midtown meetings, see if Knicks works."
  },
  {
    "number": "095",
    "title": "Porto during Primavera Pro."
  },
  {
    "number": "096",
    "title": "Taipei Lantern Festival."
  },
  {
    "number": "097",
    "title": "Vienna opera, then somewhere rainy and bookish nearby."
  },
  {
    "number": "098",
    "title": "Rosalia in Montreal, then Quebec City."
  },
  {
    "number": "099",
    "title": "Orlando family trip."
  },
  {
    "number": "100",
    "title": "Tokyo food week with @family."
  }
] as const;

export const phaseCards = [
  {
    title: "1. Travel Extractor",
    metric: "40k emails",
    body:
      "Runs Pack's real streaming extractor over Gmail-shaped messages and calendar events, then emits profile JSON for trips, cancellations, changes, loyalty, preferences, and costs.",
    icon: MailSearch,
  },
  {
    title: "2. Trip Planner",
    metric: "100 hard prompts",
    body:
      "Runs Pack's real planner on human-written requests with extracted family context, obligations, public-event timing, prior travel, and noisy private context.",
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
    body: "Correct trips, travelers, cancellations, changes, active bookings, loyalty, and preference evidence.",
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
