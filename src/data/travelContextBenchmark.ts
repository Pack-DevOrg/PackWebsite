import {
  CalendarCheck,
  MailSearch,
  Plane,
  SearchCheck,
  ShieldCheck,
  Trophy,
} from "lucide-react";

export const benchmarkOverview = {
  name: "Pack DeeperBench",
  version: "pack-deeperbench-2.0",
  status: "Pack DeeperBench 2.0 public 4×25 / 100-case corpus",
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
    "Every system is evaluated against the same synthetic household, private context, calendar constraints, public timing, and travel inventory.",
    "The user prompt is short; the system has to recover missing trip details from surrounding context instead of relying on the prompt alone.",
    "Pack runs as a domain planning architecture. Baseline agents use direct tool calls and have to discover, reconcile, and structure the relevant evidence themselves.",
    "A case only passes when the final outcome is grounded in the right evidence and matches the expected travel decision.",
    "Unsupported answers, missing final decisions, timeouts, and service-limit failures do not receive final-pass credit.",
  ],
};

export const latestVerifiedPackRun = {
  label: "Pack DeeperBench 2.0 corpus",
  summary:
    "Public corpus is DeeperBench 2.0 (4×25 / 100 cases). No verified 2.0 full-run pass count is published in-repo.",
  hard100Composite: "100 cases · 4×25",
  hard100TotalCost: "not yet verified",
  averageHard100Cost: "not yet verified",
  hard100Runtime: "not yet verified",
  averageHard100Runtime: "not yet verified",
  llmCalls: "not yet verified",
  travelerOutcome: "Book, decline, mark impossible, or ask a clarifying question",
  hiddenContext: "Dates, travelers, obligations, credits, and preferences recovered from private context",
  evidenceGrounding: "Answers must cite the right supporting records and avoid misleading lookalikes",
  inventoryGrounding: "Flights and hotels must match deterministic inventory when a trip is bookable",
  safeAbstention: "No-travel, impossible, and ambiguous requests must not be forced into bookings",
};

export const hard100CorpusSizeLabel = "Hard-100 corpus size";

export const benchmarkDatasetJsonLdDescription =
  "Synthetic benchmark for evidence-grounded travel planning over household context, calendar constraints, public events, and deterministic travel inventory. Public corpus is DeeperBench 2.0 (100 cases · 4×25). No verified 2.0 full-run pass count is published.";

export const benchmarkStatusBarNote =
  "Live metric is corpus size (100 cases · 4×25), not a published run score. No verified 2.0 full-run pass count is published.";

export const benchmarkMetricExplanations = [
  {
    label: hard100CorpusSizeLabel,
    value: latestVerifiedPackRun.hard100Composite,
    body:
      "Published DeeperBench 2.0 corpus size: 100 unique cases across four tracks of 25. This is case count, not a verified pass count.",
  },
  {
    label: "Runtime",
    value: `${latestVerifiedPackRun.hard100Runtime}; ${latestVerifiedPackRun.averageHard100Runtime}`,
    body:
      "Observed execution time for the run, reported as total wall-clock time and average processing time per case.",
  },
  {
    label: "Cost",
    value: `${latestVerifiedPackRun.hard100TotalCost}; ${latestVerifiedPackRun.averageHard100Cost} avg`,
    body:
      "Measured model and tool execution cost for the run, reported as total cost and average cost per case.",
  },
  {
    label: "Model-call count",
    value: latestVerifiedPackRun.llmCalls,
    body:
      "Number of LLM calls made during the run. This records how many model steps were needed to complete the corpus.",
  },
] as const;

export const methodologyNotes = [
  "The corpus is synthetic and uses generated inbox, calendar, public-event, flight, and hotel data.",
  "Prompts are intentionally short. Required facts may be present only in private context or deterministic inventory.",
  "Pack DeeperBench measures a complete travel-planning architecture, not a standalone foundation model in isolation.",
  "Pack uses structured retrieval, context translation, and planning layers to turn large personal-data surfaces into grounded trip decisions.",
  "Baseline agents operate through direct tool-calling loops over the same synthetic task environment.",
  "A passing final answer must match one of the expected outcome classes: bookable trip, no travel needed, impossible, or clarification required.",
  "When a baseline produced substantively useful work without a fully passing final answer, the table reports partial rubric credit for evidence, constraints, and inventory.",
  "The GPT-5.5 xhigh and Claude Opus 4.7 rows cover a fixed 10-case test set intentionally selected from especially difficult hard-100 cases. They are not full hard-100 results.",
  "The comparison should be read as Pack's domain architecture versus general-purpose frontier agents using direct tool calls.",
] as const;

export const neurosymbolicComparison = {
  label: "Architecture Comparison",
  headline: "Ten selected hard-100 cases run across Pack and frontier-agent baselines.",
  summary:
    "This section reports a fixed test set of ten especially difficult cases chosen from the hard-100 corpus. Pack runs through its travel-planning architecture; GPT-5.5 xhigh and Claude Opus 4.7 max-thinking run as general-purpose agents using direct tool calls.",
  measuredCase: "10 difficult hard-100 cases, 45-minute cutoff",
  packCorpusResult: "10/10 final content pass",
  packCorpusCost: "$1.11 total cost",
  packCorpusRuntime: "10m46s cumulative processing inside the full run",
  estimateNote: "Pack values are the matching cases from the May 21 full hard-100 run. Costs show the uncached cost for each ten-case hard-set run. These rows describe the selected hard cases, not full hard-100 evaluations for GPT-5.5 xhigh or Claude Opus 4.7.",
  rows: [
    {
      system: "Pack",
      rubricSystem: "Pack",
      outcome: "10/10 hard set",
      cost: "$1.11",
      costMultiple: "1x Pack cost",
      runtime: "10m46s across the ten hard cases",
      calls: "10/10 final content pass; 10/10 scorable output",
      takeaway: "Used Pack's retrieval, context, and planning layers to return a passing final answer for every selected hard case.",
    },
    {
      system: "GPT-5.5 xhigh",
      rubricSystem: "GPT-5.5 xhigh",
      outcome: "1/10 hard set",
      cost: "$86.60",
      costMultiple: "77.8x Pack cost",
      runtime: "67m16s across the ten hard cases",
      calls: "1/10 final content pass; 0.29 average score",
      takeaway: "One final answer passed. Other cases received partial rubric credit where evidence, constraints, or inventory were correct.",
    },
    {
      system: "Claude Opus 4.7 max-thinking",
      rubricSystem: "Opus 4.7",
      outcome: "2/10 hard set",
      cost: "$17.15",
      costMultiple: "15.4x Pack cost",
      runtime: "38m45s across the ten hard cases",
      calls: "2/10 final content pass; 0.37 average score",
      takeaway: "Two final answers passed. Other cases received partial rubric credit where evidence, constraints, or inventory were correct.",
    },
  ],
};

export const shootoutChartRows = [
  {
    system: "Pack",
    fullName: "Pack",
    solved: 10,
    attempted: 10,
    costUsd: 1.113366,
    runtimeMinutes: 10.76335,
    solvedLabel: "10/10",
    costLabel: "$1.11",
    runtimeLabel: "10m46s",
    tone: "pack",
  },
  {
    system: "GPT-5.5 xhigh",
    fullName: "GPT-5.5 xhigh",
    solved: 1,
    attempted: 10,
    costUsd: 86.6,
    runtimeMinutes: 67.26586666666667,
    solvedLabel: "1/10",
    costLabel: "$86.60",
    runtimeLabel: "67m16s",
    tone: "model",
  },
  {
    system: "Opus 4.7",
    fullName: "Claude Opus 4.7 max-thinking",
    solved: 2,
    attempted: 10,
    costUsd: 17.15,
    runtimeMinutes: 38.75103333333333,
    solvedLabel: "2/10",
    costLabel: "$17.15",
    runtimeLabel: "38m45s",
    tone: "model",
  },
] as const;

export const rubricCategories = [
  {
    key: "validOutput",
    label: "Scorable output",
    description: "Readable enough to score before cutoff; tiny weight.",
  },
  {
    key: "evidence",
    label: "Evidence",
    description: "Right private evidence and red-herring avoidance; small weight.",
  },
  {
    key: "constraints",
    label: "Trip details",
    description: "Travelers, dates, destination, conflicts, and hidden conditions.",
  },
  {
    key: "search",
    label: "Inventory/outcome",
    description: "Valid inventory or the right no-travel, impossible, or clarification state.",
  },
  {
    key: "finalPass",
    label: "Final pass",
    description: "The final answer was fully correct; 50% of the decimal score.",
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
  },
  {
    system: "GPT-5.5 xhigh",
    fullName: "GPT-5.5 xhigh",
    tone: "model",
    denominator: 10,
    validOutput: 9,
    evidence: 6,
    constraints: 5,
    search: 5,
    finalPass: 1,
  },
  {
    system: "Opus 4.7",
    fullName: "Claude Opus 4.7 max-thinking",
    tone: "model",
    denominator: 10,
    validOutput: 10,
    evidence: 3,
    constraints: 6,
    search: 5,
    finalPass: 2,
  },
] as const;

export const hardestTenShootoutRows = [
  {
    number: "001",
    packComponents: { output: "pass", evidence: "pass", constraints: "pass", search: "pass", final: "pass" },
    packCost: "$0.103",
    packRuntime: "49s",
    gptComponents: { output: "pass", evidence: "partial", constraints: "pass", search: "pass", final: "fail" },
    gptCost: "$13.22",
    gptRuntime: "11m04s",
    opusComponents: { output: "pass", evidence: "partial", constraints: "pass", search: "pass", final: "fail" },
    opusCost: "$2.00",
    opusRuntime: "4m26s",
  },
  {
    number: "002",
    packComponents: { output: "pass", evidence: "pass", constraints: "pass", search: "pass", final: "pass" },
    packCost: "$0.101",
    packRuntime: "2m22s",
    gptComponents: { output: "pass", evidence: "pass", constraints: "partial", search: "fail", final: "fail" },
    gptCost: "$1.66",
    gptRuntime: "5m13s",
    opusComponents: { output: "pass", evidence: "pass", constraints: "partial", search: "fail", final: "fail" },
    opusCost: "$1.43",
    opusRuntime: "3m16s",
  },
  {
    number: "003",
    packComponents: { output: "pass", evidence: "pass", constraints: "pass", search: "pass", final: "pass" },
    packCost: "$0.055",
    packRuntime: "45s",
    gptComponents: { output: "pass", evidence: "partial", constraints: "pass", search: "pass", final: "fail" },
    gptCost: "$4.96",
    gptRuntime: "3m32s",
    opusComponents: { output: "pass", evidence: "partial", constraints: "fail", search: "pass", final: "fail" },
    opusCost: "$2.18",
    opusRuntime: "3m10s",
  },
  {
    number: "005",
    packComponents: { output: "pass", evidence: "pass", constraints: "pass", search: "pass", final: "pass" },
    packCost: "$0.095",
    packRuntime: "38s",
    gptComponents: { output: "pass", evidence: "fail", constraints: "pass", search: "fail", final: "fail" },
    gptCost: "$7.53",
    gptRuntime: "9m22s",
    opusComponents: { output: "pass", evidence: "fail", constraints: "pass", search: "fail", final: "fail" },
    opusCost: "$1.94",
    opusRuntime: "5m32s",
  },
  {
    number: "019",
    packComponents: { output: "pass", evidence: "pass", constraints: "pass", search: "pass", final: "pass" },
    packCost: "$0.062",
    packRuntime: "37s",
    gptComponents: { output: "pass", evidence: "fail", constraints: "fail", search: "fail", final: "fail" },
    gptCost: "$20.46",
    gptRuntime: "10m57s",
    opusComponents: { output: "pass", evidence: "pass", constraints: "pass", search: "pass", final: "pass" },
    opusCost: "$0.95",
    opusRuntime: "2m45s",
  },
  {
    number: "039",
    packComponents: { output: "pass", evidence: "pass", constraints: "pass", search: "pass", final: "pass" },
    packCost: "$0.078",
    packRuntime: "51s",
    gptComponents: { output: "pass", evidence: "fail", constraints: "fail", search: "fail", final: "fail" },
    gptCost: "$0.66",
    gptRuntime: "2m54s",
    opusComponents: { output: "pass", evidence: "fail", constraints: "fail", search: "fail", final: "fail" },
    opusCost: "$2.95",
    opusRuntime: "3m25s",
  },
  {
    number: "047",
    packComponents: { output: "pass", evidence: "pass", constraints: "pass", search: "pass", final: "pass" },
    packCost: "$0.175",
    packRuntime: "1m13s",
    gptComponents: { output: "fail", evidence: "fail", constraints: "fail", search: "fail", final: "fail" },
    gptCost: "$20.57",
    gptRuntime: "9m21s",
    opusComponents: { output: "pass", evidence: "partial", constraints: "pass", search: "fail", final: "fail" },
    opusCost: "$2.53",
    opusRuntime: "5m37s",
  },
  {
    number: "052",
    packComponents: { output: "pass", evidence: "pass", constraints: "pass", search: "pass", final: "pass" },
    packCost: "$0.190",
    packRuntime: "1m44s",
    gptComponents: { output: "pass", evidence: "pass", constraints: "partial", search: "fail", final: "fail" },
    gptCost: "$0.39",
    gptRuntime: "57s",
    opusComponents: { output: "pass", evidence: "fail", constraints: "fail", search: "fail", final: "fail" },
    opusCost: "$1.29",
    opusRuntime: "4m00s",
  },
  {
    number: "058",
    packComponents: { output: "pass", evidence: "pass", constraints: "pass", search: "pass", final: "pass" },
    packCost: "$0.153",
    packRuntime: "59s",
    gptComponents: { output: "pass", evidence: "pass", constraints: "pass", search: "pass", final: "pass" },
    gptCost: "$0.32",
    gptRuntime: "1m59s",
    opusComponents: { output: "pass", evidence: "pass", constraints: "pass", search: "pass", final: "pass" },
    opusCost: "$0.24",
    opusRuntime: "1m07s",
  },
  {
    number: "067",
    packComponents: { output: "pass", evidence: "pass", constraints: "pass", search: "pass", final: "pass" },
    packCost: "$0.100",
    packRuntime: "47s",
    gptComponents: { output: "pass", evidence: "partial", constraints: "fail", search: "fail", final: "fail" },
    gptCost: "$16.83",
    gptRuntime: "11m56s",
    opusComponents: { output: "pass", evidence: "partial", constraints: "fail", search: "fail", final: "fail" },
    opusCost: "$1.65",
    opusRuntime: "5m27s",
  },
] as const;

export const phaseCards = [
  {
    title: "1. Context Graph Build",
    metric: "40k emails",
    body:
      "The benchmark is built around a large synthetic household record: inbox history, calendar history, trips, cancellations, changes, loyalty, preferences, obligations, and costs.",
    icon: MailSearch,
  },
  {
    title: "2. Travel Reasoning",
    metric: "100 hard prompts",
    body:
      "Short human requests require decisions grounded in household context, obligations, public-event timing, prior travel, and noisy private evidence.",
    icon: CalendarCheck,
  },
  {
    title: "3. Search Grounding",
    metric: "1M + 1M inventory",
    body:
      "Flight and hotel choices are checked against deterministic inventory for seat fit, price, stops, refundability, room capacity, location, and preference match.",
    icon: Plane,
  },
];

export const scoreCards = [
  {
    label: "Final Answer",
    body: "50% of the score. The returned outcome has to be fully correct: bookable trip, no travel, impossible, or clarification.",
    icon: Trophy,
  },
  {
    label: "Core Trip Details",
    body: "30% of the score. The answer must get travelers, dates, destination, duration, conflicts, and hidden constraints right.",
    icon: CalendarCheck,
  },
  {
    label: "Inventory Or Outcome",
    body: "10% of the score. Complete trips need valid flight and hotel choices; non-trip cases need the correct no-travel, impossible, or clarification result.",
    icon: Plane,
  },
  {
    label: "Evidence",
    body: "7% of the score. The answer must rely on the right private evidence and avoid tempting wrong-owner, promo, stale, or unrelated context.",
    icon: ShieldCheck,
  },
  {
    label: "Scorable Output",
    body: "3% of the score. The response has to be clear enough to score against the shared rubric before cutoff.",
    icon: SearchCheck,
  },
];
