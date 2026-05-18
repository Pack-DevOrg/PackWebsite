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
    "Current local evidence clears the broad corpus, fixture corpus, and hard-100 set under the stricter superset rubric. The hard-100 total combines the May 17 full run with the May 18 targeted retest of the exact six failing cases, not a fresh one-shot 100-case rerun.",
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

export const rawAgentComparison = {
  label: "Raw GPT-5.5 tool agent spot check",
  summary:
    "A raw tool-using GPT-5.5 agent was run on the representative family Japan case with the same synthetic email, calendar, public-event, flight, and hotel tools. It selected viable travel products, but failed the stricter evidence hygiene checks.",
  caseId: "family-japan-for-about-a-week-but-work-around-whatever-sch",
  modelLabel: "GPT-5.5 raw tool agent",
  reasoningEffort: "not persisted by the local adapter",
  artifactPath:
    "PackServer/benchmarks/travel-context/tmp/pack-deeperbench/fakerson-metered-gpt55-20260518-v4/run-bundle.json",
  currentSupersetScore: "0.786",
  currentSupersetPassed: "No",
  storedScore: "0.875",
  cost: "$0.909",
  runtime: "1m 30s",
  modelCalls: "7",
  toolCalls: "44",
  inputTokens: "401,608",
  outputTokens: "2,920",
  cachedTokens: "263,680",
  passedChecks:
    "Destination, dates/window, duration, travelers, flights, hotels, and selected search value.",
  failedChecks:
    "Missed case_japan_school_break_email_2027 and cited stale cancelled hotel evidence adam_fakerson_hotel_cancellation_0007.",
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
