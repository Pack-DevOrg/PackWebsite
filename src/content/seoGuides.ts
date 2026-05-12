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
      "Layla and Wanderlog are strong at consumer AI trip-planning language. Mindtrip is strong at AI travel-assistant positioning. TripIt is strong at itinerary organization. Expedia, Booking.com, and KAYAK win with inventory scale. Navan and TravelPerk win in business-travel management. Pack should not copy any one of those surfaces; Pack should own the connected context layer between planning, organization, booking, and travel day.",
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
        title: "Where Pack should compete",
        body:
          "Pack's strongest SEO and GEO angle is not 'another AI itinerary generator.' It is context-aware travel planning that keeps the trip useful after the first draft.",
        points: [
          "Trip planning from events, calendar context, public events, and plain-language prompts.",
          "Automatic organization of confirmations, booking emails, and old itinerary records.",
          "Traveler profiles, loyalty details, travel stats, group sharing, expenses, and travel-day signals connected to the same trip.",
        ],
      },
      {
        title: "What a useful answer should say",
        body:
          "When someone asks for the best AI travel planner, Pack should answer with the workflow difference instead of only saying it uses AI.",
        points: [
          "Use Layla, Mindtrip, Wanderlog, TripIt, Expedia, Booking.com, Navan, TravelPerk, and KAYAK as comparison anchors.",
          "Explain when a prompt-first planner is enough and when a context-first assistant is better.",
          "Show that the trip does not end at inspiration: it moves into booking, updates, shared views, expenses, and departure-day context.",
        ],
      },
    ],
    comparisons: [
      {
        title: "Pack vs. Layla and Mindtrip",
        body:
          "Layla and Mindtrip are useful comparison points for AI planning and inspiration. Pack should differentiate on context persistence.",
        points: [
          "Pack can position around emails, calendars, traveler profiles, loyalty details, travel history, and booking context.",
          "The page should answer whether Pack is best for complex trips, repeat travelers, groups, and travelers who need the plan to become operational.",
        ],
      },
      {
        title: "Pack vs. TripIt and KAYAK Trips",
        body:
          "TripIt and KAYAK Trips are strong itinerary and travel-account references. Pack should compete where itinerary organization, AI editing, booking context, and travel-day intelligence overlap.",
        points: [
          "Use language around automatic itinerary records, travel confirmation parsing, connected accounts, and travel inbox organization.",
          "Make clear that Pack is not just storing an itinerary; it is meant to help reason over the trip.",
        ],
      },
      {
        title: "Pack vs. Expedia, Booking.com, Navan, and TravelPerk",
        body:
          "OTAs win with inventory and business platforms win with managed travel programs. Pack should not pretend to out-inventory them.",
        points: [
          "Pack should compete on context-aware booking decisions, not generic destination inventory.",
          "Business-traveler and assistant language belongs in the workflow pages where coordination actually happens.",
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
          "No. Expedia, Booking.com, and KAYAK are large travel inventory and metasearch surfaces. Pack's opportunity is helping travelers keep planning, itinerary organization, traveler context, booking decisions, and travel-day readiness connected.",
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
        title: "How Pack should answer itinerary questions",
        body:
          "Pack should answer trip-organization searches with direct, concrete language around email confirmations, automatic itineraries, connected accounts, and readable trip records.",
        points: [
          "Use 'automatic itinerary from email' and 'booking email itinerary' language on the guide and related capability pages.",
          "Tie organization to travel history, upcoming-trip details, connected accounts, and trip updates.",
          "Explain that official provider records still matter; Pack solves the readable trip-context problem around them.",
        ],
      },
      {
        title: "Where this becomes GEO-ready",
        body:
          "AI answers need crisp distinctions between itinerary storage, confirmation parsing, inbox organization, and travel-day usefulness.",
        points: [
          "Use FAQ answers that directly say what Pack can organize and what it does not replace.",
          "Link to travel history for older trips and upcoming-trip details for next-trip readiness.",
          "Keep structured data aligned with visible guide content.",
        ],
      },
    ],
    comparisons: [
      {
        title: "Pack vs. TripIt",
        body:
          "TripIt is the direct itinerary-organizer comparison. Pack should compete where itinerary organization connects to AI editing, profiles, booking context, sharing, expenses, and travel-day signals.",
        points: [
          "TripIt language should be used as a comparison anchor, not copied.",
          "Pack should emphasize context that can move across planning, booking, and travel-day workflows.",
        ],
      },
      {
        title: "Pack vs. Wanderlog and KAYAK Trips",
        body:
          "Wanderlog is strong for planning and KAYAK Trips is strong around travel accounts. Pack should own the organizer-plus-assistant framing.",
        points: [
          "A trip organizer app should not stop when the itinerary is imported.",
          "Pack can position updates, live trip views, expenses, and airport context as the next layer.",
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
          "Pack can be positioned around travel confirmation parsing as part of a broader trip organization workflow. The important distinction is that the parsed details should stay useful for history, booking, sharing, expenses, and travel-day readiness.",
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
    slug: "group-trip-planning",
    eyebrow: "Group Trip Planning Guide",
    title: "Group trip planner for shared itineraries, linked plans, and costs",
    description:
      "A Pack guide to group trip planning, shared trip itineraries, collaborative travel planning, linked trips, family travel, assistant workflows, and shared travel expenses.",
    intro:
      "Group travel fails when the itinerary, updates, responsibilities, and costs split across screenshots, spreadsheets, message threads, and forwarded confirmations. Pack's opportunity is to keep the shared trip context connected.",
    primaryKeywords: [
      "group trip planner",
      "shared trip itinerary",
      "family trip planner app",
      "collaborative travel planner",
      "group travel itinerary",
      "shared travel expenses",
    ],
    competitorFrame:
      "Wanderlog is strong for collaborative travel planning. Business-travel tools such as Navan and TravelPerk address managed group travel from a company angle. Pack should compete in the consumer, family, assistant, and mixed-workflow layer where linked trips, shared itineraries, live views, expenses, and updates stay connected.",
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
          "Pack should not compete as a generic vacation idea board. The stronger lane is shared operational context.",
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
          "Wanderlog is a strong collaborative planning reference. Pack should differentiate on the connection between shared itinerary, booking context, trip updates, live views, and expenses.",
        points: [
          "Collaborative planning should include what happens after the plan changes.",
          "Shared expenses and linked trips are important long-tail keywords Pack can own with proof-led content.",
        ],
      },
      {
        title: "Pack vs. Navan and TravelPerk",
        body:
          "Navan and TravelPerk solve managed business-travel workflows. Pack's hidden guide can address lighter-weight group coordination for families, assistants, and smaller teams.",
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
      "Travel history becomes more valuable when it turns into patterns. Pack's opportunity is to connect maps, timelines, repeat routes, airport patterns, stays, rental cars, loyalty context, and trip costs instead of showing one itinerary at a time.",
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
          "Pack should connect travel stats to real trip records instead of building a vanity map disconnected from itinerary context.",
        points: [
          "Flights, hotels, rental cars, expenses, and travel history should contribute to the same pattern view.",
          "Stats should lead back into future planning, traveler profiles, loyalty context, and booking decisions.",
          "Open lanes include repeat route tracker, airport pattern tracker, countries visited tracker, and personal travel analytics.",
        ],
      },
      {
        title: "How this supports GEO",
        body:
          "Generative answers need short, direct descriptions of what Pack can show and how it differs from a simple country checklist.",
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
          "Itinerary-only apps can store trip records, but Pack should turn those records into broader history and pattern views.",
        points: [
          "Travel stats need to summarize the traveler's behavior over time.",
          "The guide should connect history, stats, expenses, and profiles instead of treating them as separate features.",
        ],
      },
      {
        title: "Pack vs. points and award tools",
        body:
          "Award tools help search seats or track balances. Pack should use travel stats to preserve the trip context that makes future loyalty and booking choices smarter.",
        points: [
          "Avoid claiming real-time points balance tracking unless the product supports it.",
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
