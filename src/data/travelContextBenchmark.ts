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
    "Extractor receives Gmail-like and Calendar-like APIs over the synthetic household corpus.",
    "Planner receives the extracted private travel context plus the natural user prompt.",
    "Search receives Pack planner outlines and ranks deterministic flight and hotel inventory.",
    "Official scoring gives no grace for failed phases, invalid IDs, missing evidence, or malformed outputs.",
  ],
};

export const latestVerifiedPackRun = {
  label: "Hard-100 Pack validation",
  summary:
    "Pack passes the current hard-100 evidence set by extracting structured travel context first, then planning and searching against typed constraints.",
  hard100Composite: "100/100 hard cases",
  hard100TotalCost: "$3.70",
  averageHard100Cost: "$0.037",
  selectedComparisonSet: "10 hardest cases",
  selectedComparisonScope: "GPT-5.5 xhigh and Claude Opus 4.7 max-thinking runs",
};

export const neurosymbolicComparison = {
  label: "Hard-100 Raw Model Shootout",
  headline: "Next run: the 10 hardest hard-100 cases against GPT-5.5 xhigh and Claude Opus 4.7 max-thinking.",
  summary:
    "The demo point is simple: Pack turns private travel context into a compact symbolic state before the model plans. Raw model agents must search, read, remember, reason, and ground evidence inside one expensive loop.",
  measuredCase: "10 hardest hard-100 cases",
  packCorpusResult: "100/100 current hard-100 evidence set",
  packCorpusCost: "$3.70 for the full hard-100 run",
  estimateNote:
    "Raw-model results are intentionally pending until the selected 10 are run with the same tool access and scoring rubric.",
  rows: [
    {
      system: "Pack neurosymbolic planner",
      outcome: "Current pass",
      cost: "$0.037 avg/case",
      costMultiple: "1x",
      runtime: "Hard-100 validated",
      calls: "Structured extraction + typed planning + deterministic search",
      note:
        "Pack has already passed the hard-100 evidence set with the current local validation.",
    },
    {
      system: "GPT-5.5 xhigh raw agent",
      outcome: "Planned",
      cost: "Pending run",
      costMultiple: "Pending",
      runtime: "Pending",
      calls: "Same tools, no Pack symbolic state",
      note:
        "The model gets the APIs and must discover the private evidence, conflicts, stale traps, and search constraints itself.",
    },
    {
      system: "Claude Opus 4.7 max-thinking raw agent",
      outcome: "Planned",
      cost: "Pending run",
      costMultiple: "Pending",
      runtime: "Pending",
      calls: "Same tools, no Pack symbolic state",
      note:
        "The run uses the same hardest-10 selection so the comparison is about planning architecture, not prompt cherry-picking.",
    },
  ],
};

export const hard100Cases = [
  {
    number: "001",
    title: "Japan school/PTO trip",
    challenge: "Calendar conflict + stale evidence",
    summary: "Family Japan planning must fit school and PTO evidence while ignoring stale Japan bookings.",
  },
  {
    number: "002",
    title: "Paris fashion-week timing",
    challenge: "Private/public timing mismatch",
    summary: "A Paris event request has public-date noise, private shipment constraints, and promo honeypots.",
  },
  {
    number: "003",
    title: "Tokyo airline credit chain",
    challenge: "Cancellation chain + fare honeypot",
    summary: "An old airline credit only counts if the email chain proves it survived later changes.",
  },
  {
    number: "004",
    title: "Denver show school conflict",
    challenge: "Expected impossible",
    summary: "A child wants a Denver show, but real school conflicts can make the correct answer no.",
  },
  {
    number: "005",
    title: "Theme park appointment conflict",
    challenge: "Email-only conflict + marketing honeypot",
    summary: "An Orlando weekend must avoid an email-only appointment and a fake confirmation nearby.",
  },
  {
    number: "006",
    title: "Tahoe wedding stale save-date",
    challenge: "Stale invite + cancelled lodging",
    summary: "A wedding trip must use the real invite date, not stale save-date or cancelled hotel evidence.",
  },
  {
    number: "007",
    title: "Wedding plus Tulum extension",
    challenge: "Chained discovery + partial duplication",
    summary: "The planner must combine wedding evidence, an existing room block, and changed flight emails without duplicating anything.",
    hardestTenReason:
      "This is one of the cleanest raw LLM traps: the answer depends on joining active wedding evidence, forwarded lodging coverage, and changed flights across separate private messages.",
  },
  {
    number: "008",
    title: "Bachelor weekend partial rebook",
    challenge: "Calendar block + local decoy + scope control",
    summary: "A bachelor weekend must respect a work block, ignore a local dinner decoy, and change only the missing leg.",
    hardestTenReason:
      "It requires partial itinerary surgery. A raw agent can easily overbook the whole trip, leave before the work block, or mistake the local dinner for the destination.",
  },
  {
    number: "009",
    title: "NYC long-stay plus tennis",
    challenge: "No duplicate local travel",
    summary: "A public event may fit only if existing NYC lodging already covers the traveler.",
  },
  {
    number: "010",
    title: "Local business event",
    challenge: "Expected no-travel",
    summary: "Noisy business messages should produce no travel when they only describe a local day.",
  },
  {
    number: "011",
    title: "Rome family room split",
    challenge: "Multi-person lodging + cancelled hotel",
    summary: "A family Rome trip must use the correct room split and ignore cancelled lodging.",
  },
  {
    number: "012",
    title: "London theatre preferences",
    challenge: "Preference search + scope control",
    summary: "London theatre planning must use real hotel preferences and avoid padding extra nights.",
  },
  {
    number: "013",
    title: "Offsite venue-city disagreement",
    challenge: "Email/calendar disagreement + airport noise",
    summary: "The venue city wins over airport receipts, old local meetings, and ambiguous Bay Area noise.",
  },
  {
    number: "014",
    title: "Denver to Vail extension",
    challenge: "Calendar conflict + extension scope",
    summary: "A ski extension after Denver only works if the next school item leaves enough room.",
  },
  {
    number: "015",
    title: "Museum trip fare trap",
    challenge: "Search value + no-seat fare",
    summary: "A direct trip should reject basic fares without seats and ignore someone else's forwarded hotel.",
  },
  {
    number: "016",
    title: "Miami staggered return",
    challenge: "Split itinerary + promo red herring",
    summary: "Two adults share outbound travel, one stays longer, and a sports promo only matters if it matches reality.",
  },
  {
    number: "017",
    title: "Japan spring break blocked week",
    challenge: "Multi-person calendar + leap-year drift",
    summary: "Family Japan dates must avoid a blocked week, handle public-date drift, and avoid kids' red-eyes.",
  },
  {
    number: "018",
    title: "Cancelled Tokyo flight",
    challenge: "Stale evidence",
    summary: "An old cancelled Tokyo flight looks useful but must not be treated as active.",
  },
  {
    number: "019",
    title: "Forwarded hotel ownership trap",
    challenge: "Wrong-owner evidence",
    summary: "A forwarded hotel email only counts if it belongs to the traveler, not if it was forwarded as an FYI.",
    hardestTenReason:
      "The city and date can match while the owner is wrong. Raw agents often anchor on matching travel-looking evidence instead of proving ownership and traveler identity.",
  },
  {
    number: "020",
    title: "Schedule-change overwrite",
    challenge: "Email recency",
    summary: "A changed flight time should override the original confirmation.",
  },
  {
    number: "021",
    title: "Risky connection pattern",
    challenge: "Historical preference + fare honeypot",
    summary: "A cheap itinerary repeats a known bad connection pattern from prior inbox evidence.",
  },
  {
    number: "022",
    title: "Expiring points and credits",
    challenge: "Credit validity + value tradeoff",
    summary: "Credits only matter if real and useful; expired promos and surveys do not count.",
  },
  {
    number: "023",
    title: "Paris refundable event",
    challenge: "Private/public date mismatch",
    summary: "A Paris event needs refundable travel unless private evidence proves the commitment is locked.",
  },
  {
    number: "024",
    title: "Loyalty preference versus family seating",
    challenge: "Preference hierarchy",
    summary: "Airline loyalty cannot override family seating, price, and change-fee constraints.",
  },
  {
    number: "025",
    title: "Long-haul window seat tradeoff",
    challenge: "Search value",
    summary: "A window preference should not justify a red-eye, basic fare, or impossible short connection.",
  },
  {
    number: "026",
    title: "Family seating beats window",
    challenge: "Multi-person inventory",
    summary: "A child's window preference loses to keeping the family seated together.",
  },
  {
    number: "027",
    title: "Current home-airport evidence",
    challenge: "Stale profile data",
    summary: "Home airports must come from current evidence, not old forwarded confirmations.",
  },
  {
    number: "028",
    title: "Pending friend exclusion",
    challenge: "Traveler resolution",
    summary: "A pending friend is excluded unless acceptance is proven by evidence.",
  },
  {
    number: "029",
    title: "Email-only PTO overlap",
    challenge: "Email/calendar conflict",
    summary: "PTO exists only in email and conflicts with calendar blocks; the narrower overlap wins.",
    hardestTenReason:
      "This is exactly the kind of constraint a raw model misses unless it retrieves the right private email and compares it against calendar evidence before search.",
  },
  {
    number: "030",
    title: "Event city source conflict",
    challenge: "Recency + old-city hotel trap",
    summary: "Email and calendar disagree on event city, and the newer source must beat old hotel evidence.",
  },
  {
    number: "031",
    title: "Airbnb security-email noise",
    challenge: "Non-travel email noise",
    summary: "Login and security emails mention locations but are not reservations.",
  },
  {
    number: "032",
    title: "Airline survey non-booking",
    challenge: "Expected no-travel",
    summary: "Airline surveys are past-trip evidence, not active bookings.",
  },
  {
    number: "033",
    title: "Fare sale non-booking",
    challenge: "Marketing noise + scope control",
    summary: "A fare sale email is not a booking and its blackout dates should not become trip dates.",
  },
  {
    number: "034",
    title: "Conference moved cities",
    challenge: "Later email overrides plan",
    summary: "A later move email invalidates the old city, hotel path, and airport.",
  },
  {
    number: "035",
    title: "Missing hotel only",
    challenge: "Partial completion",
    summary: "Flights already exist, so only the missing hotel should be planned after checking flight changes.",
  },
  {
    number: "036",
    title: "Hotel booked, flights missing",
    challenge: "Partial completion + stale city",
    summary: "Flights are needed unless the existing hotel is stale from an old city.",
  },
  {
    number: "037",
    title: "Return-only event fix",
    challenge: "Partial rebooking",
    summary: "Only the too-early return should change; the correct outbound and hotel should stay intact.",
  },
  {
    number: "038",
    title: "Fixed outbound, movable return",
    challenge: "PTO boundary + connection trap",
    summary: "The return can move for value, but not across PTO boundaries or into overnight connection traps.",
  },
  {
    number: "039",
    title: "NYC meeting during long stay",
    challenge: "Expected no-travel + temporary home",
    summary: "Existing long-stay evidence means no duplicate lodging or flights should be added.",
  },
  {
    number: "040",
    title: "One-way after active conference",
    challenge: "One-way scope + cancelled invite",
    summary: "A one-way leg is valid only if the conference is active, with no invented return.",
  },
  {
    number: "041",
    title: "Paris public-week drift",
    challenge: "Multi-person timing + cached public date",
    summary: "Public-week date drift and a pre-event commitment constrain a two-adult Paris trip.",
  },
  {
    number: "042",
    title: "Milan kids school veto",
    challenge: "Expected impossible + search value",
    summary: "A Milan trip with kids must stop if school or prices make it invalid.",
  },
  {
    number: "043",
    title: "NYC marathon borough",
    challenge: "Event-email grounding",
    summary: "Family marathon lodging must be near the real borough from event emails.",
  },
  {
    number: "044",
    title: "Tokyo cherry-blossom flexibility",
    challenge: "Shifting public timing",
    summary: "Cherry-blossom dates can shift, so hotel flexibility matters.",
  },
  {
    number: "045",
    title: "London cancelled theatre thread",
    challenge: "Cancelled evidence + newsletter trap",
    summary: "Cancelled theatre plans and newsletters should not become active booking evidence.",
  },
  {
    number: "046",
    title: "Solo Austin race trip",
    challenge: "Credit applicability + traveler scope",
    summary: "A solo race trip should use credit only if applicable and avoid family-room assumptions.",
  },
  {
    number: "047",
    title: "Miami race traveler ambiguity",
    challenge: "Needs clarification + promo honeypot",
    summary: "The system must ask if messages do not prove whether this is solo or family travel.",
    hardestTenReason:
      "A strong agent must know when not to book. This case punishes confident guesses because family-ticket promo noise is not proof of traveler scope.",
  },
  {
    number: "048",
    title: "Wedding versus investor breakfast",
    challenge: "Expected impossible",
    summary: "A beach wedding should be rejected if the return cannot preserve a near-term work commitment.",
  },
  {
    number: "049",
    title: "Bachelor weekend destination decoy",
    challenge: "Local decoy + cancelled return",
    summary: "A local Friday dinner and old cancelled return should not pull the bachelor trip off course.",
  },
  {
    number: "050",
    title: "School break plus camp conflict",
    challenge: "Multi-person calendar conflict",
    summary: "A school-break trip fails if the break applies to one child but another child's camp email is real.",
    hardestTenReason:
      "This combines family-member-specific availability with email-only conflict evidence. Search inventory can look valid while the family plan is invalid.",
  },
  {
    number: "051",
    title: "Maui adult PTO overlap",
    challenge: "Expected impossible + value trap",
    summary: "A Maui trip must stay inside overlapping adult PTO and be rejected if no overlap exists.",
    hardestTenReason:
      "The correct answer can be rejection despite attractive flights or hotels. It tests whether the model treats private availability as a hard constraint.",
  },
  {
    number: "052",
    title: "Barcelona blocked week",
    challenge: "Expected impossible",
    summary: "A fixed family Barcelona request should be rejected if a blocked week is real.",
  },
  {
    number: "053",
    title: "Grandparents meet-up boundary",
    challenge: "Traveler scope",
    summary: "Grandparents can meet the family, but their rooms and flights are out of scope.",
  },
  {
    number: "054",
    title: "Boston appointment virtual check",
    challenge: "Expected no-travel",
    summary: "A recurring appointment should not become a trip if this week's instance is virtual.",
  },
  {
    number: "055",
    title: "Conference-to-Lisbon one-way",
    challenge: "Active-event check",
    summary: "A Lisbon one-way leg only exists if the conference is really happening in person.",
  },
  {
    number: "056",
    title: "Customer summit airport choice",
    challenge: "Venue grounding + wrong-metro trap",
    summary: "Airport choice should follow the actual venue, not old receipts or famous nearby cities.",
  },
  {
    number: "057",
    title: "Seattle exact-date PTO trap",
    challenge: "Calendar conflict + no padding",
    summary: "Wide PTO does not permit trip padding around a tax appointment or exact-date request.",
  },
  {
    number: "058",
    title: "NYC meetings no-travel decision",
    challenge: "Expected no-travel",
    summary: "Same-day local meetings should produce no travel instead of an invented trip.",
  },
  {
    number: "059",
    title: "NYC dinners local check",
    challenge: "Scope control",
    summary: "Travel is needed only if the traveler is not already local; old hotel receipts are noise.",
  },
  {
    number: "060",
    title: "Unknown chapel location",
    challenge: "Needs clarification",
    summary: "The system must not invent a chapel address if private emails do not prove which chapel.",
    hardestTenReason:
      "This case measures anti-hallucination under pressure. A raw model can produce a plausible venue, but the correct behavior is to stop and ask.",
  },
  {
    number: "061",
    title: "Old-city hotel after move",
    challenge: "Stale destination evidence",
    summary: "Existing hotel evidence is bad if a later event move makes the city obsolete.",
  },
  {
    number: "062",
    title: "Pitti private-date override",
    challenge: "Private/public timing",
    summary: "If public dates and invite dates disagree, newer private evidence wins.",
  },
  {
    number: "063",
    title: "Sundance cabin extension",
    challenge: "Extension timing + stale lodging",
    summary: "A cabin extension must not overlap screenings or reuse last year's lodging.",
  },
  {
    number: "064",
    title: "Watches event to Annecy",
    challenge: "Chained trip + transfer cutoff",
    summary: "A cross-border one-night extension must respect changed dates, stale lodging, and late rail limits.",
    hardestTenReason:
      "It forces chained discovery across event timing, stale hotel evidence, geography, and transfer feasibility instead of just selecting cheap inventory.",
  },
  {
    number: "065",
    title: "Montreal festival calm extension",
    challenge: "Public timing + far-away retreat trap",
    summary: "A calm extension should start after the actual festival and avoid fake far-away retreats.",
  },
  {
    number: "066",
    title: "Austin festival colder extension",
    challenge: "School/work blocker",
    summary: "A post-festival extension must be rejected if it breaks Monday obligations.",
  },
  {
    number: "067",
    title: "NYC gala plus basketball",
    challenge: "Local stay + promo calendar trap",
    summary: "Add a game only if real timing fits, with no duplicate hotel if already local.",
  },
  {
    number: "068",
    title: "Barcelona festival to island",
    challenge: "Post-event sequencing",
    summary: "An island extension starts only after the real festival end and cannot reuse last year's hotel.",
  },
  {
    number: "069",
    title: "Tokyo race then Kyoto",
    challenge: "Race logistics + public-date drift",
    summary: "Race morning hotel logistics must survive public-date drift before moving onward.",
  },
  {
    number: "070",
    title: "Kyoto festival to Nara",
    challenge: "Calendar transfer blocker",
    summary: "A transfer day must avoid calendar blocks, and promo emails are not hotel reservations.",
  },
  {
    number: "071",
    title: "Nashville solo music event",
    challenge: "Preference search + irrelevant bachelor noise",
    summary: "A solo refundable, no-red-eye trip must ignore another Nashville bachelor thread.",
  },
  {
    number: "072",
    title: "Santa Fe family school veto",
    challenge: "Multi-person calendar conflict",
    summary: "A family market trip can be killed by one child's school block.",
  },
  {
    number: "073",
    title: "Zurich expired-credit trap",
    challenge: "Expired credit + cancelled hotel",
    summary: "A Zurich event cannot use expired Europe credit or cancelled hotel evidence.",
  },
  {
    number: "074",
    title: "Lake Como versus Milan",
    challenge: "Location grounding + private invite",
    summary: "A hotel must be in Como, not Milan, and private invite timing can beat public sports timing.",
  },
  {
    number: "075",
    title: "Charleston far-hotel trap",
    challenge: "Preference search",
    summary: "Cheap far-away hotels, rental-car assumptions, and old room blocks must be rejected.",
  },
  {
    number: "076",
    title: "Direct-only family beach",
    challenge: "Expected impossible if no inventory",
    summary: "If no direct seats exist for all four travelers, the correct answer is no viable option.",
  },
  {
    number: "077",
    title: "Palm Springs PTO blackout",
    challenge: "Hidden private constraint",
    summary: "A warm three-night trip must not cross a PTO blackout hidden in email.",
  },
  {
    number: "078",
    title: "Family value ranking",
    challenge: "Search value + seat availability",
    summary: "The best destination is by real value, with rejection if neither option has enough seats.",
  },
  {
    number: "079",
    title: "NYC theater local check",
    challenge: "Public availability + no duplicate travel",
    summary: "Show availability should drive dates, but no travel should be booked if already local.",
  },
  {
    number: "080",
    title: "Chicago concert extension",
    challenge: "Ticket evidence only",
    summary: "A quiet extension only exists if real ticket or order evidence proves the concert date.",
  },
  {
    number: "081",
    title: "Vegas plus nearby game",
    challenge: "Newsletter fake-event trap",
    summary: "Add a game only if the real schedule fits, not because a newsletter suggests it.",
  },
  {
    number: "082",
    title: "Salt Lake family fare trap",
    challenge: "Multi-person direct-flight constraint",
    summary: "Family direct-flight requirements can beat a cheap basic-fare inventory trap.",
  },
  {
    number: "083",
    title: "Boston return-only extension",
    challenge: "Partial rebooking",
    summary: "A Tuesday extension should change only the return unless the hotel checkout conflicts.",
  },
  {
    number: "084",
    title: "NYC meetings duplicate-travel trap",
    challenge: "Locality resolution",
    summary: "Multiple NYC meetings should not create travel if they are local same-day holds.",
  },
  {
    number: "085",
    title: "Reno holiday minimum stay",
    challenge: "Red herring + inventory rule",
    summary: "A Reno trip must ignore unrelated NYC meeting clutter and handle holiday minimum-stay traps.",
  },
  {
    number: "086",
    title: "Wedding flight only",
    challenge: "Scope control + stale resort",
    summary: "Only flights should be booked; hotel completion and stale resort evidence are traps.",
  },
  {
    number: "087",
    title: "Wedding hotel only",
    challenge: "Scope control + forwarded guest itinerary",
    summary: "Only lodging should be booked, without inferring flights from guest itineraries.",
  },
  {
    number: "088",
    title: "Wedding flight and hotel only",
    challenge: "Scope control + wrong-person evidence",
    summary: "Book only the adult travelers' flight and hotel, not family travelers, stale rooms, or guest flights.",
    hardestTenReason:
      "This is a dense public-demo case: correct scope, traveler identity, stale resort evidence, and forwarded guest flights all have to be separated cleanly.",
  },
  {
    number: "089",
    title: "Cold extension after wedding",
    challenge: "Extension timing + cancelled hotel",
    summary: "A cold four-night extension must preserve wedding checkout and avoid cancelled ski lodging.",
  },
  {
    number: "090",
    title: "Scenic extension after wedding",
    challenge: "Search value + room-block overlap",
    summary: "A quiet scenic extension should not overlap an existing wedding block or choose a party hotel.",
  },
  {
    number: "091",
    title: "Lisbon inside PTO only",
    challenge: "Expected impossible",
    summary: "A four-night Lisbon trip must fit entirely inside PTO or be rejected.",
  },
  {
    number: "092",
    title: "Paris one-way only",
    challenge: "One-way scope",
    summary: "A one-way Paris request should not trigger a return leg or follow-up loop.",
  },
  {
    number: "093",
    title: "Chicago after work Friday",
    challenge: "Calendar conflict",
    summary: "A cheaper noon departure is invalid when work blocks travel until Friday evening.",
  },
  {
    number: "094",
    title: "Knicks after Midtown meetings",
    challenge: "Locality resolution",
    summary: "A post-meeting game should stay local if the traveler is already in NYC.",
  },
  {
    number: "095",
    title: "Porto event-date disambiguation",
    challenge: "Public-event confusion",
    summary: "A Porto event week should not inherit Barcelona festival dates by mistake.",
  },
  {
    number: "096",
    title: "Taipei stale confirmation",
    challenge: "Stale evidence",
    summary: "A lantern festival request must avoid old Taipei confirmation evidence.",
  },
  {
    number: "097",
    title: "Vienna opera nearby extension",
    challenge: "Stale waitlist + extension value",
    summary: "A nearby rainy/bookish extension should not force a second country or trust a stale waitlist.",
  },
  {
    number: "098",
    title: "Montreal concert to Quebec City",
    challenge: "Plausibility check",
    summary: "A romantic extension only works if the concert city and date make it plausible.",
  },
  {
    number: "099",
    title: "Orlando family value",
    challenge: "Multi-person search value",
    summary: "Seats together and breakfast hotel matter more than a small saving.",
  },
  {
    number: "100",
    title: "Tokyo food week family",
    challenge: "Multi-person inventory honeypot",
    summary: "A family food-week trip must avoid kid red-eyes, stale public dates, and split-family inventory.",
  },
] as const;

export const hardestTenCases = hard100Cases.filter((caseItem) =>
  Boolean(caseItem.hardestTenReason),
);

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
