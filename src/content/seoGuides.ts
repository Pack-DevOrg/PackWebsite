export interface SeoGuideSection {
  readonly title: string;
  readonly body: string;
  readonly points: readonly string[];
}

export interface SeoGuideFaq {
  readonly question: string;
  readonly answer: string;
}

export interface SeoGuideDefinition {
  readonly slug: string;
  readonly eyebrow: string;
  readonly title: string;
  readonly description: string;
  readonly intro: string;
  readonly primaryKeywords: readonly string[];
  readonly competitorFrame: string;
  readonly proofPoints: readonly string[];
  readonly sections: readonly SeoGuideSection[];
  readonly comparisons: readonly SeoGuideSection[];
  readonly faqs: readonly SeoGuideFaq[];
  readonly relatedLinks: readonly {
    readonly href: string;
    readonly label: string;
  }[];
}

export const seoGuideDefinitions = [
  {
    slug: "ai-travel-planning",
    eyebrow: "AI Travel Planning Guide",
    title: "Best AI travel planner for trips that start from real context",
    description:
      "A Pack guide to AI travel planning, itinerary organization, booking context, and how Pack differs from AI trip planners, itinerary apps, OTAs, and business travel tools.",
    intro:
      "Most AI trip planners start from a prompt and hand back suggestions. Pack is built for the harder workflow: the trip starts from emails, calendars, traveler profiles, past trips, loyalty context, public events, airport timing, and booking constraints that need to stay connected.",
    primaryKeywords: [
      "AI travel planner",
      "AI trip planner",
      "best AI travel planner",
      "AI itinerary planner",
      "travel planning app with AI",
      "turn emails into travel itinerary",
    ],
    competitorFrame:
      "Layla and Wanderlog are useful for AI trip ideas. Mindtrip focuses on AI-assisted travel planning. TripIt helps organize itineraries. Expedia, Booking.com, and KAYAK are built around broad travel inventory. Navan and TravelPerk focus on managed business travel. Pack is built for the connected layer between planning, organization, booking, and travel day.",
    proofPoints: [
      "Plans can start from prompts, events, calendars, and trip-worthy context instead of only a blank destination form.",
      "Travel confirmations, connected accounts, traveler profiles, loyalty context, and travel history can inform the plan.",
      "Booking, sharing, expenses, live trip views, and upcoming-trip details stay connected after the initial itinerary draft.",
    ],
    sections: [
      {
        title: "Where AI trip planners are weak",
        body:
          "Generic AI trip planners can be useful for inspiration, but they often lose the operational context that decides whether a trip works.",
        points: [
          "They may suggest places without knowing the traveler profile, calendar constraints, loyalty context, or prior trip patterns.",
          "They often stop at an itinerary draft instead of carrying the trip into booking, sharing, expense context, and travel-day readiness.",
          "They rarely solve the inbox problem: confirmations, schedule changes, and provider updates still live somewhere else.",
        ],
      },
      {
        title: "Where Pack fits",
        body:
          "Pack is not just another itinerary generator. It is context-aware travel planning that keeps the trip useful after the first draft.",
        points: [
          "Trip planning from events, calendar context, public events, and plain-language prompts.",
          "Automatic organization of confirmations, booking emails, and old itinerary records.",
          "Traveler profiles, loyalty details, travel stats, group sharing, expenses, and travel-day signals connected to the same trip.",
        ],
      },
      {
        title: "What travelers need to know",
        body:
          "The difference is the workflow around the plan, not only whether the product uses AI.",
        points: [
          "Prompt-first planners can be useful for inspiration, while context-first assistants are more useful when the trip has real constraints.",
          "Explain when a prompt-first planner is enough and when a context-first assistant is better.",
          "Show that the trip does not end at inspiration: it moves into booking, updates, shared views, expenses, and departure-day context.",
        ],
      },
    ],
    comparisons: [
      {
        title: "Pack vs. Layla and Mindtrip",
        body:
          "Layla and Mindtrip are useful for AI planning and inspiration. Pack is designed for trips where context needs to persist after the first draft.",
        points: [
          "Pack connects emails, calendars, traveler profiles, loyalty details, travel history, and booking context.",
          "Pack is a better fit for complex trips, repeat travelers, groups, and travelers who need the plan to become operational.",
        ],
      },
      {
        title: "Pack vs. TripIt and KAYAK Trips",
        body:
          "TripIt and KAYAK Trips are strong itinerary and travel-account references. Pack is designed for the overlap between itinerary organization, AI editing, booking context, and travel-day intelligence.",
        points: [
          "Pack can help with automatic itinerary records, travel confirmation parsing, connected accounts, and travel inbox organization.",
          "Pack is not just storing an itinerary; it is meant to help reason over the trip.",
        ],
      },
      {
        title: "Pack vs. Expedia, Booking.com, Navan, and TravelPerk",
        body:
          "OTAs focus on inventory and business platforms focus on managed travel programs. Pack focuses on the context around the trip.",
        points: [
          "Pack helps with context-aware booking decisions, not generic destination inventory alone.",
          "Business travelers, assistants, and coordinators can use Pack where planning, booking context, and trip coordination meet.",
        ],
      },
    ],
    faqs: [
      {
        question: "What is the best AI travel planner for complex trips?",
        answer:
          "For complex trips, the best AI travel planner is usually the one that can keep context connected after the first itinerary draft. Pack is designed around prompts, confirmations, calendars, profiles, loyalty context, booking workflows, sharing, expenses, and travel-day details living in one trip workflow.",
      },
      {
        question: "How is Pack different from a prompt-only AI trip planner?",
        answer:
          "A prompt-only planner starts with what the traveler types. Pack is designed to also use travel context the traveler already has, including emails, calendar timing, travel history, traveler profiles, loyalty details, and upcoming-trip signals.",
      },
      {
        question: "Does Pack replace Expedia, Booking.com, or KAYAK?",
        answer:
          "No. Expedia, Booking.com, and KAYAK are large travel inventory and metasearch surfaces. Pack helps travelers keep planning, itinerary organization, traveler context, booking decisions, and travel-day readiness connected.",
      },
    ],
    relatedLinks: [
      { href: "/trip-planning-from-events", label: "Trip Planning From Events" },
      { href: "/travel-history", label: "Travel History" },
      { href: "/travel-booking", label: "Travel Booking" },
      { href: "/upcoming-trip-details", label: "Upcoming Trip Details" },
    ],
  },
  {
    slug: "trip-organization",
    eyebrow: "Trip Organization Guide",
    title: "Trip organizer app for emails, confirmations, and automatic itineraries",
    description:
      "A Pack guide to trip organization, email itinerary organization, travel confirmation parsing, automatic itineraries, and travel inbox workflows.",
    intro:
      "The highest-value trip organization problem is not a prettier itinerary screen. It is turning scattered booking emails, confirmations, calendar context, provider updates, and old travel records into an itinerary that stays useful.",
    primaryKeywords: [
      "trip organizer app",
      "travel itinerary organizer",
      "email itinerary organizer",
      "travel confirmation parser",
      "automatic itinerary from email",
      "travel inbox organizer",
    ],
    competitorFrame:
      "TripIt owns itinerary-organizer language well. KAYAK Trips and Wanderlog are recognizable organizer and planner surfaces. Navan and TravelPerk appear in business-travel itinerary workflows. Pack can compete by connecting confirmation parsing, travel history, connected accounts, traveler profiles, booking context, and travel-day readiness instead of treating itinerary organization as a static list.",
    proofPoints: [
      "Travel history and connected accounts are natural Pack entry points for automatic itinerary records.",
      "Upcoming-trip details turn the organized itinerary into a travel-day readiness view.",
      "Trip updates, sharing, live views, and expenses keep the itinerary useful when plans change.",
    ],
    sections: [
      {
        title: "The real trip organizer problem",
        body:
          "Travelers do not only need a list of flights and hotels. They need the booking record to stay connected to everything that happens before, during, and after the trip.",
        points: [
          "Booking emails, confirmation numbers, calendar events, provider portals, and screenshots split the trip into fragments.",
          "Old confirmations become hard to find when a traveler wants to review, expense, reuse, or explain a trip later.",
          "Shared trips become unreliable when each traveler forwards different copies of the plan.",
        ],
      },
      {
        title: "How Pack handles itinerary questions",
        body:
          "Pack connects email confirmations, automatic itineraries, connected accounts, and readable trip records.",
        points: [
          "Booking emails and confirmation details can become part of a more readable itinerary record.",
          "Travel history, upcoming-trip details, connected accounts, and trip updates stay related.",
          "Official provider records still matter; Pack helps keep the surrounding trip context readable.",
        ],
      },
      {
        title: "How the pieces work together",
        body:
          "Itinerary storage, confirmation parsing, inbox organization, and travel-day usefulness are connected parts of the same trip workflow.",
        points: [
          "Travel history helps with older trips.",
          "Upcoming-trip details help with next-trip readiness.",
          "Connected accounts help reduce manual forwarding and re-entry.",
        ],
      },
    ],
    comparisons: [
      {
        title: "Pack vs. TripIt",
        body:
          "TripIt is a direct itinerary-organizer comparison. Pack extends the organizer idea into AI editing, profiles, booking context, sharing, expenses, and travel-day signals.",
        points: [
          "TripIt is useful for itinerary organization.",
          "Pack keeps context moving across planning, booking, and travel-day workflows.",
        ],
      },
      {
        title: "Pack vs. Wanderlog and KAYAK Trips",
        body:
          "Wanderlog is strong for planning and KAYAK Trips is strong around travel accounts. Pack combines organizer and assistant workflows.",
        points: [
          "A useful trip organizer keeps helping after the itinerary is imported.",
          "Updates, live trip views, expenses, and airport context can stay connected to the trip.",
        ],
      },
    ],
    faqs: [
      {
        question: "What app turns booking emails into a travel itinerary?",
        answer:
          "Pack is designed to help organize travel confirmations, booking emails, calendar context, and related trip details into readable itinerary records so trips do not stay scattered across inboxes and provider portals.",
      },
      {
        question: "Is Pack a travel confirmation parser?",
        answer:
          "Pack can help with travel confirmation parsing as part of a broader trip organization workflow. Parsed details are most useful when they remain connected to history, booking, sharing, expenses, and travel-day readiness.",
      },
      {
        question: "Can Pack organize old trips as well as upcoming trips?",
        answer:
          "Yes. Pack's travel history and upcoming-trip details pages cover both sides of the problem: reconstructing older trip records and keeping the next trip readable before departure.",
      },
    ],
    relatedLinks: [
      { href: "/travel-history", label: "Travel History" },
      { href: "/connected-accounts", label: "Connected Accounts" },
      { href: "/upcoming-trip-details", label: "Upcoming Trip Details" },
      { href: "/trip-updates", label: "Trip Updates" },
    ],
  },
  {
    slug: "booking-context",
    eyebrow: "Booking Context Guide",
    title: "Points and miles trip planner for loyalty-aware booking context",
    description:
      "A Pack guide to points-and-miles trip planning, award travel planning, AI flight and hotel booking assistance, loyalty-aware comparisons, traveler preferences, and calendar-aware booking context.",
    intro:
      "Booking is easier to trust when itinerary context, loyalty context, points-related decisions, traveler preferences, calendar timing, and cash costs stay together while travelers compare flights, hotels, and rental cars.",
    primaryKeywords: [
      "points and miles trip planner",
      "award travel planning app",
      "AI flight booking assistant",
      "AI hotel booking assistant",
      "travel booking assistant",
      "compare flights with loyalty context",
      "travel booking with calendar context",
    ],
    competitorFrame:
      "point.me, Seats.aero, Roame.travel, and AwardWallet are useful for award search, award seat discovery, and loyalty tracking. Expedia, Booking.com, and KAYAK are built around broad travel inventory. Navan and TravelPerk focus on managed business travel. Pack focuses on booking decisions where the itinerary, traveler profile, loyalty context, calendar constraints, cash costs, points-related context, and trip reason all matter together.",
    proofPoints: [
      "Travel booking can stay attached to the itinerary, traveler profile, loyalty details, calendar context, and trip reason.",
      "Loyalty details and traveler profiles can keep frequent flyer numbers, program context, trusted traveler details, and preferences close to booking decisions.",
      "Travel history and travel stats can make past routes, airport patterns, hotel patterns, and costs useful when planning the next trip.",
    ],
    sections: [
      {
        title: "Where points tools stop",
        body:
          "Dedicated award tools are valuable when the traveler needs award-seat search, balance tracking, or transfer-partner research. Pack handles the surrounding trip context.",
        points: [
          "Award-search tools help find award availability; Pack keeps points-related context attached to the real trip.",
          "Balance trackers help monitor accounts; Pack keeps loyalty details and traveler profiles useful during planning, booking, check-in, and review.",
          "Travelers still need to compare timing, calendar fit, airports, hotels, cars, group plans, and costs after they know a points option exists.",
        ],
      },
      {
        title: "Where Pack fits",
        body:
          "Pack focuses on the decision layer around the booking, not on replacing every inventory or award-search provider.",
        points: [
          "Compare flights and hotels against traveler preferences, calendar constraints, loyalty context, and the itinerary under review.",
          "Keep cash costs, points-related context, loyalty numbers, trusted traveler details, and booking records tied to the same trip.",
          "Carry the booking forward into trip expenses, sharing, upcoming-trip details, live views, and travel history.",
        ],
      },
      {
        title: "How to think about the difference",
        body:
          "Pack sits between generic inventory search, award-search tools, and business-travel management systems.",
        points: [
          "Pack is not a standalone award-flight search engine or real-time points balance tracker.",
          "Pack helps with points-and-miles trip planning, loyalty-aware comparison, and calendar-aware booking context.",
          "Loyalty Details covers loyalty numbers, while Traveler Profiles covers broader reusable traveler context.",
        ],
      },
    ],
    comparisons: [
      {
        title: "Pack vs. point.me, Seats.aero, Roame.travel, and AwardWallet",
        body:
          "Those tools are useful for award search, award availability, and loyalty account tracking. Pack keeps points-related context in the actual trip workflow.",
        points: [
          "Award-seat discovery tools remain useful for redemption research.",
          "Pack helps with the workflow around deciding, booking, organizing, sharing, expensing, and remembering the trip.",
        ],
      },
      {
        title: "Pack vs. Expedia, Booking.com, and KAYAK",
        body:
          "OTAs and metasearch tools focus on broad inventory and destination surfaces. Pack is useful when booking choices depend on personal context.",
        points: [
          "Itinerary, traveler profile, loyalty context, and calendar constraints can change the booking decision.",
          "Pack keeps booking decisions connected to the capabilities that affect the trip before and after purchase.",
        ],
      },
      {
        title: "Pack vs. Navan and TravelPerk",
        body:
          "Managed-travel platforms solve company policy, approval, and expense workflows. Pack can still use business-traveler and assistant language around lighter-weight booking context.",
        points: [
          "Use business-traveler, executive-assistant, and travel-coordinator examples without implying enterprise policy administration.",
          "Tie booking context to profiles, shared trips, expenses, and travel-day readiness.",
        ],
      },
    ],
    faqs: [
      {
        question: "Is Pack a points and miles trip planner?",
        answer:
          "Pack can help as a points-and-miles trip planning context layer, not as a standalone award-seat search engine. Pack's strongest role is keeping loyalty details, traveler profiles, points-related context, calendar constraints, itinerary context, and booking decisions attached to the actual trip.",
      },
      {
        question: "Can Pack compare flights with loyalty context?",
        answer:
          "Pack is designed to keep traveler profiles, loyalty details, preferences, calendar timing, and trip context close to booking decisions so flight and hotel comparisons are not made in a vacuum.",
      },
      {
        question: "Does Pack replace award-flight search tools?",
        answer:
          "No. Award-flight search tools are specialized for award availability and redemption research. Pack handles the surrounding trip workflow: planning, booking context, loyalty details, itinerary organization, expenses, sharing, and travel-day readiness.",
      },
    ],
    relatedLinks: [
      { href: "/travel-booking", label: "Travel Booking" },
      { href: "/loyalty-details", label: "Loyalty Details" },
      { href: "/traveler-profiles", label: "Traveler Profiles" },
      { href: "/travel-stats", label: "Travel Stats" },
      { href: "/trip-expenses", label: "Trip Expenses" },
    ],
  },
  {
    slug: "group-trip-planning",
    eyebrow: "Group Trip Planning Guide",
    title: "Group trip planner for shared itineraries, linked plans, and costs",
    description:
      "A Pack guide to group trip planning, shared trip itineraries, collaborative travel planning, linked trips, family travel, assistant workflows, and shared travel expenses.",
    intro:
      "Group travel fails when the itinerary, updates, responsibilities, and costs split across screenshots, spreadsheets, message threads, and forwarded confirmations. Pack keeps the shared trip context connected.",
    primaryKeywords: [
      "group trip planner",
      "shared trip itinerary",
      "family trip planner app",
      "collaborative travel planner",
      "group travel itinerary",
      "shared travel expenses",
    ],
    competitorFrame:
      "Wanderlog is strong for collaborative travel planning. Business-travel tools such as Navan and TravelPerk address managed group travel from a company angle. Pack is built for the consumer, family, assistant, and mixed-workflow layer where linked trips, shared itineraries, live views, expenses, and updates stay connected.",
    proofPoints: [
      "Trip sharing, linked trips, copies, imports, and invitations support multi-traveler coordination.",
      "Trip expenses keep cost context attached to the trip record instead of a separate spreadsheet.",
      "Live trip views and updates help shared plans stay useful when travel is close or changing.",
    ],
    sections: [
      {
        title: "Why group trips are different",
        body:
          "Solo planning is mostly a search and organization problem. Group planning is a coordination problem.",
        points: [
          "Different travelers may have different flights, preferences, budgets, loyalty context, and arrival times.",
          "The group still needs one source of truth for shared stays, shared activities, and key travel-day details.",
          "Costs and responsibilities need to stay tied to the trip instead of drifting into separate tools.",
        ],
      },
      {
        title: "Pack's best group-trip wedge",
        body:
          "Pack is more than a generic vacation idea board. It is built around shared operational context.",
        points: [
          "Shared itineraries, invitations, linked trips, imported trips, and copied trips.",
          "Group expenses and shared travel costs attached to the travel record.",
          "Live trip views and trip updates that keep multiple travelers aligned.",
        ],
      },
      {
        title: "Who this helps",
        body:
          "The same workflow can support families, friends, executive assistants, travel coordinators, and mixed business-personal travel.",
        points: [
          "Families coordinating flights, stays, rental cars, and arrival timing.",
          "Assistants or coordinators assembling travel for someone else.",
          "Groups trying to keep shared costs and itinerary changes out of scattered threads.",
        ],
      },
    ],
    comparisons: [
      {
        title: "Pack vs. Wanderlog",
        body:
          "Wanderlog is a strong collaborative planning reference. Pack connects shared itinerary, booking context, trip updates, live views, and expenses.",
        points: [
          "Collaborative planning is most useful when it includes what happens after the plan changes.",
          "Shared expenses and linked trips are important long-tail keywords Pack can own with proof-led content.",
        ],
      },
      {
        title: "Pack vs. Navan and TravelPerk",
        body:
          "Navan and TravelPerk solve managed business-travel workflows. Pack addresses lighter-weight group coordination for families, assistants, and smaller teams.",
        points: [
          "Use business-traveler and executive-assistant language without implying enterprise travel management parity.",
          "Keep the focus on trip context rather than expense-policy administration.",
        ],
      },
    ],
    faqs: [
      {
        question: "What is the best way to plan a group trip?",
        answer:
          "The best group trip planner keeps the shared itinerary, linked traveler plans, updates, and costs in one workflow. Pack is designed around trip sharing, linked trips, live views, and trip expenses so group travel does not split across screenshots and spreadsheets.",
      },
      {
        question: "Can Pack help share one itinerary with several travelers?",
        answer:
          "Yes. Pack's trip sharing surface is designed around links, invitations, linked trips, copies, imports, and collaboration workflows for multiple travelers.",
      },
      {
        question: "Can Pack help with shared travel expenses?",
        answer:
          "Pack's trip expenses surface is designed to keep costs attached to the itinerary and shared trip context, which is more useful than reconstructing costs later from separate notes and reimbursements.",
      },
    ],
    relatedLinks: [
      { href: "/trip-sharing", label: "Trip Sharing" },
      { href: "/trip-expenses", label: "Trip Expenses" },
      { href: "/live-trip-views", label: "Live Trip Views" },
      { href: "/trip-updates", label: "Trip Updates" },
    ],
  },
  {
    slug: "travel-stats-and-maps",
    eyebrow: "Travel Stats Guide",
    title: "Travel stats app for maps, repeat routes, and personal travel history",
    description:
      "A Pack guide to travel stats, travel maps, personal travel analytics, repeat routes, airport patterns, trip history maps, and flight history tracking.",
    intro:
      "Travel history becomes more valuable when it turns into patterns. Pack connects maps, timelines, repeat routes, airport patterns, stays, rental cars, loyalty context, and trip costs instead of showing one itinerary at a time.",
    primaryKeywords: [
      "travel stats app",
      "travel map app",
      "personal travel map",
      "travel history map",
      "flight history tracker",
      "repeat route tracker",
      "airport pattern tracker",
    ],
    competitorFrame:
      "Most competitors either focus on itinerary organization, destination inventory, or award-seat search. Travel stats and personal travel maps are less cleanly owned, especially when the stats connect flights, hotels, rental cars, costs, airports, loyalty context, and future planning.",
    proofPoints: [
      "Travel history gives Pack the record to analyze.",
      "Travel stats can turn that record into maps, timelines, repeat routes, airport patterns, hotel patterns, and cost context.",
      "Traveler profiles and loyalty details can make historical patterns useful for future booking decisions.",
    ],
    sections: [
      {
        title: "Why travel stats matter",
        body:
          "Travelers often have the data but not the memory. Flights, stays, cars, expenses, and routes live in separate systems.",
        points: [
          "A travel history map helps travelers remember where they went and how trips connected.",
          "Repeat-route and airport-pattern views can reveal habits that matter for planning, loyalty, and budgeting.",
          "Cost context helps the traveler compare what a trip felt like with what it actually cost.",
        ],
      },
      {
        title: "Where Pack can win",
        body:
          "Pack connects travel stats to real trip records instead of building a vanity map disconnected from itinerary context.",
        points: [
          "Flights, hotels, rental cars, expenses, and travel history contribute to the same pattern view.",
          "Stats lead back into future planning, traveler profiles, loyalty context, and booking decisions.",
          "Open lanes include repeat route tracker, airport pattern tracker, countries visited tracker, and personal travel analytics.",
        ],
      },
      {
        title: "How this helps planning",
        body:
          "Travel stats are more useful when they explain patterns instead of only listing places.",
        points: [
          "Answer map questions with 'travel history map' and 'personal travel map' language.",
          "Answer route questions with repeat routes, airport patterns, and flight history tracker language.",
          "Answer planning questions by tying stats back to future trips, loyalty decisions, and budget memory.",
        ],
      },
    ],
    comparisons: [
      {
        title: "Pack vs. itinerary-only apps",
        body:
          "Itinerary-only apps can store trip records, but Pack turns those records into broader history and pattern views.",
        points: [
          "Travel stats need to summarize the traveler's behavior over time.",
          "History, stats, expenses, and profiles work together instead of living as separate features.",
        ],
      },
      {
        title: "Pack vs. points and award tools",
        body:
          "Award tools help search seats or track balances. Pack uses travel stats to preserve the trip context that makes future loyalty and booking choices smarter.",
        points: [
          "Pack is not positioned as a real-time points balance tracker.",
          "Use careful language around loyalty context and points-related decisions attached to trips.",
        ],
      },
    ],
    faqs: [
      {
        question: "What app can show my travel history on a map?",
        answer:
          "Pack is designed to turn travel history into maps, timelines, and broader travel stats so trips are easier to review than separate flights, hotels, and rental cars.",
      },
      {
        question: "Can Pack show repeat routes and airport patterns?",
        answer:
          "Yes. Pack's travel stats positioning is built around repeat routes, airport patterns, destinations, stays, cars, costs, and other personal travel analytics that are hard to see one itinerary at a time.",
      },
      {
        question: "Is this only a flight history tracker?",
        answer:
          "No. Flight history matters, but Pack's stronger angle is broader trip context across flights, hotels, rental cars, expenses, loyalty context, and future planning.",
      },
    ],
    relatedLinks: [
      { href: "/travel-stats", label: "Travel Stats" },
      { href: "/travel-history", label: "Travel History" },
      { href: "/trip-expenses", label: "Trip Expenses" },
      { href: "/loyalty-details", label: "Loyalty Details" },
    ],
  },
] as const satisfies readonly SeoGuideDefinition[];

export type SeoGuideSlug = (typeof seoGuideDefinitions)[number]["slug"];

export const seoGuideDefinitionMap: Record<SeoGuideSlug, SeoGuideDefinition> =
  Object.fromEntries(
    seoGuideDefinitions.map((definition) => [definition.slug, definition]),
  ) as Record<SeoGuideSlug, SeoGuideDefinition>;

export function isSeoGuideSlug(slug: string | undefined): slug is SeoGuideSlug {
  return Boolean(slug && slug in seoGuideDefinitionMap);
}
