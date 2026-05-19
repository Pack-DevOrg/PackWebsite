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
  label: "Pack artifact status",
  summary:
    "The May 19, 2026 exact-case Pack rerun is now the source for the Pack comparison rows. Earlier Pack hard-100 rollups are under audit and are not used for the shootout numbers.",
  hard100Composite: "Under audit",
  hard100TotalCost: "Under audit",
  averageHard100Cost: "Under audit",
  hard100Runtime: "Under audit",
  averageHard100Runtime: "Under audit",
  selectedComparisonSet: "Same 10 cases as the raw-agent shootout",
  selectedComparisonRuntime: "5m31s planning + search",
  selectedComparisonScope: "Pack, GPT-5.5 xhigh, and Claude Opus 4.7 max-thinking",
};

export const neurosymbolicComparison = {
  label: "Hardest-10 Comparison",
  headline: "Results from the selected hard cases.",
  summary:
    "Pack, GPT-5.5 xhigh, and Opus 4.7 were run on the same ten selected hard cases. Raw agents received the same short prompts, private-context tools, travel-search tools, and scoring rubric. GPT-5.5 xhigh and Opus 4.7 used a 45-minute cutoff and a $10 provider-metered cap per case.",
  measuredCase: "10 selected hard-100 cases, 45-minute raw-agent cutoff, $10 provider-metered cap per case",
  packCorpusResult: "0/10 final content pass on the exact rerun",
  packCorpusCost: "$2.76 fresh estimate including extraction",
  packCorpusRuntime: "5m31s planning + search; extraction snapshot reused",
  estimateNote: "Pack's May 19 exact rerun reused the existing extraction snapshot, includes that snapshot's $1.44 estimated extraction cost, and used provider prompt caching during the run. Its no-cache-equivalent planner estimate is $1.32; provider-metered planner spend was $0.38. Raw-agent spend is shown as fresh-run estimated spend with provider-metered spend listed separately when cached input changed the bill. Readable off-schema answers received manual content credit; schema-valid output is reported separately.",
  rows: [
    {
      system: "Pack",
      outcome: "Fail",
      cost: "$2.76 fresh estimate",
      costMultiple: "1x",
      runtime: "5m31s planning + search",
      calls: "0/10 final content pass; 1/10 expected outcome gate",
      note: "$1.82 provider-metered when the reused extraction snapshot and provider prompt-cache reads are included. The previous per-case Pack 1.00 values were stale and are no longer shown.",
    },
    {
      system: "GPT-5.5 xhigh",
      outcome: "Fail",
      cost: "$86.60 fresh estimate",
      costMultiple: "31.4x",
      runtime: "48m03s across 10 cases",
      calls: "2/10 content pass; 9/10 schema-valid",
      note: "$17.53 provider-metered after cached input discounts. Four cases were above the $10 fresh no-cache estimate, but no case exceeded the provider-metered cap.",
    },
    {
      system: "Claude Opus 4.7 max-thinking",
      outcome: "Fail",
      cost: "$17.15 fresh estimate",
      costMultiple: "6.2x",
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
    solved: 0,
    attempted: 10,
    costUsd: 2.76,
    runtimeMinutes: 5.51,
    solvedLabel: "0/10",
    costLabel: "$2.76",
    runtimeLabel: "5m31s",
    note: "Exact rerun",
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
    evidence: 5,
    constraints: 1,
    search: 1,
    finalPass: 0,
    note: "May 19 exact rerun. Pack returned scorable artifacts for all ten, but only one matched the expected outcome gate and none passed all content gates.",
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
    packScore: "0.00",
    packCost: "$0.046 fresh planner; $0.118 provider",
    packRuntime: "45s",
    packResult: "Failed final pass: found evidence/travelers/search, but started before the allowed window and returned needs-input.",
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
    packScore: "0.00",
    packCost: "$0.130 fresh planner; $0.023 provider",
    packRuntime: "1m01s",
    packResult: "Failed final pass: found private evidence, but used the wrong date window and returned needs-input.",
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
    packScore: "0.00",
    packCost: "$0.122 fresh planner; $0.024 provider",
    packRuntime: "19s",
    packResult: "Matched the outcome gate, but failed final content pass because required seat-map evidence was missing.",
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
    packScore: "0.00",
    packCost: "$0.116 fresh planner; $0.019 provider",
    packRuntime: "21s",
    packResult: "Failed final pass: got traveler and destination, but missed required evidence and returned needs-input.",
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
    packScore: "0.00",
    packCost: "$0.125 fresh planner; $0.023 provider",
    packRuntime: "18s",
    packResult: "Failed final pass in the exact rerun. The prior 1.00 / $0.006 / 4s value was unsupported.",
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
    packScore: "0.00",
    packCost: "$0.131 fresh planner; $0.026 provider",
    packRuntime: "26s",
    packResult: "Failed final pass: treated a no-travel case as a travel-planning request.",
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
    packScore: "0.00",
    packCost: "$0.158 fresh planner; $0.038 provider",
    packRuntime: "47s",
    packResult: "Failed final pass: expected clarification, but Pack produced a complete trip.",
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
    packScore: "0.00",
    packCost: "$0.145 fresh planner; $0.034 provider",
    packRuntime: "49s",
    packResult: "Failed final pass: expected impossible, but Pack returned needs-input and selected travel inventory.",
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
    packScore: "0.00",
    packCost: "$0.168 fresh planner; $0.036 provider",
    packRuntime: "24s",
    packResult: "Failed final pass: expected no travel, but Pack returned needs-input.",
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
    packScore: "0.00",
    packCost: "$0.181 fresh planner; $0.041 provider",
    packRuntime: "21s",
    packResult: "Failed final pass: wrong destination/duration/traveler handling.",
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
