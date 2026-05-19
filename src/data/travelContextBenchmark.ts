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
  officialRunStatus: "Local Pack validation updated May 18, 2026; comparison runs refreshed May 19, 2026",
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
    "Every system gets the same private inbox, calendar, and travel-search tools.",
    "The user prompt is short; the missing details have to be found in the private context.",
    "A response does not need Pack's internal schema to get content credit; it only needs to be scorable.",
    "A case only passes when the answer is grounded in the right evidence and returns the right travel outcome.",
    "Missing answers, unscorable formatting, bad IDs, missing evidence, timeouts, and provider limits score 0.",
  ],
};

export const latestVerifiedPackRun = {
  label: "Hard-100 Pack validation",
  summary:
    "Pack completed all 100 hard cases after the May 18, 2026 targeted rerun fixed the six May 17 failures.",
  hard100Composite: "100/100 hard cases",
  hard100TotalCost: "$3.95",
  averageHard100Cost: "$0.040",
  hard100Runtime: "40m33s cumulative",
  averageHard100Runtime: "24.3s avg/case",
  selectedComparisonSet: "10 hardest cases",
  selectedComparisonRuntime: "3m52s cumulative",
  selectedComparisonScope: "Pack, GPT-5.5 xhigh, and Claude Opus 4.7 max-thinking",
};

export const neurosymbolicComparison = {
  label: "Hardest-10 Comparison",
  headline: "Results from the selected hard cases.",
  summary:
    "Raw agents received the same short prompts, private-context tools, travel-search tools, and scoring rubric. GPT-5.5 xhigh and Opus 4.7 used a 45-minute cutoff and a $10 provider-metered cap per case.",
  measuredCase: "10 selected hard-100 cases, 45-minute raw-agent cutoff, $10 provider-metered cap per case",
  packCorpusResult: "10/10 on the selected subset",
  packCorpusCost: "$0.45 total metered spend",
  packCorpusRuntime: "3m52s cumulative Pack processing time",
  estimateNote: "Pack spend is measured metered spend from a fresh Pack run. Raw-agent spend is shown as a fresh-run estimate with no cached-input discount; provider-metered spend is listed separately when cached input changed the bill. The $10 cap was applied per case, not across the whole model run. Readable off-schema answers received manual content credit; schema-valid output is reported separately.",
  rows: [
    {
      system: "Pack",
      outcome: "Pass",
      cost: "$0.45 metered total",
      costMultiple: "1x",
      runtime: "3m52s cumulative",
      calls: "10/10 selected cases passed; $0.045 avg/case",
      note: "Pack completed the selected subset using the May 17 full run plus May 18 targeted rerun artifacts.",
    },
    {
      system: "GPT-5.5 xhigh",
      outcome: "Fail",
      cost: "$86.60 fresh estimate",
      costMultiple: "192.4x",
      runtime: "48m03s across 10 cases",
      calls: "2/10 content pass; 9/10 schema-valid",
      note: "$17.53 provider-metered after cached input discounts. Four cases were above the $10 fresh no-cache estimate, but no case exceeded the provider-metered cap.",
    },
    {
      system: "Claude Opus 4.7 max-thinking",
      outcome: "Fail",
      cost: "$17.15 fresh estimate",
      costMultiple: "38.1x",
      runtime: "38m50s across 10 cases",
      calls: "2/10 manual content pass; 0/10 schema-valid",
      note: "All ten answers were off-schema, but the readable plans were manually scored for content. No case exceeded the $10 per-case cap.",
    },
  ],
};

export const shootoutChartRows = [
  {
    system: "Pack",
    fullName: "Pack",
    solved: 10,
    attempted: 10,
    costUsd: 0.45,
    runtimeMinutes: 3.87,
    solvedLabel: "10/10",
    costLabel: "$0.45",
    runtimeLabel: "3m52s",
    note: "Completed all 10",
    tone: "pack",
  },
  {
    system: "GPT-5.5 xhigh",
    fullName: "GPT-5.5 xhigh",
    solved: 2,
    attempted: 10,
    costUsd: 86.6,
    runtimeMinutes: 48.05,
    solvedLabel: "2/10",
    costLabel: "$86.60",
    runtimeLabel: "48m03s",
    note: "9/10 schema-valid",
    tone: "raw",
  },
  {
    system: "Opus 4.7",
    fullName: "Claude Opus 4.7 max-thinking",
    solved: 2,
    attempted: 10,
    costUsd: 17.15,
    runtimeMinutes: 38.83,
    solvedLabel: "2/10",
    costLabel: "$17.15",
    runtimeLabel: "38m50s",
    note: "0/10 schema-valid",
    tone: "raw",
  },
] as const;

export const rubricCategories = [
  {
    key: "validOutput",
    label: "Scorable output",
    description: "Returned a readable plan before cutoff. It did not have to match Pack's internal schema.",
  },
  {
    key: "evidence",
    label: "Evidence",
    description: "Cited private evidence that actually exists in the corpus.",
  },
  {
    key: "constraints",
    label: "Constraints",
    description: "Respected travelers, dates, conflicts, and hidden conditions.",
  },
  {
    key: "search",
    label: "Search",
    description: "Selected valid flight and hotel inventory when travel was required.",
  },
  {
    key: "finalPass",
    label: "Final pass",
    description: "Passed every required gate for the case.",
  },
] as const;

export const shootoutRubricRows = [
  {
    system: "Pack",
    fullName: "Pack",
    tone: "pack",
    denominator: 10,
    validOutput: 10,
    evidence: 10,
    constraints: 10,
    search: 10,
    finalPass: 10,
    note: "Pack attempted and passed all selected cases under the same content gates.",
  },
  {
    system: "GPT-5.5 xhigh",
    fullName: "GPT-5.5 xhigh",
    tone: "raw",
    denominator: 10,
    validOutput: 9,
    evidence: 5,
    constraints: 6,
    search: 6,
    finalPass: 2,
    note: "Automated superset scoring. hard-047 hit the tool-call budget before a final answer; the other nine answers were schema-valid and scorable.",
  },
  {
    system: "Opus 4.7",
    fullName: "Claude Opus 4.7 max-thinking",
    tone: "raw",
    denominator: 10,
    validOutput: 10,
    evidence: 3,
    constraints: 6,
    search: 5,
    finalPass: 2,
    note: "Manual content review. All ten answers were readable but off-schema, so schema-valid output was 0/10 even though two plans passed content review.",
  },
] as const;

export const hardestTenShootoutRows = [
  {
    number: "001",
    title: "@family Japan for about a week.",
    packScore: "1.00",
    packCost: "$0.047",
    packRuntime: "24s",
    gptScore: "0.93",
    gptCost: "$13.22 fresh; $2.68 provider-reported",
    gptRuntime: "11m04s",
    gptResult: "Correct window, travelers, and search; missed required school-break email evidence",
    opusScore: "Manual 0.60",
    opusCost: "$2.00 fresh",
    opusRuntime: "4m26s",
    opusResult: "Readable but off-schema; correct window/travelers/search, missed required evidence",
  },
  {
    number: "002",
    title: "@bel Paris fashion week.",
    packScore: "1.00",
    packCost: "$0.075",
    packRuntime: "44s",
    gptScore: "0.86",
    gptCost: "$1.66 fresh; $0.67 provider-reported",
    gptRuntime: "5m13s",
    gptResult: "Got private Paris date evidence; missed required flight and hotel selections",
    opusScore: "Manual 0.60",
    opusCost: "$1.43 fresh",
    opusRuntime: "3m16s",
    opusResult: "Readable but off-schema; found private evidence, did not return valid inventory selections",
  },
  {
    number: "003",
    title: "@adam to Tokyo, use the airline credit if we still can.",
    packScore: "1.00",
    packCost: "$0.061",
    packRuntime: "26s",
    gptScore: "0.92",
    gptCost: "$4.96 fresh; $1.67 provider-reported",
    gptRuntime: "3m32s",
    gptResult: "Got Tokyo plan and inventory; missed required seat-map evidence",
    opusScore: "Manual 0.40",
    opusCost: "$2.18 fresh",
    opusRuntime: "3m10s",
    opusResult: "Readable but off-schema; used the airline credit when the hidden condition made it unsafe",
  },
  {
    number: "005",
    title: "@danny Orlando theme park weekend.",
    packScore: "1.00",
    packCost: "$0.060",
    packRuntime: "24s",
    gptScore: "0.77",
    gptCost: "$7.53 fresh; $1.78 provider-reported",
    gptRuntime: "9m22s",
    gptResult: "Got Orlando traveler and appointment constraint; missed evidence and inventory gates",
    opusScore: "Manual 0.40",
    opusCost: "$1.94 fresh",
    opusRuntime: "5m32s",
    opusResult: "Readable but off-schema; respected orthodontist constraint, failed required evidence/search",
  },
  {
    number: "019",
    title: "Forwarded hotel for the upcoming trip.",
    packScore: "1.00",
    packCost: "$0.006",
    packRuntime: "4s",
    gptScore: "1.00",
    gptCost: "$20.46 fresh; $3.43 provider-reported",
    gptRuntime: "10m57s",
    gptResult: "Passed wrong-owner forwarded-hotel trap",
    opusScore: "Manual 1.00",
    opusCost: "$0.95 fresh",
    opusRuntime: "2m45s",
    opusResult: "Readable but off-schema; correctly abstained and asked for clarification",
  },
  {
    number: "039",
    title: "@adam NYC meeting trip.",
    packScore: "1.00",
    packCost: "$0.046",
    packRuntime: "20s",
    gptScore: "0.79",
    gptCost: "$0.66 fresh; $0.37 provider-reported",
    gptRuntime: "2m54s",
    gptResult: "Missed temporary-home evidence and treated local NYC context incorrectly",
    opusScore: "Manual 0.20",
    opusCost: "$2.95 fresh",
    opusRuntime: "3m25s",
    opusResult: "Readable but off-schema; answered a different Midtown no-travel case",
  },
  {
    number: "047",
    title: "Miami F1 trip.",
    packScore: "1.00",
    packCost: "$0.027",
    packRuntime: "19s",
    gptScore: "Unscored",
    gptCost: "$20.57 fresh; $3.32 provider-reported",
    gptRuntime: "9m21s",
    gptResult: "Hit tool-call budget before returning a final plan",
    opusScore: "Manual 0.60",
    opusCost: "$2.53 fresh",
    opusRuntime: "5m37s",
    opusResult: "Readable but off-schema; rejected honeypot, missed required ambiguity evidence",
  },
  {
    number: "052",
    title: "Barcelona Apr 4-7 for all four of us.",
    packScore: "1.00",
    packCost: "$0.038",
    packRuntime: "39s",
    gptScore: "0.85",
    gptCost: "$0.39 fresh; $0.25 provider-reported",
    gptRuntime: "57s",
    gptResult: "Found blocked evidence but failed the impossible-case booking state",
    opusScore: "Manual 0.20",
    opusCost: "$1.29 fresh",
    opusRuntime: "4m00s",
    opusResult: "Readable but off-schema; said infeasible for the wrong year and wrong reason",
  },
  {
    number: "058",
    title: "@adam Midtown and Roam week.",
    packScore: "1.00",
    packCost: "$0.046",
    packRuntime: "17s",
    gptScore: "1.00",
    gptCost: "$0.32 fresh; $0.23 provider-reported",
    gptRuntime: "1m59s",
    gptResult: "Passed local Midtown no-travel case",
    opusScore: "Manual 1.00",
    opusCost: "$0.24 fresh",
    opusRuntime: "1m07s",
    opusResult: "Readable but off-schema; correctly returned no travel required",
  },
  {
    number: "067",
    title: "Met Gala, then Knicks.",
    packScore: "1.00",
    packCost: "$0.042",
    packRuntime: "16s",
    gptScore: "0.77",
    gptCost: "$16.83 fresh; $3.13 provider-reported",
    gptRuntime: "11m56s",
    gptResult: "Wrong destination, duration, and travelers for Met Gala/Knicks",
    opusScore: "Manual 0.20",
    opusCost: "$1.65 fresh",
    opusRuntime: "5m27s",
    opusResult: "Readable but off-schema; overdeclined instead of planning Adam's New York trip",
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
