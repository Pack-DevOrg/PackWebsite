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
    "Raw agents received the same short prompts, private-context tools, travel-search tools, and scoring rubric. GPT-5.5 xhigh and Opus 4.7 used a 45-minute per-case cutoff and a $10 fresh-run cost cap.",
  measuredCase: "10 selected hard-100 cases, 45-minute raw-agent cutoff, $10 fresh-run cap per raw model",
  packCorpusResult: "10/10 on the selected subset",
  packCorpusCost: "$0.45 total metered spend",
  packCorpusRuntime: "3m52s cumulative Pack processing time",
  estimateNote: "Pack spend is the measured metered spend from a fresh Pack run. Raw-agent spend is shown as a fresh-run estimate with no cached-input discount. Provider-reported spend is noted separately when the provider returned cached input tokens. GPT-5.5 stopped after one case because that one fresh-run estimate already exceeded the $10 cap; Opus 4.7 stopped after five cases when its cumulative fresh-run estimate exceeded the same cap. A readable plan can be scored even if it does not match Pack's internal schema; malformed or missing required fields are unscorable.",
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
      cost: "$13.22 fresh-run estimate",
      costMultiple: "29.4x",
      runtime: "11m04s on one completed case",
      calls: "Stopped after 1/10 cases by $10 fresh-run cap",
      note: "Produced a scorable plan for the Japan family case but missed required private evidence, so it did not pass.",
    },
    {
      system: "Claude Opus 4.7 max-thinking",
      outcome: "Fail",
      cost: "$12.77 fresh-run estimate",
      costMultiple: "28.4x",
      runtime: "28m30s across five attempted cases",
      calls: "Stopped after 5/10 cases by $10 fresh-run cap",
      note: "All five attempted answers were malformed for the required plan shape and were unscorable.",
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
    solved: 0,
    attempted: 1,
    costUsd: 13.22,
    runtimeMinutes: 11.07,
    solvedLabel: "0/1",
    costLabel: "$13.22",
    runtimeLabel: "11m04s",
    note: "Stopped by cap",
    tone: "raw",
  },
  {
    system: "Opus 4.7",
    fullName: "Claude Opus 4.7 max-thinking",
    solved: 0,
    attempted: 5,
    costUsd: 12.77,
    runtimeMinutes: 28.5,
    solvedLabel: "0/5",
    costLabel: "$12.77",
    runtimeLabel: "28m30s",
    note: "Stopped by cap",
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
    denominator: 1,
    validOutput: 1,
    evidence: 0,
    constraints: 1,
    search: 1,
    finalPass: 0,
    note: "The one attempted plan was scorable and got most travel details right, but failed the required-evidence gate.",
  },
  {
    system: "Opus 4.7",
    fullName: "Claude Opus 4.7 max-thinking",
    tone: "raw",
    denominator: 5,
    validOutput: 0,
    evidence: 0,
    constraints: 0,
    search: 0,
    finalPass: 0,
    note: "Five attempted cases returned malformed plans with missing required fields, so none reached content scoring.",
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
    gptResult: "Scorable plan; missed required school-break evidence",
    opusScore: "Unscored",
    opusCost: "$2.78 fresh",
    opusRuntime: "6m01s",
    opusResult: "Malformed plan: missing required fields",
  },
  {
    number: "002",
    title: "@bel Paris fashion week.",
    packScore: "1.00",
    packCost: "$0.075",
    packRuntime: "44s",
    gptScore: "Not run",
    gptCost: "Stopped by cap",
    gptRuntime: "-",
    gptResult: "GPT fresh-run cap exceeded after case 001",
    opusScore: "Unscored",
    opusCost: "$0.47 fresh",
    opusRuntime: "2m06s",
    opusResult: "Malformed plan: missing required fields",
  },
  {
    number: "003",
    title: "@adam to Tokyo, use the airline credit if we still can.",
    packScore: "1.00",
    packCost: "$0.061",
    packRuntime: "26s",
    gptScore: "Not run",
    gptCost: "Stopped by cap",
    gptRuntime: "-",
    gptResult: "GPT fresh-run cap exceeded after case 001",
    opusScore: "Unscored",
    opusCost: "$2.13 fresh",
    opusRuntime: "3m07s",
    opusResult: "Malformed plan: missing required fields",
  },
  {
    number: "005",
    title: "@danny Orlando theme park weekend.",
    packScore: "1.00",
    packCost: "$0.060",
    packRuntime: "24s",
    gptScore: "Not run",
    gptCost: "Stopped by cap",
    gptRuntime: "-",
    gptResult: "GPT fresh-run cap exceeded after case 001",
    opusScore: "Unscored",
    opusCost: "$0.93 fresh",
    opusRuntime: "2m28s",
    opusResult: "Malformed plan: missing required fields",
  },
  {
    number: "019",
    title: "Forwarded hotel for the upcoming trip.",
    packScore: "1.00",
    packCost: "$0.006",
    packRuntime: "4s",
    gptScore: "Not run",
    gptCost: "Stopped by cap",
    gptRuntime: "-",
    gptResult: "GPT fresh-run cap exceeded after case 001",
    opusScore: "Unscored",
    opusCost: "$6.46 fresh",
    opusRuntime: "14m48s",
    opusResult: "Malformed plan; Opus cap exceeded after this case",
  },
  {
    number: "039",
    title: "@adam NYC meeting trip.",
    packScore: "1.00",
    packCost: "$0.046",
    packRuntime: "20s",
    gptScore: "Not run",
    gptCost: "Stopped by cap",
    gptRuntime: "-",
    gptResult: "GPT fresh-run cap exceeded after case 001",
    opusScore: "Not run",
    opusCost: "Stopped by cap",
    opusRuntime: "-",
    opusResult: "Opus fresh-run cap exceeded after case 019",
  },
  {
    number: "047",
    title: "Miami F1 trip.",
    packScore: "1.00",
    packCost: "$0.027",
    packRuntime: "19s",
    gptScore: "Not run",
    gptCost: "Stopped by cap",
    gptRuntime: "-",
    gptResult: "GPT fresh-run cap exceeded after case 001",
    opusScore: "Not run",
    opusCost: "Stopped by cap",
    opusRuntime: "-",
    opusResult: "Opus fresh-run cap exceeded after case 019",
  },
  {
    number: "052",
    title: "Barcelona Apr 4-7 for all four of us.",
    packScore: "1.00",
    packCost: "$0.038",
    packRuntime: "39s",
    gptScore: "Not run",
    gptCost: "Stopped by cap",
    gptRuntime: "-",
    gptResult: "GPT fresh-run cap exceeded after case 001",
    opusScore: "Not run",
    opusCost: "Stopped by cap",
    opusRuntime: "-",
    opusResult: "Opus fresh-run cap exceeded after case 019",
  },
  {
    number: "058",
    title: "@adam Midtown and Roam week.",
    packScore: "1.00",
    packCost: "$0.046",
    packRuntime: "17s",
    gptScore: "Not run",
    gptCost: "Stopped by cap",
    gptRuntime: "-",
    gptResult: "GPT fresh-run cap exceeded after case 001",
    opusScore: "Not run",
    opusCost: "Stopped by cap",
    opusRuntime: "-",
    opusResult: "Opus fresh-run cap exceeded after case 019",
  },
  {
    number: "067",
    title: "Met Gala, then Knicks.",
    packScore: "1.00",
    packCost: "$0.042",
    packRuntime: "16s",
    gptScore: "Not run",
    gptCost: "Stopped by cap",
    gptRuntime: "-",
    gptResult: "GPT fresh-run cap exceeded after case 001",
    opusScore: "Not run",
    opusCost: "Stopped by cap",
    opusRuntime: "-",
    opusResult: "Opus fresh-run cap exceeded after case 019",
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
