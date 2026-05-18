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
  officialRunStatus: "Local Pack planner validation updated May 18, 2026",
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
  label: "Latest local Pack planner validation",
  summary:
    "Pack clears the broad corpus, fixture corpus, and hard-100 evidence set by extracting structured travel context first, then planning and searching against typed constraints.",
  artifactPath: "PackServer/tmp/travel-planner-corpus/local-hard100-last6-current-20260518-v5/aggregate.json",
  validatedCases: "378/378",
  broadRegression: "222/222",
  fixtureCorpus: "56/56",
  hard100Composite: "100/100",
  hard100FullRunRescore: "97/100",
  hard100FullRunAverageScore: "0.988",
  hardTailRetest: "6/6",
  hardTailRetestAverageScore: "1.000",
  priorHard100FullRun: "94/100 original scoring",
  currentRubricStatus: "100/100 merged evidence",
  hard100TotalCost: "$3.70",
  averageHard100Cost: "$0.037",
  representativeCaseCost: "$0.047",
  representativeCaseRuntime: "26s",
  representativeCaseCalls: "4",
  newLiveRetestCost: "$0.2353",
  newLiveRetestRuntime: "2m 21s",
  corpusRuns: [
    {
      label: "Broad regression corpus",
      result: "222/222",
      generatedAt: "May 17, 2026",
      artifactPath: "PackServer/tmp/travel-planner-corpus/local-broad222-structured-20260517-v4/summary.json",
    },
    {
      label: "Fixture corpus",
      result: "56/56",
      generatedAt: "May 17, 2026",
      artifactPath: "PackServer/tmp/travel-planner-corpus/local-fixture56-current-20260517-v2/summary.json",
    },
    {
      label: "Hard-100 failing-tail retest",
      result: "6/6",
      generatedAt: "May 18, 2026",
      artifactPath: "PackServer/tmp/travel-planner-corpus/local-hard100-last6-current-20260518-v5/aggregate.json",
    },
    {
      label: "Full hard-100 run rescored with current rubric",
      result: "97/100",
      generatedAt: "May 17, 2026",
      artifactPath: "PackServer/tmp/travel-planner-corpus/local-hard100-current-20260517-v1/aggregate.json",
    },
  ],
};

export const neurosymbolicComparison = {
  label: "Neurosymbolic vs. Raw LLMs",
  headline: "Pack passes the Japan planning case for $0.047. The raw frontier-agent path costs 19x to 70x more and does not pass the measured run.",
  summary:
    "The demo point is simple: Pack turns private travel context into a compact symbolic state before the model plans. A raw model agent has to search, read, remember, reason, and ground evidence inside one expensive loop.",
  caseId: "family-japan-for-about-a-week-but-work-around-whatever-sch",
  measuredCase: "Representative family Japan trip",
  packCorpusResult: "100/100 hard-100 evidence set",
  packCorpusCost: "$3.70 for the full hard-100 run",
  estimateNote:
    "Max-thinking estimates use current public token rates and the measured raw GPT-5.5 tool trace with 50k additional billed reasoning/thinking output tokens.",
  rows: [
    {
      system: "Pack neurosymbolic planner",
      outcome: "Pass",
      cost: "$0.047",
      costMultiple: "1x",
      runtime: "26s",
      calls: "4 model calls",
      note:
        "Structured extraction preserved the school-break evidence, typed planning enforced the trip constraints, and deterministic search selected valid travel.",
    },
    {
      system: "GPT-5.5 raw tool agent",
      outcome: "Fail",
      cost: "$0.91 measured",
      costMultiple: "19x",
      runtime: "1m 30s",
      calls: "7 model calls, 44 tool calls",
      note:
        "Found flights and hotel, but missed required school-break evidence and grounded part of the answer in a cancelled hotel distractor.",
    },
    {
      system: "GPT-5.5 xhigh raw agent",
      outcome: "Estimated",
      cost: "~$2.4",
      costMultiple: "~51x",
      runtime: "Higher latency",
      calls: "Same tool path plus 50k reasoning tokens",
      note:
        "This is the same raw-agent path with a larger reasoning budget. It still has to solve retrieval, evidence selection, planning, and booking in one loop.",
    },
    {
      system: "Claude Opus 4.7 max-thinking raw agent",
      outcome: "Estimated",
      cost: "~$3.3",
      costMultiple: "~70x",
      runtime: "Higher latency",
      calls: "Same tool path plus 50k thinking tokens",
      note:
        "This applies Opus 4.7 public token rates to the same raw trace and max-thinking budget.",
    },
  ],
  artifactPath:
    "PackServer/benchmarks/travel-context/tmp/pack-deeperbench/fakerson-metered-gpt55-20260518-v4/run-bundle.json",
  pricingSources: [
    {
      label: "OpenAI API pricing",
      href: "https://openai.com/api/pricing/",
    },
    {
      label: "Anthropic Claude pricing",
      href: "https://platform.claude.com/docs/en/about-claude/pricing",
    },
  ],
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
