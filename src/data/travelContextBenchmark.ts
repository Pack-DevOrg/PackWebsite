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
    "Every system gets the same private inbox, calendar, and travel-search tools.",
    "The user prompt is short; the missing details have to be found in the private context.",
    "A case only passes when the answer is grounded in the right evidence and returns the right travel outcome.",
    "Bad IDs, missing evidence, malformed plans, timeouts, and provider limits score 0.",
  ],
};

export const latestVerifiedPackRun = {
  label: "Hard-100 Pack validation",
  summary:
    "Pack solved every hard case by reading the private context once, turning it into clean state, and planning from that state.",
  hard100Composite: "100/100 hard cases",
  hard100TotalCost: "$3.70",
  averageHard100Cost: "$0.037",
  hard100Runtime: "77m55s cumulative",
  averageHard100Runtime: "46.7s avg/case",
  selectedComparisonSet: "10 hardest cases",
  selectedComparisonRuntime: "8m59s cumulative",
  selectedComparisonScope: "Pack vs raw GPT-5.5 xhigh and Claude Opus 4.7 max-thinking",
};

export const neurosymbolicComparison = {
  label: "Hardest-10 Shootout",
  headline: "Same 10 hard cases. Same tools. Pack solved them for $0.44.",
  summary:
    "Raw LLM agents had to find the clues, remember them, plan the trip, and prove the answer in one long loop. Pack separates those jobs: first it builds the facts, then it plans.",
  measuredCase: "10 hardest hard-100 cases, 5-minute raw-agent cutoff",
  packCorpusResult: "10/10 on the hardest subset",
  packCorpusCost: "$0.44 total on the hardest subset",
  packCorpusRuntime: "8m59s cumulative Pack processing time",
  estimateNote: "Each raw-agent case had a 5-minute cutoff. If it timed out, hit a provider limit, returned broken JSON, or cited evidence that was not in the corpus, it scored 0.",
  rows: [
    {
      system: "Pack neurosymbolic planner",
      outcome: "Pass",
      cost: "$0.44 total",
      costMultiple: "1x",
      runtime: "8m59s cumulative",
      calls: "10/10 hardest cases; $0.044 avg/case",
      note: "Reads once, plans from clean state, then searches.",
    },
    {
      system: "GPT-5.5 xhigh raw agent",
      outcome: "Fail",
      cost: "$1.88 metered before failure",
      costMultiple: "4.3x",
      runtime: "0/10 passed; one produced plan scored 0.00",
      calls: "Same tools, no Pack symbolic state",
      note: "Mostly timed out; one answer cited IDs that did not exist.",
    },
    {
      system: "Claude Opus 4.7 max-thinking raw agent",
      outcome: "Fail",
      cost: "$7.78 metered before failure",
      costMultiple: "17.7x",
      runtime: "0/10 passed",
      calls: "Same tools, no Pack symbolic state",
      note: "Mostly timed out; three answers were malformed.",
    },
  ],
};

export const shootoutChartRows = [
  {
    system: "Pack",
    fullName: "Pack neurosymbolic planner",
    solved: 10,
    costUsd: 0.44,
    runtimeMinutes: 9.0,
    solvedLabel: "10/10",
    costLabel: "$0.44",
    runtimeLabel: "8m59s",
    note: "Passed all 10",
    tone: "pack",
  },
  {
    system: "GPT-5.5 xhigh",
    fullName: "GPT-5.5 xhigh raw agent",
    solved: 0,
    costUsd: 1.88,
    runtimeMinutes: 49.2,
    solvedLabel: "0/10",
    costLabel: "$1.88",
    runtimeLabel: "49m14s",
    note: "No passes",
    tone: "raw",
  },
  {
    system: "Opus 4.7",
    fullName: "Claude Opus 4.7 max-thinking raw agent",
    solved: 0,
    costUsd: 7.78,
    runtimeMinutes: 46.3,
    solvedLabel: "0/10",
    costLabel: "$7.78",
    runtimeLabel: "46m19s",
    note: "No passes",
    tone: "raw",
  },
] as const;

export const hardestTenShootoutRows = [
  {
    number: "007",
    title: "Avery and Jamie wedding, then Tulum.",
    packScore: "1.00",
    packCost: "$0.094",
    packRuntime: "39s",
    gptScore: "0.00",
    gptCost: "5-minute cutoff",
    gptRuntime: "5m cutoff",
    gptResult: "No valid plan",
    opusScore: "0.00",
    opusCost: "5-minute cutoff",
    opusRuntime: "5m cutoff",
    opusResult: "No valid plan",
  },
  {
    number: "008",
    title: "Riley's bachelor weekend for @adam.",
    packScore: "1.00",
    packCost: "$0.043",
    packRuntime: "44s",
    gptScore: "0.00",
    gptCost: "5-minute cutoff",
    gptRuntime: "5m cutoff",
    gptResult: "No valid plan",
    opusScore: "0.00",
    opusCost: "5-minute cutoff",
    opusRuntime: "5m cutoff",
    opusResult: "No valid plan",
  },
  {
    number: "019",
    title: "Forwarded hotel for the upcoming trip.",
    packScore: "1.00",
    packCost: "$0.006",
    packRuntime: "10s",
    gptScore: "0.00",
    gptCost: "5-minute cutoff",
    gptRuntime: "5m cutoff",
    gptResult: "No valid plan",
    opusScore: "0.00",
    opusCost: "5-minute cutoff",
    opusRuntime: "5m cutoff",
    opusResult: "No valid plan",
  },
  {
    number: "029",
    title: "@adam and @bel Japan during their shared time off.",
    packScore: "1.00",
    packCost: "$0.052",
    packRuntime: "28s",
    gptScore: "0.00",
    gptCost: "$1.16",
    gptRuntime: "4m36s",
    gptResult: "Produced plan; invalid evidence/search IDs",
    opusScore: "0.00",
    opusCost: "$1.98",
    opusRuntime: "4m05s",
    opusResult: "Invalid plan",
  },
  {
    number: "047",
    title: "Miami F1 trip.",
    packScore: "1.00",
    packCost: "$0.027",
    packRuntime: "45s",
    gptScore: "0.00",
    gptCost: "5-minute cutoff",
    gptRuntime: "5m cutoff",
    gptResult: "No valid plan",
    opusScore: "0.00",
    opusCost: "5-minute cutoff",
    opusRuntime: "5m cutoff",
    opusResult: "No valid plan",
  },
  {
    number: "050",
    title: "San Diego for all four of us.",
    packScore: "1.00",
    packCost: "$0.053",
    packRuntime: "4m25s",
    gptScore: "0.00",
    gptCost: "5-minute cutoff",
    gptRuntime: "5m cutoff",
    gptResult: "No valid plan",
    opusScore: "0.00",
    opusCost: "$2.71",
    opusRuntime: "3m08s",
    opusResult: "Invalid plan",
  },
  {
    number: "051",
    title: "@adam and @bel Maui.",
    packScore: "1.00",
    packCost: "$0.038",
    packRuntime: "35s",
    gptScore: "0.00",
    gptCost: "$0.72",
    gptRuntime: "4m38s",
    gptResult: "TPM limit before valid plan",
    opusScore: "0.00",
    opusCost: "$3.10",
    opusRuntime: "4m06s",
    opusResult: "Invalid plan",
  },
  {
    number: "060",
    title: "Ceremony near the Tahoe chapel.",
    packScore: "1.00",
    packCost: "$0.039",
    packRuntime: "37s",
    gptScore: "0.00",
    gptCost: "5-minute cutoff",
    gptRuntime: "5m cutoff",
    gptResult: "No valid plan",
    opusScore: "0.00",
    opusCost: "5-minute cutoff",
    opusRuntime: "5m cutoff",
    opusResult: "No valid plan",
  },
  {
    number: "064",
    title: "Watches and Wonders, then Annecy one night.",
    packScore: "1.00",
    packCost: "$0.059",
    packRuntime: "10s",
    gptScore: "0.00",
    gptCost: "5-minute cutoff",
    gptRuntime: "5m cutoff",
    gptResult: "No valid plan",
    opusScore: "0.00",
    opusCost: "5-minute cutoff",
    opusRuntime: "5m cutoff",
    opusResult: "No valid plan",
  },
  {
    number: "088",
    title: "Cancun wedding flight and hotel for @adam and @bel.",
    packScore: "1.00",
    packCost: "$0.032",
    packRuntime: "26s",
    gptScore: "0.00",
    gptCost: "5-minute cutoff",
    gptRuntime: "5m cutoff",
    gptResult: "No valid plan",
    opusScore: "0.00",
    opusCost: "5-minute cutoff",
    opusRuntime: "5m cutoff",
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
