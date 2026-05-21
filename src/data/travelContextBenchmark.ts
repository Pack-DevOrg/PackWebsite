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
  officialRunStatus: "Pack hard-100 full run updated May 20, 2026",
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
  label: "Pack hard-100 result",
  summary:
    "Pack passed 93 of 100 hard travel-planning cases in the current full hard-100 run.",
  hard100Composite: "93/100",
  hard100TotalCost: "$4.39",
  averageHard100Cost: "$0.0439",
  hard100Runtime: "20m14s wall clock",
  averageHard100Runtime: "46.7s processing/case",
  selectedComparisonSet: "5/10 selected hard cases passed in the ten-case comparison set",
  selectedComparisonRuntime: "8m42s across selected ten",
  selectedComparisonScope: "All 100 hard cases run end to end",
};

export const neurosymbolicComparison = {
  label: "Hardest-10 Model Comparison",
  headline: "Model results on the selected hardest cases.",
  summary:
    "Pack, GPT-5.5 xhigh, and Claude Opus 4.7 were evaluated on the same ten selected hard cases with the same short prompts, private-context tools, travel-search tools, scoring rubric, 45-minute cutoff, and $10 execution cap per case.",
  measuredCase: "10 selected hard-100 cases, 45-minute cutoff, $10 execution cap per case",
  packCorpusResult: "5/10 final content pass",
  packCorpusCost: "$0.77 total cost",
  packCorpusRuntime: "8m42s end-to-end benchmark runtime",
  estimateNote: "Costs show the full cost for each run. Pack includes extraction, planning, and search. GPT and Claude costs include all model work through completion, timeout, or service limit.",
  rows: [
    {
      system: "Pack",
      outcome: "5/10",
      cost: "$0.77",
      costMultiple: "1x",
      runtime: "8m42s across 10 cases",
      calls: "5/10 final content pass; 10/10 scorable output",
      note: "Pack passed five selected hard cases in the current run; the remaining misses were date/status, destination normalization, credit evidence, infeasibility handling, and event-context resolution.",
    },
    {
      system: "GPT-5.5 xhigh",
      outcome: "Fail",
      cost: "$86.60",
      costMultiple: "112.1x",
      runtime: "48m03s across 10 cases",
      calls: "1/10 final content pass; 0.29 average score",
      note: "Includes all model work across completed cases and service-limit handling. Partial scores stay low when the final answer is wrong.",
    },
    {
      system: "Claude Opus 4.7 max-thinking",
      outcome: "Fail",
      cost: "$17.15",
      costMultiple: "22.2x",
      runtime: "38m50s across 10 cases",
      calls: "2/10 final content pass; 0.37 average score",
      note: "Claude answers were normalized into the benchmark format before scoring. Two final answers passed; the other eight missed final outcome, constraints, inventory, or evidence requirements.",
    },
  ],
};

export const shootoutChartRows = [
  {
    system: "Pack",
    fullName: "Pack",
    solved: 5,
    attempted: 10,
    costUsd: 0.772805,
    runtimeMinutes: 8.6965,
    solvedLabel: "5/10",
    costLabel: "$0.77",
    runtimeLabel: "8m42s",
    note: "5/10 pass",
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
    tone: "model",
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
    evidence: 8,
    constraints: 6,
    search: 6,
    finalPass: 5,
    note: "Pack passed five selected hard cases in the current run and returned scorable output for all ten selected cases.",
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
    note: "One final answer passed. Several failed cases still found useful evidence, but wrong-owner, local-stay, and wrong-destination misses now stay low because final correctness carries the largest weight.",
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
    note: "Two plans passed. The rest missed evidence, constraints, search inventory, or the required no-travel/clarification outcome.",
  },
] as const;

export const hardestTenShootoutRows = [
  {
    number: "001",
    title: "@family Japan for about a week.",
    hardReason: "Requires finding the real school-break/PTO window across private mail and calendar, then avoiding a tempting but wrong earlier Japan window.",
    packComponents: { output: "pass", evidence: "pass", constraints: "fail", search: "fail", final: "fail" },
    packCost: "$0.149",
    packRuntime: "50s",
    packResult: "Did not pass: selected Japan planning evidence but used the wrong 2026 date window and returned clarification instead of a complete itinerary.",
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
    packComponents: { output: "pass", evidence: "pass", constraints: "partial", search: "pass", final: "fail" },
    packCost: "$0.070",
    packRuntime: "2m07s",
    packResult: "Did not pass: found the private Paris date and completed the plan, but normalized the destination differently than the benchmark answer.",
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
    packComponents: { output: "pass", evidence: "fail", constraints: "partial", search: "partial", final: "fail" },
    packCost: "$0.029",
    packRuntime: "30s",
    packResult: "Did not pass: produced a clarification and missed the required Delta seat-map evidence for the credit condition.",
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
    packCost: "$0.072",
    packRuntime: "32s",
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
    packCost: "$0.050",
    packRuntime: "37s",
    packResult: "Passed: rejected the forwarded hotel because it did not belong to the household travelers and asked for valid trip evidence.",
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
    packCost: "$0.050",
    packRuntime: "32s",
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
    packCost: "$0.077",
    packRuntime: "43s",
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
    hardReason: "It looks like a normal four-person trip, but the requested window is blocked or unbookable; the system must prove infeasibility rather than force inventory.",
    packComponents: { output: "pass", evidence: "pass", constraints: "pass", search: "partial", final: "fail" },
    packCost: "$0.097",
    packRuntime: "1m29s",
    packResult: "Did not pass: detected the Barcelona blocked window but asked for alternate dates instead of returning the expected impossible outcome.",
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
    packCost: "$0.115",
    packRuntime: "44s",
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
    hardReason: "The terse prompt requires resolving event eligibility, travelers, destination, duration, and Knicks timing without overdeclining or inventing missing evidence.",
    packComponents: { output: "pass", evidence: "fail", constraints: "fail", search: "fail", final: "fail" },
    packCost: "$0.065",
    packRuntime: "38s",
    packResult: "Did not pass: asked for destination clarification instead of resolving the New York Met Gala/Knicks context and no-game note.",
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
