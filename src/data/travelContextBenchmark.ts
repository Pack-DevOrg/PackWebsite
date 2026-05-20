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
  officialRunStatus: "Pack hard-100 full run updated May 20, 2026; targeted repair checks updated May 20, 2026",
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
    "A response must be readable enough to normalize into the same scoring rubric.",
    "A case only passes when the answer is grounded in the right evidence and returns the right travel outcome.",
    "Missing final answers, unscorable content, bad IDs, missing evidence, timeouts, and service limits score 0.",
  ],
};

export const latestVerifiedPackRun = {
  label: "Pack hard-100 status",
  summary:
    "The latest deployed dev hard-100 run is dev-v1373-hard100-20260520T1555Z: 93/100 passed. The previous targeted fixes for hard-019, hard-039, and hard-047 held in the full rerun; the remaining failures are now the next planner-fix queue.",
  hard100Composite: "93/100",
  hard100TotalCost: "$4.39",
  averageHard100Cost: "$0.0439",
  hard100Runtime: "20m14s wall clock",
  averageHard100Runtime: "46.7s processing/case",
  selectedComparisonSet: "5/10 selected hard cases passed in the latest full run",
  selectedComparisonRuntime: "Latest deployed full hard-100 run",
  selectedComparisonScope: "dev-v1373 hard-100 result with all 100 cases run end to end",
};

export const neurosymbolicComparison = {
  label: "Archived Raw-Agent Shootout",
  headline: "May 19 raw-agent comparison baseline.",
  summary:
    "These rows preserve the May 19, 2026 shootout baseline. Pack, GPT-5.5 xhigh, and Opus 4.7 were run on the same ten selected hard cases. Raw agents received the same short prompts, private-context tools, travel-search tools, and scoring rubric. GPT-5.5 xhigh and Opus 4.7 used a 45-minute cutoff and a $10 execution cap per case. Pack's current repair status is shown separately above and should not be mixed into this archived comparison.",
  measuredCase: "10 selected hard-100 cases, May 19 baseline, 45-minute raw-agent cutoff, $10 execution cap per case",
  packCorpusResult: "0/10 final content pass on the archived exact rerun",
  packCorpusCost: "$2.76 total cost",
  packCorpusRuntime: "5m31s planning + search; extraction snapshot reused",
  estimateNote: "Costs show the full cost for each run. Pack includes extraction, planning, and search. Raw-agent costs include all model work through completion, timeout, or service limit.",
  rows: [
    {
      system: "Pack",
      outcome: "Fail",
      cost: "$2.76",
      costMultiple: "1x",
      runtime: "5m31s planning + search",
      calls: "0/10 final content pass; 0.12 average score",
      note: "Includes extraction, planning, and search. One case had the right broad outcome, but none had fully correct final answers.",
    },
    {
      system: "GPT-5.5 xhigh",
      outcome: "Fail",
      cost: "$86.60",
      costMultiple: "31.4x",
      runtime: "48m03s across 10 cases",
      calls: "1/10 final content pass; 0.29 average score",
      note: "Includes all model work across completed cases and the hard-047 tool-budget failure. Partial scores stay low when the final answer is wrong.",
    },
    {
      system: "Claude Opus 4.7 max-thinking",
      outcome: "Fail",
      cost: "$17.15",
      costMultiple: "6.2x",
      runtime: "38m50s across 10 cases",
      calls: "2/10 final content pass; 0.37 average score",
      note: "Raw Opus answers were normalized into the benchmark format before scoring. Two final answers passed; the other eight missed final outcome, constraints, inventory, or evidence requirements.",
    },
  ],
};

export const shootoutChartRows = [
  {
    system: "Pack baseline",
    fullName: "Pack May 19 exact rerun",
    solved: 0,
    attempted: 10,
    costUsd: 2.76,
    runtimeMinutes: 5.51,
    solvedLabel: "0/10",
    costLabel: "$2.76",
    runtimeLabel: "5m31s",
    note: "Archived exact rerun",
    tone: "pack",
  },
  {
    system: "GPT-5.5 xhigh",
    fullName: "GPT-5.5 xhigh",
    solved: 1,
    attempted: 10,
    costUsd: 86.6,
    runtimeMinutes: 48.05,
    solvedLabel: "1/10",
    costLabel: "$86.60",
    runtimeLabel: "48m03s",
    note: "1/10 pass",
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
    note: "2/10 pass",
    tone: "raw",
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
    system: "Pack baseline",
    fullName: "Pack May 19 exact rerun",
    tone: "pack",
    denominator: 10,
    validOutput: 10,
    evidence: 5,
    constraints: 1,
    search: 1,
    finalPass: 0,
    note: "Archived May 19 exact rerun. Pack returned scorable artifacts for all ten, but none had a fully correct final answer in that baseline.",
  },
  {
    system: "GPT-5.5 xhigh",
    fullName: "GPT-5.5 xhigh",
    tone: "raw",
    denominator: 10,
    validOutput: 9,
    evidence: 6,
    constraints: 5,
    search: 5,
    finalPass: 1,
    note: "One final answer passed. Several failed cases still found useful evidence, but wrong-owner, local-stay, and wrong-destination misses now stay low because final correctness carries the largest weight.",
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
    note: "Two plans passed. The rest missed evidence, constraints, search inventory, or the required no-travel/clarification outcome.",
  },
] as const;

export const packHardCaseStatus = {
  label: "Current Pack Hard-Case Status",
  headline: "93/100 on the latest deployed hard-100 run; 5/10 selected hard cases pass in that full run.",
  summary:
    "Source of truth is now the May 20 deployed dev-v1373 full hard-100 rerun. The suite improved overall, and the prior hard-019, hard-039, and hard-047 repairs held, but hard-001 and hard-052 regressed inside the selected hard-ten set.",
  latestFullRun: "93/100",
  selectedHardestTenLedger: "5/10",
  targetedRepairs: "3/3 held",
  remainingSelectedGaps: "5",
  metrics: [
    {
      label: "Latest full hard-100",
      value: "93/100",
      helper: "dev-v1373-hard100-20260520T1555Z",
    },
    {
      label: "Full-run cost",
      value: "$4.39",
      helper: "$0.0439 average per case",
    },
    {
      label: "Selected hard-case ledger",
      value: "5/10",
      helper: "all measured in the latest deployed full run",
    },
    {
      label: "Open selected gaps",
      value: "5",
      helper: "hard-001, hard-002, hard-003, hard-052, hard-067",
    },
  ],
  rows: [
    {
      caseId: "hard-001",
      title: "@family Japan for about a week.",
      result: "Open",
      status: "open",
      sourceRun: "dev-v1373-hard100-20260520T1555Z",
      note:
        "Regressed in the full rerun: Japan planning picked the stale Blueground NYC availability window instead of the 2027 school-break Japan evidence.",
    },
    {
      caseId: "hard-005",
      title: "@danny Orlando theme park weekend.",
      result: "Pass",
      status: "verified",
      sourceRun: "dev-v1373-hard100-20260520T1555Z",
      note: "Passed in the latest full hard-100 run.",
    },
    {
      caseId: "hard-019",
      title: "Forwarded hotel for the upcoming trip.",
      result: "Pass",
      status: "verified",
      sourceRun: "dev-v1373-hard100-20260520T1555Z",
      note:
        "The wrong-owner forwarded hotel repair held in the full rerun and returns the expected needs-input ownership clarification.",
    },
    {
      caseId: "hard-039",
      title: "@adam NYC meeting trip.",
      result: "Pass",
      status: "verified",
      sourceRun: "dev-v1373-hard100-20260520T1555Z",
      note:
        "Temporary-home evidence now drives the expected no-travel outcome in the full rerun.",
    },
    {
      caseId: "hard-047",
      title: "Miami F1 trip.",
      result: "Pass",
      status: "verified",
      sourceRun: "dev-v1373-hard100-20260520T1555Z",
      note:
        "Promotional family-package ambiguity asks for traveler-set clarification in the full rerun.",
    },
    {
      caseId: "hard-052",
      title: "Barcelona Apr 4-7 for all four of us.",
      result: "Open",
      status: "open",
      sourceRun: "dev-v1373-hard100-20260520T1555Z",
      note:
        "Returns needs-input instead of the expected impossible outcome, and the prompt text does not clearly say all travelers are blocked.",
    },
    {
      caseId: "hard-058",
      title: "@adam Midtown and Roam week.",
      result: "Pass",
      status: "verified",
      sourceRun: "dev-v1373-hard100-20260520T1555Z",
      note: "Passed in the latest full hard-100 run.",
    },
    {
      caseId: "hard-002",
      title: "@bel Paris fashion week.",
      result: "Open",
      status: "open",
      sourceRun: "dev-v1373-hard100-20260520T1555Z",
      note:
        "Current failure is a destination normalization mismatch: Paris versus Paris, France.",
    },
    {
      caseId: "hard-003",
      title: "@adam to Tokyo, use the airline credit if we still can.",
      result: "Open",
      status: "open",
      sourceRun: "dev-v1373-hard100-20260520T1555Z",
      note:
        "Private-evidence selection misses the required Delta seat-map evidence and over-anchors on unrelated calendar windows.",
    },
    {
      caseId: "hard-067",
      title: "Met Gala, then Knicks.",
      result: "Open",
      status: "open",
      sourceRun: "dev-v1373-hard100-20260520T1555Z",
      note:
        "Still over-clarifies and loses New York duration/context, including the no-Knicks-game search note.",
    },
  ],
} as const;

export const hardestTenShootoutRows = [
  {
    number: "001",
    title: "@family Japan for about a week.",
    hardReason: "Requires finding the real school-break/PTO window across private mail and calendar, then avoiding a tempting but wrong earlier Japan window.",
    packComponents: { output: "pass", evidence: "partial", constraints: "fail", search: "pass", final: "fail" },
    packCost: "$0.190",
    packRuntime: "45s",
    packResult: "Failed final pass: found evidence/travelers/search, but started before the allowed window and returned needs-input.",
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
    packComponents: { output: "pass", evidence: "pass", constraints: "fail", search: "fail", final: "fail" },
    packCost: "$0.273",
    packRuntime: "1m01s",
    packResult: "Failed final pass: found private evidence, but used the wrong date window and returned needs-input.",
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
    packComponents: { output: "pass", evidence: "partial", constraints: "pass", search: "pass", final: "fail" },
    packCost: "$0.266",
    packRuntime: "19s",
    packResult: "Had the broad Tokyo outcome, but failed final content pass because required seat-map evidence was missing.",
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
    packComponents: { output: "pass", evidence: "fail", constraints: "partial", search: "fail", final: "fail" },
    packCost: "$0.259",
    packRuntime: "21s",
    packResult: "Failed final pass: got traveler and destination, but missed required evidence and returned needs-input.",
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
    packComponents: { output: "pass", evidence: "partial", constraints: "fail", search: "partial", final: "fail" },
    packCost: "$0.269",
    packRuntime: "18s",
    packResult: "Failed final pass: the answer did not correctly reject the wrong-owner forwarded hotel.",
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
    hardReason: "The correct answer is no travel because Adam is already local; generic NYC meeting evidence pushes raw planners toward unnecessary flights and hotels.",
    packComponents: { output: "pass", evidence: "fail", constraints: "fail", search: "fail", final: "fail" },
    packCost: "$0.275",
    packRuntime: "26s",
    packResult: "Failed final pass: treated a no-travel case as a travel-planning request.",
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
    packComponents: { output: "pass", evidence: "fail", constraints: "fail", search: "fail", final: "fail" },
    packCost: "$0.301",
    packRuntime: "47s",
    packResult: "Failed final pass: expected clarification, but Pack produced a complete trip.",
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
    hardReason: "It looks like a normal four-person trip, but the requested window is blocked or unbookable; the system must prove infeasibility rather than force inventory.",
    packComponents: { output: "pass", evidence: "partial", constraints: "fail", search: "fail", final: "fail" },
    packCost: "$0.288",
    packRuntime: "49s",
    packResult: "Failed final pass: expected impossible, but Pack returned needs-input and selected travel inventory.",
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
    packComponents: { output: "pass", evidence: "partial", constraints: "fail", search: "fail", final: "fail" },
    packCost: "$0.311",
    packRuntime: "24s",
    packResult: "Failed final pass: expected no travel, but Pack returned needs-input.",
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
    hardReason: "The terse prompt requires resolving event eligibility, travelers, destination, duration, and Knicks timing without overdeclining or inventing missing evidence.",
    packComponents: { output: "pass", evidence: "fail", constraints: "fail", search: "fail", final: "fail" },
    packCost: "$0.324",
    packRuntime: "21s",
    packResult: "Failed final pass: wrong destination/duration/traveler handling.",
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
    body: "3% of the score. The response has to be readable enough to normalize into the shared benchmark fields before cutoff.",
    icon: SearchCheck,
  },
];
