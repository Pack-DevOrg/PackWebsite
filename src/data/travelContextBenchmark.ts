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
  version: "pack-deeperbench-v0",
  status: "Pack hard-100 full run verified May 21, 2026",
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
  label: "Pack hard-100 run",
  summary:
    "The run includes all 100 hard-corpus cases. Final pass count was 100/100.",
  hard100Composite: "100/100",
  hard100TotalCost: "$5.22",
  averageHard100Cost: "$0.0522",
  hard100Runtime: "24m24s wall clock",
  averageHard100Runtime: "49.5s processing/case",
  llmCalls: "628 LLM calls",
  travelerOutcome: "Book, decline, mark impossible, or ask a clarifying question",
  hiddenContext: "Dates, travelers, obligations, credits, and preferences recovered from private context",
  evidenceGrounding: "Answers must cite the right supporting records and avoid misleading lookalikes",
  inventoryGrounding: "Flights and hotels must match deterministic inventory when a trip is bookable",
  safeAbstention: "No-travel, impossible, and ambiguous requests must not be forced into bookings",
};

export const benchmarkMetricExplanations = [
  {
    label: "Final pass count",
    value: latestVerifiedPackRun.hard100Composite,
    body:
      "Number of cases where the final answer matched the expected outcome under the rubric.",
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
