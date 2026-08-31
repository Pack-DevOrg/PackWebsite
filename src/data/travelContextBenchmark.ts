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
    title: "@family Japan for about a week.",
    hardReason: "Requires finding the real school-break/PTO window across private mail and calendar, then avoiding a tempting but wrong earlier Japan window.",
    packComponents: { output: "pass", evidence: "pass", constraints: "pass", search: "pass", final: "pass" },
    packCost: "$0.103",
    packRuntime: "49s",
    packResult: "Passed: used the 2027 family spring-break window, planned Tokyo and Osaka for all four travelers, and kept the trip dates inside the verified availability window.",
    gptComponents: { output: "pass", evidence: "partial", constraints: "pass", search: "pass", final: "fail" },
    gptCost: "$13.22",
    gptRuntime: "11m04s",
    gptResult: "Right destination, travelers, dates, and inventory; missed the required school-break email evidence.",
    opusComponents: { output: "pass", evidence: "partial", constraints: "pass", search: "pass", final: "fail" },
    opusCost: "$2.00",
    opusRuntime: "4m26s",
    opusResult: "Right Japan window, travelers, and hotel; used repositioning legs and missed the required school-break email evidence.",
  },
  {
    number: "002",
    title: "@bel Paris fashion week.",
    hardReason: "The prompt hides the actual fashion-week dates in private context and still requires valid flight and hotel inventory, not just the event city.",
    packComponents: { output: "pass", evidence: "pass", constraints: "pass", search: "pass", final: "pass" },
    packCost: "$0.101",
    packRuntime: "2m22s",
    packResult: "Passed: used the Bel-only Paris Fashion Week evidence, preserved the September 28 private date, and completed the Paris plan with valid inventory.",
    gptComponents: { output: "pass", evidence: "pass", constraints: "partial", search: "fail", final: "fail" },
    gptCost: "$1.66",
    gptRuntime: "5m13s",
    gptResult: "Found the private Paris date and Bel-only traveler; did not return valid flight or hotel selections.",
    opusComponents: { output: "pass", evidence: "pass", constraints: "partial", search: "fail", final: "fail" },
    opusCost: "$1.43",
    opusRuntime: "3m16s",
    opusResult: "Correctly used the private Sep 28 Paris date and Bel-only traveler; left flight and hotel inventory unselected.",
  },
  {
    number: "003",
    title: "@adam to Tokyo, use the airline credit if we still can.",
    hardReason: "The model has to verify credit eligibility, dates, and seat-map evidence; using the credit without the hidden condition is wrong.",
    packComponents: { output: "pass", evidence: "pass", constraints: "pass", search: "pass", final: "pass" },
    packCost: "$0.055",
    packRuntime: "45s",
    packResult: "Passed: planned Adam's Tokyo trip after respecting the airline-credit condition and the required seat-map evidence.",
    gptComponents: { output: "pass", evidence: "partial", constraints: "pass", search: "pass", final: "fail" },
    gptCost: "$4.96",
    gptRuntime: "3m32s",
    gptResult: "Got the Tokyo solo trip and inventory; missed the required seat-map evidence.",
    opusComponents: { output: "pass", evidence: "partial", constraints: "fail", search: "pass", final: "fail" },
    opusCost: "$2.18",
    opusRuntime: "3m10s",
    opusResult: "Planned Adam to Tokyo, but used the airline credit when the hidden condition made it unsafe.",
  },
  {
    number: "005",
    title: "@danny Orlando theme park weekend.",
    hardReason: "Danny's trip depends on a private appointment constraint plus evidence for the right traveler, destination, and bookable inventory.",
    packComponents: { output: "pass", evidence: "pass", constraints: "pass", search: "pass", final: "pass" },
    packCost: "$0.095",
    packRuntime: "38s",
    packResult: "Passed: resolved Danny's Orlando weekend, appointment constraint, traveler scope, and bookable inventory.",
    gptComponents: { output: "pass", evidence: "fail", constraints: "pass", search: "fail", final: "fail" },
    gptCost: "$7.53",
    gptRuntime: "9m22s",
    gptResult: "Got Danny, Orlando, and the appointment constraint; missed required evidence and inventory.",
    opusComponents: { output: "pass", evidence: "fail", constraints: "pass", search: "fail", final: "fail" },
    opusCost: "$1.94",
    opusRuntime: "5m32s",
    opusResult: "Respected the orthodontist constraint and destination; failed required evidence, seat, flight, and hotel output.",
  },
  {
    number: "019",
    title: "Forwarded hotel for the upcoming trip.",
    hardReason: "This is a wrong-owner trap: the only obvious hotel confirmation matches a plausible trip but explicitly belongs to someone outside the household.",
    packComponents: { output: "pass", evidence: "pass", constraints: "pass", search: "pass", final: "pass" },
    packCost: "$0.062",
    packRuntime: "37s",
    packResult: "Passed: rejected the external forwarded hotel because it did not belong to the household travelers and asked for valid trip evidence.",
    gptComponents: { output: "pass", evidence: "fail", constraints: "fail", search: "fail", final: "fail" },
    gptCost: "$20.46",
    gptRuntime: "10m57s",
    gptResult: "Returned a Tokyo family trip from Japan evidence instead of rejecting the wrong-owner forwarded hotel.",
    opusComponents: { output: "pass", evidence: "pass", constraints: "pass", search: "pass", final: "pass" },
    opusCost: "$0.95",
    opusRuntime: "2m45s",
    opusResult: "Correctly abstained, rejected the external friend's hotel, and asked for clarification.",
  },
  {
    number: "039",
    title: "@adam NYC meeting trip.",
    hardReason: "The correct answer is no travel because Adam is already local; generic NYC meeting evidence pushes planners toward unnecessary flights and hotels.",
    packComponents: { output: "pass", evidence: "pass", constraints: "pass", search: "pass", final: "pass" },
    packCost: "$0.078",
    packRuntime: "51s",
    packResult: "Passed: recognized Adam was already covered by a temporary New York home and returned no travel needed.",
    gptComponents: { output: "pass", evidence: "fail", constraints: "fail", search: "fail", final: "fail" },
    gptCost: "$0.66",
    gptRuntime: "2m54s",
    gptResult: "Answered the wrong NYC no-travel case and missed the Blueground temporary-home window.",
    opusComponents: { output: "pass", evidence: "fail", constraints: "fail", search: "fail", final: "fail" },
    opusCost: "$2.95",
    opusRuntime: "3m25s",
    opusResult: "Answered a different Midtown no-travel case instead of the Blueground long-stay case.",
  },
  {
    number: "047",
    title: "Miami F1 trip.",
    hardReason: "A promotional family-package honeypot conflicts with sparse real evidence, so the right response is clarification instead of booking a complete trip.",
    packComponents: { output: "pass", evidence: "pass", constraints: "pass", search: "pass", final: "pass" },
    packCost: "$0.175",
    packRuntime: "1m13s",
    packResult: "Passed: identified unresolved Miami GP traveler ambiguity and asked for the traveler set before planning.",
    gptComponents: { output: "fail", evidence: "fail", constraints: "fail", search: "fail", final: "fail" },
    gptCost: "$20.57",
    gptRuntime: "9m21s",
    gptResult: "Hit tool-call budget before returning a final plan",
    opusComponents: { output: "pass", evidence: "partial", constraints: "pass", search: "fail", final: "fail" },
    opusCost: "$2.53",
    opusRuntime: "5m37s",
    opusResult: "Rejected the honeypot and declined to book, but missed the required ambiguity evidence and traveler-set clarification.",
  },
  {
    number: "052",
    title: "Barcelona Apr 4-7 for all four of us.",
    hardReason: "It looks like a normal four-person trip, but the requested window is blocked; the system must surface the schedule conflict rather than force inventory.",
    packComponents: { output: "pass", evidence: "pass", constraints: "pass", search: "pass", final: "pass" },
    packCost: "$0.190",
    packRuntime: "1m44s",
    packResult: "Passed: found the all-travelers blocked April 3-8 window and returned a schedule-constraint clarification instead of forcing inventory.",
    gptComponents: { output: "pass", evidence: "pass", constraints: "partial", search: "fail", final: "fail" },
    gptCost: "$0.39",
    gptRuntime: "57s",
    gptResult: "Found the blocked evidence and selected no inventory, but did not cleanly return the impossible outcome.",
    opusComponents: { output: "pass", evidence: "fail", constraints: "fail", search: "fail", final: "fail" },
    opusCost: "$1.29",
    opusRuntime: "4m00s",
    opusResult: "Returned infeasible, but for no-inventory supply reasons and the wrong year, not the all-travelers-blocked reason.",
  },
  {
    number: "058",
    title: "@adam Midtown and Roam week.",
    hardReason: "Another no-travel case: the task is to connect private Roam/Tanooki context with Adam already being in Midtown, then decline travel planning.",
    packComponents: { output: "pass", evidence: "pass", constraints: "pass", search: "pass", final: "pass" },
    packCost: "$0.153",
    packRuntime: "59s",
    packResult: "Passed: recognized the Midtown/Roam request was local and returned no travel needed.",
    gptComponents: { output: "pass", evidence: "pass", constraints: "pass", search: "pass", final: "pass" },
    gptCost: "$0.32",
    gptRuntime: "1m59s",
    gptResult: "Passed local Midtown no-travel case",
    opusComponents: { output: "pass", evidence: "pass", constraints: "pass", search: "pass", final: "pass" },
    opusCost: "$0.24",
    opusRuntime: "1m07s",
    opusResult: "Correctly returned no travel required",
  },
  {
    number: "067",
    title: "Met Gala, then Knicks.",
    hardReason: "The terse prompt requires resolving event eligibility, travelers, destination, local coverage, and Knicks timing without inventing missing evidence.",
    packComponents: { output: "pass", evidence: "pass", constraints: "pass", search: "pass", final: "pass" },
    packCost: "$0.100",
    packRuntime: "47s",
    packResult: "Passed: resolved the New York context and returned no travel needed because Adam was already covered by the temporary home.",
    gptComponents: { output: "pass", evidence: "partial", constraints: "fail", search: "fail", final: "fail" },
    gptCost: "$16.83",
    gptRuntime: "11m56s",
    gptResult: "Returned a Japan family trip instead of the Met Gala and Knicks New York task.",
    opusComponents: { output: "pass", evidence: "partial", constraints: "fail", search: "fail", final: "fail" },
    opusCost: "$1.65",
    opusRuntime: "5m27s",
    opusResult: "Overdeclined for missing invitation/ticket evidence instead of planning Adam's New York trip and noting no Knicks game.",
  },
] as const;

export const hard100Cases = [
  {
    "number": "db2-t1-001",
    "title": "Indy 500 next year."
  },
  {
    "number": "db2-t1-002",
    "title": "Tokyo May 10-17."
  },
  {
    "number": "db2-t1-003",
    "title": "flghts to chicago sept 18-21 pls"
  },
  {
    "number": "db2-t1-004",
    "title": "ok so, thinking portland for a long weekend in august, thursday through sunday-ish, just me and bel, nothing fancy"
  },
  {
    "number": "db2-t1-005",
    "title": "anniversary is oct 9 - somewhere warm? 3 or 4 nights around then"
  },
  {
    "number": "db2-t1-006",
    "title": "one way to denver friday."
  },
  {
    "number": "db2-t1-007",
    "title": "need to be in boston the morning of june 14, fly me in the night before, back same day after lunch"
  },
  {
    "number": "db2-t1-008",
    "title": "vegas w the boys jul 16-18 lfg"
  },
  {
    "number": "db2-t1-009",
    "title": "we want hawaii in feb - actually wait, march. first week of march, 5 nights, maui."
  },
  {
    "number": "db2-t1-010",
    "title": "@family thanksgiving in new york, wednesday to sunday."
  },
  {
    "number": "db2-t1-011",
    "title": "san deigo memorial day weeknd, 2 ppl"
  },
  {
    "number": "db2-t1-012",
    "title": "week in paris with bel in early december, we'll do the markets thing"
  },
  {
    "number": "db2-t1-013",
    "title": "SF then LA, 2 nights each, end of april."
  },
  {
    "number": "db2-t1-014",
    "title": "@chase up to seattle for the long weekend with me."
  },
  {
    "number": "db2-t1-015",
    "title": "cabo... may? 4 nights. adults only"
  },
  {
    "number": "db2-t1-016",
    "title": "so the group chat finally picked a weekend for bel's girls trip - nashville, first weekend of october, she's in, don't worry about the others, just get her there friday back sunday"
  },
  {
    "number": "db2-t1-017",
    "title": "rome dec 27 to jan 2, all of us"
  },
  {
    "number": "db2-t1-018",
    "title": "just a hotel near LGA tuesday night."
  },
  {
    "number": "db2-t1-019",
    "title": "orlanod w danny mar 6-8"
  },
  {
    "number": "db2-t1-020",
    "title": "sfo monday to thursday next week."
  },
  {
    "number": "db2-t1-021",
    "title": "somewhere sunny under $600 flights, mid-march, me and the boys"
  },
  {
    "number": "db2-t1-022",
    "title": "ski before the season ends?? maybe presidents day week"
  },
  {
    "number": "db2-t1-023",
    "title": "drive up to whistler friday to monday, need a hotel and that's it"
  },
  {
    "number": "db2-t1-024",
    "title": "@bel nyc thurs-sun for the gallery thing"
  },
  {
    "number": "db2-t1-025",
    "title": "long story but my college roommate is turning 40 and everyone's meeting in austin, i think the 21st? of august? anyway i just need to be there that saturday night, back sunday or monday, whatever's cheap"
  },
  {
    "number": "db2-t2-001",
    "title": "@adam denver first week of september, use any credits we've got."
  },
  {
    "number": "db2-t2-002",
    "title": "@adam back to that portland hotel i liked, weekend after next."
  },
  {
    "number": "db2-t2-003",
    "title": "@adam anchorage with a plus-one in november, there's a companion deal on my account somewhere."
  },
  {
    "number": "db2-t2-004",
    "title": "@adam quick hop to boise tuesday, you know what i fly."
  },
  {
    "number": "db2-t2-005",
    "title": "@bel chicago for the print expo, usual setup."
  },
  {
    "number": "db2-t2-006",
    "title": "@bel sfo client week again, same rhythm as always."
  },
  {
    "number": "db2-t2-007",
    "title": "@bel to newark next month, she'll want to use those upgrade points."
  },
  {
    "number": "db2-t2-008",
    "title": "@bel LA shoot the last week of january, hotel needs a real desk."
  },
  {
    "number": "db2-t2-009",
    "title": "@chase ski weekend in january, one of the mountains on his pass."
  },
  {
    "number": "db2-t2-010",
    "title": "@chase to the show he's got tickets for next month, nov 13-14."
  },
  {
    "number": "db2-t2-011",
    "title": "@chase and a friend to the big air thing in aspen, he knows the weekend."
  },
  {
    "number": "db2-t2-012",
    "title": "@chase downtown for the sneaker pickup saturday."
  },
  {
    "number": "db2-t2-013",
    "title": "@danny universal before his pass runs out, sometime this summer."
  },
  {
    "number": "db2-t2-014",
    "title": "@danny space camp week, whichever week we signed him up for."
  },
  {
    "number": "db2-t2-015",
    "title": "@danny down to savannah for a may weekend to see his cousins, book the seats properly."
  },
  {
    "number": "db2-t2-016",
    "title": "@adam LA pitch day, morning down and evening back."
  },
  {
    "number": "db2-t2-017",
    "title": "@bel is doing the miami race thing - just her, go ahead and set it up."
  },
  {
    "number": "db2-t2-018",
    "title": "@chase the essay workshop weekend in boulder."
  },
  {
    "number": "db2-t2-019",
    "title": "@adam the global entry interview up in blaine, get me there."
  },
  {
    "number": "db2-t2-020",
    "title": "@bel the client dinners next week - anything to book?"
  },
  {
    "number": "db2-t2-021",
    "title": "@danny the jamboree weekend, do we need anything?"
  },
  {
    "number": "db2-t2-022",
    "title": "@chase out to see danny over his spring break."
  },
  {
    "number": "db2-t2-023",
    "title": "@adam boat show day with my brother."
  },
  {
    "number": "db2-t2-024",
    "title": "@bel the press check in philly, she wants it refundable as usual."
  },
  {
    "number": "db2-t2-025",
    "title": "@adam take bel to maui on the companion deal before it lapses."
  },
  {
    "number": "db2-t3-001",
    "title": "@bel paris fashion week."
  },
  {
    "number": "db2-t3-002",
    "title": "@adam to tokyo, use the airline credit if we still can."
  },
  {
    "number": "db2-t3-003",
    "title": "@danny orlando theme park weekend."
  },
  {
    "number": "db2-t3-004",
    "title": "barcelona apr 4-7 for all four of us."
  },
  {
    "number": "db2-t3-005",
    "title": "lisbon four nights."
  },
  {
    "number": "db2-t3-006",
    "title": "@adam midtown week around the copperline and foxbridge meetings."
  },
  {
    "number": "db2-t3-007",
    "title": "@adam nyc meeting trip."
  },
  {
    "number": "db2-t3-008",
    "title": "grab the kyoto hotel from my email for the japan trip."
  },
  {
    "number": "db2-t3-009",
    "title": "vegas again like last time."
  },
  {
    "number": "db2-t3-010",
    "title": "@chase a nuggets home game when they actually play."
  },
  {
    "number": "db2-t3-011",
    "title": "miami f1 trip."
  },
  {
    "number": "db2-t3-012",
    "title": "met gala, then knicks, for @adam."
  },
  {
    "number": "db2-t3-013",
    "title": "use whatever credits are expiring on a weekend somewhere fun."
  },
  {
    "number": "db2-t3-014",
    "title": "@bel austin GP."
  },
  {
    "number": "db2-t3-015",
    "title": "family beach week end of july."
  },
  {
    "number": "db2-t3-016",
    "title": "tokyo cherry blossoms with the kids."
  },
  {
    "number": "db2-t3-017",
    "title": "rebook us something like that tokyo suite we lost, same area."
  },
  {
    "number": "db2-t3-018",
    "title": "@adam salt lake early september, cheapest sane option."
  },
  {
    "number": "db2-t3-019",
    "title": "get bel to the sample sale her friend keeps talking about."
  },
  {
    "number": "db2-t3-020",
    "title": "@chase the park city qualifier if it doesn't hit finals."
  },
  {
    "number": "db2-t3-021",
    "title": "danny's regionals in charlotte, whichever weekend the bracket says."
  },
  {
    "number": "db2-t3-022",
    "title": "@adam the retro game expo in portland - skip it if it collides with the gala."
  },
  {
    "number": "db2-t3-023",
    "title": "one way to paris for bel right after the show wraps."
  },
  {
    "number": "db2-t3-024",
    "title": "@family reno july fourth."
  },
  {
    "number": "db2-t3-025",
    "title": "book around bel's denver conference on her calendar."
  },
  {
    "number": "db2-t4-001",
    "title": "everyone to grandma ruth's birthday dinner."
  },
  {
    "number": "db2-t4-002",
    "title": "@adam and @danny should head to santa fe early to help set up for grandma's thing."
  },
  {
    "number": "db2-t4-003",
    "title": "after grandma's party bel stays out a couple days for the estate stuff - sort everyone's travel."
  },
  {
    "number": "db2-t4-004",
    "title": "figure out the anniversary weekend for us."
  },
  {
    "number": "db2-t4-005",
    "title": "could the anniversary thing stretch into a longer week off together?"
  },
  {
    "number": "db2-t4-006",
    "title": "@family japan for about a week."
  },
  {
    "number": "db2-t4-007",
    "title": "bel and the kids head to tokyo the second break starts, adam catches up when work lets him."
  },
  {
    "number": "db2-t4-008",
    "title": "same japan week as the break, and get us rooms like the suite setup we lost."
  },
  {
    "number": "db2-t4-009",
    "title": "sort out travel for the june wedding."
  },
  {
    "number": "db2-t4-010",
    "title": "the kids stay with grandma over the wedding weekend - get danny out to her and back around it."
  },
  {
    "number": "db2-t4-011",
    "title": "set up the college trip for me and chase."
  },
  {
    "number": "db2-t4-012",
    "title": "chase stays for the tuesday interview, I need to be home sunday night - rework the college trip."
  },
  {
    "number": "db2-t4-013",
    "title": "holidays at rob's - get all four of us there."
  },
  {
    "number": "db2-t4-014",
    "title": "rob's for the holidays but bel has to be back before her year-end close."
  },
  {
    "number": "db2-t4-015",
    "title": "should the rest of us tag along to bel's milan thing?"
  },
  {
    "number": "db2-t4-016",
    "title": "@adam flies out to join bel after her milan workshop wraps."
  },
  {
    "number": "db2-t4-017",
    "title": "catch the crew in lisbon while they're over there."
  },
  {
    "number": "db2-t4-018",
    "title": "thanksgiving at bel's parents in tucson - just make november work for everyone."
  },
  {
    "number": "db2-t4-019",
    "title": "grandma's dinner and tucson thanksgiving are close together - could bel just stay out west in between?"
  },
  {
    "number": "db2-t4-020",
    "title": "book the phoenix flights - danny's seats done right, and use bel's united credit if it fits."
  },
  {
    "number": "db2-t4-021",
    "title": "quiet couples weekend in wine country in october."
  },
  {
    "number": "db2-t4-022",
    "title": "get chase from the semifinal straight to grandma's dinner - he shouldn't miss either."
  },
  {
    "number": "db2-t4-023",
    "title": "galveston beach long weekend for the four of us over labor day."
  },
  {
    "number": "db2-t4-024",
    "title": "thanksgiving-ish ski opener at that cabin everyone loved?"
  },
  {
    "number": "db2-t4-025",
    "title": "for bel's 40th get us somewhere she's been wanting to go, around her actual birthday, without wrecking anything else that month."
  }
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
