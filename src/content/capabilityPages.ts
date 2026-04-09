export interface CapabilityFaq {
  readonly question: string;
  readonly answer: string;
}

export interface CapabilityPageDefinition {
  readonly slug: string;
  readonly navLabel: string;
  readonly chipLabel?: string;
  readonly featureTitle: string;
  readonly featureDescription: string;
  readonly pageTitle: string;
  readonly pageSubtitle: string;
  readonly intro: string;
  readonly signalsTitle: string;
  readonly signals: readonly string[];
  readonly helpTitle: string;
  readonly helpPoints: readonly string[];
  readonly outputTitle: string;
  readonly outputPoints: readonly string[];
  readonly faqs: readonly CapabilityFaq[];
  readonly related: readonly string[];
  readonly supportingLink?:
    | {
        readonly href: string;
        readonly label: string;
        readonly description: string;
      }
    | undefined;
}

export const capabilityPageDefinitions = [
  {
    slug: "travel-history",
    navLabel: "Travel History",
    chipLabel: "History",
    featureTitle: "Extracts and displays past travel history",
    featureDescription:
      "Pack can help reconstruct flights, hotels, rental cars, and related trip details so past travel becomes visible and reusable.",
    pageTitle: "Travel history that stays useful after the trip ends",
    pageSubtitle:
      "Pack can help organize past flights, hotels, rental cars, and trip details into one readable travel record.",
    intro:
      "Most travel tools stop being useful once a booking is over. Pack is designed to help you bring past travel back into view so earlier trips become part of future planning instead of dead inbox clutter.",
    signalsTitle: "What Pack can help bring together",
    signals: [
      "Past flight, hotel, and rental car details from travel context you already have",
      "Trip dates, locations, and booking records that are otherwise spread across inboxes and apps",
      "A more complete record of how you have actually traveled over time",
    ],
    helpTitle: "How this can help",
    helpPoints: [
      "Review where you stayed, flew, and drove without piecing everything together manually",
      "Reuse prior travel context when planning similar trips again",
      "Keep one clearer view of your travel footprint instead of scattered records",
    ],
    outputTitle: "What you can do with it",
    outputPoints: [
      "See older trips in a form that is easier to review and reuse",
      "Use past travel as context when a similar trip comes up again",
      "Keep more of your travel record in one readable place",
    ],
    faqs: [
      {
        question: "Can Pack help reconstruct my past travel history?",
        answer:
          "Yes. Pack is designed to help organize past travel details from the travel context you already have, including prior bookings and related trip information.",
      },
      {
        question: "Does Pack replace official provider or government records?",
        answer:
          "No. Where official provider or government records apply, those remain the source of truth. Pack can help organize the travel details around them.",
      },
      {
        question: "How is travel history different from planning the next trip?",
        answer:
          "Travel history is about organizing and reusing what already happened. Planning the next trip is about building what comes next.",
      },
    ],
    related: ["travel-stats", "loyalty-details", "trip-planning-from-events"],
  },
  {
    slug: "travel-stats",
    navLabel: "Travel Stats",
    chipLabel: "Stats",
    featureTitle: "Shows travel stats, maps, and trip context",
    featureDescription:
      "Travel stats, maps, and timelines help show how flights, hotels, rental cars, and trip events connect at a glance.",
    pageTitle: "Travel stats and maps that go beyond a single itinerary",
    pageSubtitle:
      "Pack can help turn travel records into maps, timelines, and stats across flights, hotels, and rental cars.",
    intro:
      "Travel data gets more useful when it is visible, comparable, and easy to scan. Pack is designed to turn trip records into something you can actually understand at a glance.",
    signalsTitle: "What Pack can show",
    signals: [
      "Trip maps that show where your travel has taken you",
      "Stats that summarize travel patterns instead of hiding them in separate bookings",
      "Timelines that make flights, stays, and cars easier to interpret together",
    ],
    helpTitle: "How Pack can help",
    helpPoints: [
      "Show a broader picture of travel activity across categories",
      "Make repeated routes, destinations, and trip patterns easier to spot",
      "Turn travel history into something more visual and memorable",
    ],
    outputTitle: "What you get from it",
    outputPoints: [
      "A more visual way to understand how your trips connect",
      "Maps and timelines that make travel patterns easier to spot",
      "Context that can carry forward into future planning",
    ],
    faqs: [
      {
        question: "Can Pack show my trips on a map?",
        answer:
          "Pack is designed to show travel maps and trip context across your travel records so places, timing, and movement are easier to review.",
      },
      {
        question: "Are these stats only about flights?",
        answer:
          "No. Pack's goal is broader trip context across flights, hotels, rental cars, and related trip details.",
      },
      {
        question: "Why separate travel stats from travel history?",
        answer:
          "Travel history is about reconstructing the record. Travel stats and maps are about making that record more useful and easier to understand.",
      },
    ],
    related: ["travel-history", "trip-expenses", "live-trip-views"],
  },
  {
    slug: "loyalty-details",
    navLabel: "Loyalty Details",
    chipLabel: "Loyalty",
    featureTitle: "Extracts loyalty numbers and program details",
    featureDescription:
      "Pack can help organize loyalty numbers, traveler program details, and travel-account information across flights, hotels, and rental cars.",
    pageTitle: "Loyalty details that stay attached to the trip",
    pageSubtitle:
      "Pack can help organize loyalty numbers and program details across flights, hotels, and rental cars instead of leaving them scattered across bookings.",
    intro:
      "Loyalty details are easy to lose even though they matter every time you travel. Pack is designed to keep these details closer to the trip and the traveler profile they belong to.",
    signalsTitle: "What Pack can keep organized",
    signals: [
      "Traveler numbers and program details across multiple travel categories",
      "Travel profiles that remember recurring preferences and account context",
      "A less fragile way to keep loyalty information accessible when plans move",
    ],
    helpTitle: "How Pack can help",
    helpPoints: [
      "Keep loyalty details closer to the travel workflow instead of separate notes",
      "Reduce repeated searching for the same frequent traveler information",
      "Make profiles more reusable across future bookings and trip edits",
    ],
    outputTitle: "What you get from it",
    outputPoints: [
      "Loyalty details that stay closer to the trip instead of separate notes",
      "Less repeated searching for the same account information",
      "Traveler profiles that are easier to reuse later",
    ],
    faqs: [
      {
        question: "Can Pack help me keep loyalty details organized?",
        answer:
          "Yes. Pack is designed to keep loyalty numbers and program details organized as part of broader traveler context.",
      },
      {
        question: "Does Pack only support airline loyalty information?",
        answer:
          "No. The goal is broader support across flights, hotels, and rental cars where that information is relevant.",
      },
      {
        question: "How do loyalty details fit into the rest of the trip?",
        answer:
          "They stay useful before booking, during the trip, and when you are planning again later, so they work best as part of broader traveler context.",
      },
    ],
    related: ["traveler-profiles", "travel-history", "travel-booking"],
  },
  {
    slug: "trip-planning-from-events",
    navLabel: "Trip Planning From Events",
    chipLabel: "Planning",
    featureTitle: "Plans trips proactively from events and prompts",
    featureDescription:
      "Pack can plan trips from public events, private email and calendar events, and synthetic prompts in plain language.",
    pageTitle: "Trip planning that can start from events, meetings, and prompts",
    pageSubtitle:
      "Pack is designed to help plan travel proactively from the things already shaping the trip, not just a blank search form.",
    intro:
      "A lot of travel starts because something else already happened: a meeting got scheduled, an event appeared, or you know the shape of a trip before you know every leg. Pack is built for that reality.",
    signalsTitle: "What can start a trip in Pack",
    signals: [
      "Public events and trip-worthy dates that create travel demand",
      "Private email and calendar timing that can shape a travel draft",
      "Plain-language prompts like a week in Spain or a client trip next month",
    ],
    helpTitle: "How Pack can help",
    helpPoints: [
      "Turn emerging plans into a usable trip draft earlier",
      "Reduce the work of translating meetings and events into booked travel",
      "Use time constraints and trip context before search gets fragmented",
    ],
    outputTitle: "What you get from it",
    outputPoints: [
      "A trip can take shape earlier, while the reason for travel is still clear",
      "Meetings, events, and timing constraints stay closer to the itinerary",
      "Less translation from schedule changes into manual trip planning work",
    ],
    faqs: [
      {
        question: "Can Pack help plan a trip from my calendar or events?",
        answer:
          "Yes. Pack is designed to use event and timing context to help assemble a trip draft earlier in the planning process.",
      },
      {
        question: "Can a trip start from a plain-language prompt?",
        answer:
          "Yes. Pack is built to work from prompts as well as travel data and scheduling context.",
      },
      {
        question: "Why is this different from normal search?",
        answer:
          "Normal search starts with forms. This workflow starts with the reason the trip exists and the timing around it.",
      },
    ],
    related: ["trip-updates", "travel-booking", "connected-accounts"],
  },
  {
    slug: "trip-updates",
    navLabel: "Trip Updates",
    chipLabel: "Updates",
    featureTitle: "Edits and updates trips from many inputs",
    featureDescription:
      "Chat, voice, photos, email, calendar, and photo metadata can all help edit, organize, and reactively update trips.",
    pageTitle: "Trip updates from the channels people actually use",
    pageSubtitle:
      "Pack is designed to keep trips editable from chat, voice, inbox updates, photos, calendar changes, and related travel inputs.",
    intro:
      "Trips do not change in one clean workflow. They change in messages, inboxes, calendars, and half-remembered travel details. Pack is built around that messier reality.",
    signalsTitle: "What can feed trip updates",
    signals: [
      "Chat and voice changes when a traveler wants to move quickly",
      "Email and calendar updates when bookings or plans shift",
      "Photos and metadata that help preserve or reattach trip context",
    ],
    helpTitle: "How Pack can help",
    helpPoints: [
      "Keep one organized trip record as plans move",
      "Reduce manual itinerary cleanup after changes happen elsewhere",
      "Make travel edits feel closer to conversation than spreadsheet maintenance",
    ],
    outputTitle: "What you get from it",
    outputPoints: [
      "One organized trip record that can keep up with changing plans",
      "Less manual cleanup after updates happen in other channels",
      "Trip changes that feel closer to conversation than admin work",
    ],
    faqs: [
      {
        question: "Can Pack help update a trip from chat or voice?",
        answer:
          "Yes. Pack is designed to let travel changes stay connected to the organized trip even when they begin in conversation.",
      },
      {
        question: "Can email, calendar, and photos affect trip updates?",
        answer:
          "Yes. Those signals can help inform how a trip is reorganized or refreshed inside Pack.",
      },
      {
        question: "How are trip updates different from planning the trip?",
        answer:
          "Planning builds the trip. Updates keep it organized after plans change in chat, email, calendars, or other travel inputs.",
      },
    ],
    related: ["trip-planning-from-events", "trip-sharing", "upcoming-trip-details"],
  },
  {
    slug: "travel-booking",
    navLabel: "Travel Booking",
    chipLabel: "Booking",
    featureTitle: "Searches and books flights, hotels, and rental cars",
    featureDescription:
      "Pack is designed to search and book flights, hotels, rental cars, and related travel booking workflows inside one connected experience.",
    pageTitle: "Search and booking that stay attached to the trip",
    pageSubtitle:
      "Pack is designed to search and book flights, hotels, and rental cars without losing the travel context that shaped the trip.",
    intro:
      "The booking moment is where most travel tools take over, but it is also where context often falls apart. Pack is built so search and booking stay connected to the itinerary, traveler details, and planning logic around them.",
    signalsTitle: "What Pack can handle",
    signals: [
      "Flight, hotel, and rental car workflows as parts of one trip",
      "A more connected relationship between planning, review, and booking",
      "Traveler context that can stay attached instead of getting re-entered repeatedly",
    ],
    helpTitle: "How Pack can help",
    helpPoints: [
      "Search across major trip components without treating each one as an isolated task",
      "Keep booking details tied to the broader itinerary view",
      "Reduce the disconnect between trip planning and trip action",
    ],
    outputTitle: "What you get from it",
    outputPoints: [
      "Search and booking that stay tied to the itinerary you already reviewed",
      "Less disconnect between planning the trip and acting on it",
      "A clearer view of flights, hotels, and rental cars as one trip",
    ],
    faqs: [
      {
        question: "Can Pack help search and book flights, hotels, and rental cars?",
        answer:
          "Yes. Pack is designed around connected booking workflows across those core travel categories.",
      },
      {
        question: "Is this just a generic booking flow?",
        answer:
          "No. Pack is designed to keep booking tied to the itinerary, traveler details, and trip context around it.",
      },
      {
        question: "Why separate travel booking from proactive planning?",
        answer:
          "Planning is about assembling the trip. Booking is about acting on it while keeping that context intact.",
      },
    ],
    related: ["trip-planning-from-events", "traveler-profiles", "trip-expenses"],
  },
  {
    slug: "upcoming-trip-details",
    navLabel: "Upcoming Trip Details",
    chipLabel: "Upcoming",
    featureTitle: "Displays upcoming trip details",
    featureDescription:
      "Upcoming trips can show weather, timing, airport security waits, trip events, drive times, and transportation actions.",
    pageTitle: "Upcoming trip details that stay useful on travel day",
    pageSubtitle:
      "Pack is designed to keep the next trip readable with timing, weather, airport signals, and transportation context in one place.",
    intro:
      "A trip is not finished when it gets booked. The harder part often comes right before departure, when timing, traffic, airport conditions, and changing plans start to matter.",
    signalsTitle: "What Pack can surface around the next trip",
    signals: [
      "Weather, timing, and related trip events",
      "Airport security signals, drive times, and transportation actions",
      "A more complete pre-departure view instead of several separate apps",
    ],
    helpTitle: "How Pack can help",
    helpPoints: [
      "Make the upcoming trip easier to scan quickly",
      "Keep more of the departure-day questions in one place",
      "Support a travel workflow that stays useful after booking",
    ],
    outputTitle: "What you get from it",
    outputPoints: [
      "A quicker read on what matters before departure",
      "More travel-day questions answered in one place",
      "A trip workflow that stays useful after booking",
    ],
    faqs: [
      {
        question: "Can Pack show details that matter right before a trip?",
        answer:
          "Yes. Pack is designed to surface upcoming trip context such as timing, weather, airport signals, and related actions.",
      },
      {
        question: "Does this include airport security information?",
        answer:
          "It can. Pack's upcoming trip view is designed to work alongside airport security-wait information and other travel-day signals.",
      },
      {
        question: "How are upcoming-trip details different from planning?",
        answer:
          "Planning is about shaping the trip. Upcoming-trip details are about staying ready once the trip is close and timing starts to matter.",
      },
    ],
    related: ["airport-security-wait-times", "trip-calendar-sync", "live-trip-views"],
  },
  {
    slug: "airport-security-wait-times",
    navLabel: "Airport Security Wait Times",
    chipLabel: "Airport Waits",
    featureTitle: "Shows airport security wait times in app and web",
    featureDescription:
      "Pack can surface airport security wait times in both the app and web experience as part of broader travel-day context.",
    pageTitle: "Airport security wait times as part of a real trip workflow",
    pageSubtitle:
      "Pack can help surface airport security wait times in app and web while keeping that signal connected to the rest of the trip.",
    intro:
      "Airport security waits are useful on their own, but they get more valuable when they are attached to the actual trip, timing, and transport decisions around departure. That is the Pack angle.",
    signalsTitle: "What Pack can help surface",
    signals: [
      "Airport security wait information as one travel-day signal among several",
      "A workflow that helps travelers interpret the signal instead of just checking a number",
      "A clearer relationship between public airport data and the trip it affects",
    ],
    helpTitle: "How Pack can help",
    helpPoints: [
      "Surface airport wait information alongside the rest of the upcoming trip",
      "Make the wait signal easier to use in context with drive times and departure timing",
      "Provide a path from a public wait-time board into the broader Pack travel system",
    ],
    outputTitle: "What you get from it",
    outputPoints: [
      "Airport wait information that sits closer to the trip it affects",
      "A clearer way to read wait signals alongside timing and transport plans",
      "A path from the public wait board into the broader Pack trip view",
    ],
    faqs: [
      {
        question: "Can Pack show airport security wait times?",
        answer:
          "Pack is designed to surface airport security wait information in the app and on the web as part of broader travel-day context.",
      },
      {
        question: "Does Pack guarantee airport wait-time accuracy?",
        answer:
          "No. Airport security data can vary by source and freshness. Pack can help package that signal in a more useful way, but travelers should still leave margin.",
      },
      {
        question: "Is there a public wait-time board too?",
        answer:
          "Yes. Pack also publishes a public airport-security board that travelers can check directly.",
      },
    ],
    related: ["upcoming-trip-details", "live-trip-views", "trip-calendar-sync"],
    supportingLink: {
      href: "/tsa",
      label: "View the public airport security board",
      description:
        "Open Pack's live public TSA and airport security board to browse current checkpoints and airport wait signals.",
    },
  },
  {
    slug: "trip-calendar-sync",
    navLabel: "Trip Calendar Sync",
    chipLabel: "Calendar Sync",
    featureTitle: "Syncs trip events to device calendars",
    featureDescription:
      "Pack can sync trip events back to calendars so travel timing stays visible where people already manage the rest of their schedule.",
    pageTitle: "Trip calendar sync that keeps travel visible in your actual schedule",
    pageSubtitle:
      "Pack is designed to sync trip events to device calendars so departures, stays, and key travel timing stay visible alongside the rest of life.",
    intro:
      "Travel timing becomes much easier to trust when it shows up where people already check their day. Pack uses calendar sync as part of a larger trip system, not as a separate export afterthought.",
    signalsTitle: "What Pack can keep in sync",
    signals: [
      "Trip events flowing into calendars people already use every day",
      "Travel timing that stays visible without manual copying",
      "A cleaner connection between itineraries and broader scheduling context",
    ],
    helpTitle: "How Pack can help",
    helpPoints: [
      "Keep trip timing present inside a real schedule, not just inside a travel app",
      "Reduce missed timing caused by disconnected itinerary details",
      "Make travel updates easier to propagate across the workflow",
    ],
    outputTitle: "What you get from it",
    outputPoints: [
      "Trip timing that stays visible where you already manage your day",
      "Less manual copying between itineraries and calendars",
      "Travel updates that are easier to keep in sync",
    ],
    faqs: [
      {
        question: "Can Pack sync trip events to my calendar?",
        answer:
          "Yes. Pack is designed to sync trip events back to device calendars so travel timing is easier to keep in view.",
      },
      {
        question: "Why separate calendar sync from connected accounts?",
        answer:
          "Connected accounts are about bringing context in. Calendar sync is about pushing useful trip timing back out.",
      },
      {
        question: "Why does this matter for travelers?",
        answer:
          "Because the schedule people actually trust is usually the one they already look at throughout the day.",
      },
    ],
    related: ["connected-accounts", "upcoming-trip-details", "airport-security-wait-times"],
  },
  {
    slug: "connected-accounts",
    navLabel: "Connected Accounts",
    chipLabel: "Accounts",
    featureTitle: "Connects external accounts and providers",
    featureDescription:
      "Pack can connect external email, calendar, and travel providers so planning and trip organization start from richer travel context.",
    pageTitle: "Connected travel accounts that give the trip more context",
    pageSubtitle:
      "Pack is designed to connect external accounts and providers so inbox, calendar, and related travel context can work together.",
    intro:
      "Travel context is strongest when it does not live in one isolated tool. Pack uses connected accounts to bring more of the real trip picture into one system.",
    signalsTitle: "What connected accounts can enable",
    signals: [
      "Richer planning context from email and calendar sources",
      "Trip updates that can follow changes happening outside the app",
      "A stronger base for reconstructing travel history and traveler profiles",
    ],
    helpTitle: "How Pack can help",
    helpPoints: [
      "Reduce manual forwarding and re-entry across travel workflows",
      "Make planning and organization more context-aware from the start",
      "Support a broader travel system instead of a standalone search session",
    ],
    outputTitle: "What you get from it",
    outputPoints: [
      "Richer travel context from the start of planning",
      "Less manual forwarding and setup across the workflow",
      "A stronger base for history, profiles, and trip updates",
    ],
    faqs: [
      {
        question: "Can Pack connect external travel accounts and providers?",
        answer:
          "Yes. Pack is designed to connect key external accounts and travel sources so more trip context can be organized in one place.",
      },
      {
        question: "Why is this different from calendar sync?",
        answer:
          "Connected accounts bring information into Pack. Calendar sync pushes useful trip timing back out.",
      },
      {
        question: "How do connected accounts help the trip stay organized?",
        answer:
          "They let Pack start from richer email, calendar, and travel context so less of the trip has to be assembled manually.",
      },
    ],
    related: ["trip-planning-from-events", "trip-calendar-sync", "travel-history"],
  },
  {
    slug: "traveler-profiles",
    navLabel: "Traveler Profiles",
    chipLabel: "Profiles",
    featureTitle: "Manages traveler profiles, preferences, and trusted traveler details",
    featureDescription:
      "Pack can organize traveler profiles, preferences, accessibility needs, loyalty details, and trusted traveler information as part of the trip.",
    pageTitle: "Traveler profiles that remember more than one booking",
    pageSubtitle:
      "Pack is designed to keep traveler preferences, accessibility details, trusted traveler context, and loyalty information organized together.",
    intro:
      "Travelers repeat a lot of the same details over and over. Pack treats those details as part of the travel system, not just one more form to fill every time.",
    signalsTitle: "What can belong in the traveler profile",
    signals: [
      "Preferences that shape how future trips should be planned",
      "Trusted traveler context and recurring booking details",
      "Accessibility needs and loyalty information that should not get lost",
    ],
    helpTitle: "How Pack can help",
    helpPoints: [
      "Keep repeat traveler details in one clearer place",
      "Make future trip planning and booking more consistent",
      "Reduce friction from re-entering the same context repeatedly",
    ],
    outputTitle: "What you get from it",
    outputPoints: [
      "Traveler details that are easier to reuse across future trips",
      "More consistent planning and booking from one trip to the next",
      "Less friction from re-entering the same context repeatedly",
    ],
    faqs: [
      {
        question: "Can Pack help manage traveler profiles and preferences?",
        answer:
          "Yes. Pack is designed to organize traveler context such as preferences, loyalty information, accessibility needs, and trusted traveler details.",
      },
      {
        question: "Why separate traveler profiles from loyalty details?",
        answer:
          "Loyalty details are one subset of a broader traveler profile that can also include preferences and accessibility context.",
      },
      {
        question: "How are traveler profiles different from travel history?",
        answer:
          "Travel history is the record of where you have been. Traveler profiles hold the preferences and recurring details that shape future trips.",
      },
    ],
    related: ["loyalty-details", "travel-booking", "connected-accounts"],
  },
  {
    slug: "trip-sharing",
    navLabel: "Trip Sharing",
    chipLabel: "Sharing",
    featureTitle: "Supports trip sharing and group travel workflows",
    featureDescription:
      "Trips can be shared through links, invitations, linked trips, imports, copies, and group travel workflows so planning stays collaborative.",
    pageTitle: "Trip sharing and group travel without losing the thread",
    pageSubtitle:
      "Pack is designed to support sharing, invitations, linked trips, and group travel workflows so the itinerary can stay collaborative instead of fragmenting.",
    intro:
      "Group travel becomes messy fast because conversations, copies, and bookings split across too many places. Pack treats collaboration as part of the trip itself.",
    signalsTitle: "What Pack can keep together",
    signals: [
      "Links and invitations that keep travelers aligned around the same trip",
      "Imports, copies, and linked-trip workflows when plans branch or expand",
      "A more coherent approach to group travel than scattered messages and screenshots",
    ],
    helpTitle: "How Pack can help",
    helpPoints: [
      "Keep multiple travelers closer to the same source of trip context",
      "Reduce the drift that happens when group travel fans out across channels",
      "Make linked or copied trips easier to manage when plans diverge",
    ],
    outputTitle: "What you get from it",
    outputPoints: [
      "A cleaner shared view of the trip for multiple travelers",
      "Less drift across messages, copies, and side conversations",
      "More structure when one trip turns into several linked plans",
    ],
    faqs: [
      {
        question: "Can Pack help share trips with other travelers?",
        answer:
          "Yes. Pack is designed to support sharing and collaboration through links, invitations, and related trip workflows.",
      },
      {
        question: "Is this only for one itinerary?",
        answer:
          "No. Pack is also designed for linked trips, copies, and group-travel cases where several travelers need to stay coordinated.",
      },
      {
        question: "How is group travel different from solo trip planning?",
        answer:
          "Group travel needs shared visibility, coordination, and linked plans in a way solo trip planning does not.",
      },
    ],
    related: ["trip-updates", "live-trip-views", "trip-expenses"],
  },
  {
    slug: "live-trip-views",
    navLabel: "Live Trip Views",
    chipLabel: "Live Views",
    featureTitle: "Supports live upcoming-trip views and Live Activities",
    featureDescription:
      "Upcoming trips can stay visible with lock-screen style views, status details, and fast actions when travelers need trip context immediately.",
    pageTitle: "Live trip views that keep the next trip within reach",
    pageSubtitle:
      "Pack is designed to support live upcoming-trip views and lock-screen style surfaces so trip status and actions stay close at hand.",
    intro:
      "When a trip is close, speed matters. Travelers should not have to reopen several screens just to confirm what happens next. Pack uses live trip views to keep the next move visible.",
    signalsTitle: "What live trip views can surface",
    signals: [
      "Upcoming trip status and quick action context",
      "A tighter relationship between the trip and the moment the traveler needs it",
      "An experience that stays useful outside the main itinerary screen",
    ],
    helpTitle: "How Pack can help",
    helpPoints: [
      "Keep the next trip easier to check quickly",
      "Make travel-day details feel more immediate and less buried",
      "Connect operational trip context to more glanceable surfaces",
    ],
    outputTitle: "What you get from it",
    outputPoints: [
      "Trip status and actions that are easier to check quickly",
      "More immediate access to what matters when time is tight",
      "A travel-day experience that stays useful outside the main itinerary screen",
    ],
    faqs: [
      {
        question: "Can Pack show live upcoming-trip views?",
        answer:
          "Yes. Pack is designed to support live views of the next trip with status details and useful actions.",
      },
      {
        question: "Is this only inside the main app screen?",
        answer:
          "No. The point is to keep key trip context accessible through more immediate surfaces when travelers need it quickly.",
      },
      {
        question: "How are live trip views different from upcoming-trip details?",
        answer:
          "Upcoming-trip details are the information itself. Live trip views are about keeping that information visible in faster, more glanceable surfaces.",
      },
    ],
    related: ["upcoming-trip-details", "airport-security-wait-times", "trip-sharing"],
  },
  {
    slug: "trip-expenses",
    navLabel: "Trip Expenses",
    chipLabel: "Expenses",
    featureTitle: "Organizes trip expenses",
    featureDescription:
      "Pack is designed to organize travel expenses so the full cost of a trip is easier to track, review, and keep attached to the trip record.",
    pageTitle: "Trip expenses that stay attached to the travel record",
    pageSubtitle:
      "Pack can help organize trip expenses so the cost of travel is easier to review in the same place as the itinerary.",
    intro:
      "Travel costs get harder to understand when they break away from the trip itself. Pack treats expenses as part of the travel record rather than an unrelated afterthought.",
    signalsTitle: "What Pack can keep attached to the trip",
    signals: [
      "Trip expenses as part of the same system as flights, hotels, and cars",
      "A clearer relationship between the itinerary and what the trip actually cost",
      "A travel workflow that stays useful after the booking moment",
    ],
    helpTitle: "How Pack can help",
    helpPoints: [
      "Keep expenses attached to the trip instead of separate spreadsheets or notes",
      "Make it easier to review the total picture of a trip later",
      "Support future planning with a better memory of what travel really cost",
    ],
    outputTitle: "What you get from it",
    outputPoints: [
      "Trip costs that stay attached to the itinerary instead of separate notes",
      "An easier way to review the full cost of travel later",
      "Better memory of what trips actually cost when planning again",
    ],
    faqs: [
      {
        question: "Can Pack help organize travel expenses?",
        answer:
          "Yes. Pack is designed to keep trip expenses organized as part of the broader trip record.",
      },
      {
        question: "Why not leave expenses in a separate tool?",
        answer:
          "Because the cost of a trip is easier to understand when it stays attached to the itinerary and travel history around it.",
      },
      {
        question: "How are trip expenses different from itinerary planning?",
        answer:
          "Itinerary planning is about shaping the trip. Trip expenses are about keeping the cost of that trip readable and connected afterward.",
      },
    ],
    related: ["travel-stats", "travel-booking", "travel-history"],
  },
] as const satisfies readonly CapabilityPageDefinition[];

export type CapabilityPageSlug = (typeof capabilityPageDefinitions)[number]["slug"];

export const capabilityPageDefinitionMap: Record<
  CapabilityPageSlug,
  CapabilityPageDefinition
> = Object.fromEntries(
  capabilityPageDefinitions.map((definition) => [definition.slug, definition])
) as Record<CapabilityPageSlug, CapabilityPageDefinition>;
