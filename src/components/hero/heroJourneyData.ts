export type FlightPreviewItem = {
  readonly type: "flight";
  readonly id: string;
  readonly origin: string;
  readonly originCity: string;
  readonly destination: string;
  readonly destinationCity: string;
  readonly date: string;
};

export type HotelPreviewEvent = {
  readonly id: string;
  readonly title: string;
  readonly meta: string;
};

export type HotelPreviewItem = {
  readonly type: "hotel";
  readonly id: string;
  readonly label: "Hotel" | "Visit";
  readonly title: string;
  readonly checkIn: string;
  readonly checkOut: string;
  readonly nights: number;
  readonly events: readonly HotelPreviewEvent[];
};

export type PreviewOutlineItem = FlightPreviewItem | HotelPreviewItem;

export type PlanFlightOption = {
  readonly id: string;
  readonly carrier: string;
  readonly carrierCode: string;
  readonly logoSrc?: string;
  readonly ranking: string;
  readonly departureTime: string;
  readonly arrivalTime: string;
  readonly origin: string;
  readonly destination: string;
  readonly duration: string;
  readonly stops: string;
  readonly fareClass: string;
  readonly price: string;
  readonly priceDetails: {
    readonly baseFare: string;
    readonly taxesAndFees: string;
    readonly serviceFee: string;
  };
  readonly aircraft: string;
  readonly accent?: "gold" | "red" | "green" | "blue";
  readonly chips: readonly string[];
};

export type PlanHotelOption = {
  readonly id: string;
  readonly name: string;
  readonly brandMark: string;
  readonly brandLabel?: string;
  readonly ranking: string;
  readonly neighborhood: string;
  readonly roomType: string;
  readonly boardType: string;
  readonly nightlyRate: string;
  readonly total: string;
  readonly priceDetails: {
    readonly roomRate: string;
    readonly taxesAndFees: string;
    readonly serviceFee: string;
  };
  readonly rating: string;
  readonly image: string;
  readonly accent?: "gold" | "red" | "green" | "blue";
  readonly chips: readonly string[];
};

export type BookingBreakdownRow = {
  readonly label: string;
  readonly value: string;
};

export type StatsRecordRow = {
  readonly icon: "calendar" | "dollar-sign" | "navigation" | "plane" | "trending-up" | "award" | "map-pin";
  readonly tone: string;
  readonly label: string;
  readonly value: string;
  readonly meta: string;
};

export const outlineItems: readonly PreviewOutlineItem[] = [
  {
    type: "flight",
    id: "flight-jfk-bcn",
    origin: "JFK",
    originCity: "New York",
    destination: "BCN",
    destinationCity: "Barcelona",
    date: "Tue, Jun 23",
  },
  {
    type: "hotel",
    id: "hotel-barcelona",
    label: "Hotel",
    title: "Barcelona stay — Mandarin Oriental Barcelona",
    checkIn: "Tue, Jun 23",
    checkOut: "Thu, Jul 2",
    nights: 9,
    events: [
      {
        id: "evt-barcelona-arrival",
        title: "Private airport transfer and suite check-in",
        meta: "Tue 11:45 AM • Passeig de Gracia",
      },
      {
        id: "evt-barcelona-yacht",
        title: "Sunset yacht charter hold",
        meta: "Wed 6:30 PM • Port Vell",
      },
      {
        id: "evt-barcelona-dining",
        title: "Disfrutar tasting menu reservation",
        meta: "Fri 9:00 PM • Eixample",
      },
      {
        id: "evt-barcelona-beach-club",
        title: "Beach club cabana request",
        meta: "Sun 1:00 PM • Barceloneta",
      },
      {
        id: "evt-barcelona-helicopter",
        title: "Helicopter coastline experience",
        meta: "Tue 4:00 PM • Barcelona Heliport",
      },
      {
        id: "evt-barcelona-checkout",
        title: "Late checkout and VIP airport escort",
        meta: "Thu 9:15 AM • BCN private terminal",
      },
    ],
  },
  {
    type: "flight",
    id: "flight-bcn-jfk",
    origin: "BCN",
    originCity: "Barcelona",
    destination: "JFK",
    destinationCity: "New York",
    date: "Thu, Jul 2",
  },
];

export const outboundFlightOptions: readonly PlanFlightOption[] = [
  {
    id: "outbound-delta",
    carrier: "Delta Air Lines",
    carrierCode: "DL",
    logoSrc: "https://www.gstatic.com/flights/airline_logos/70px/DL.png",
    ranking: "Selected",
    departureTime: "6:55 PM",
    arrivalTime: "9:00 AM",
    origin: "JFK",
    destination: "BCN",
    duration: "8h 05m",
    stops: "Nonstop",
    fareClass: "Delta One",
    price: "$3,744",
    priceDetails: {
      baseFare: "$3,612",
      taxesAndFees: "$126",
      serviceFee: "$6",
    },
    aircraft: "Airbus A330-900neo",
    accent: "blue",
    chips: ["Suite 2A", "2 checked bags", "Sky Club access"],
  },
  {
    id: "outbound-delta-premium",
    carrier: "Delta Air Lines",
    carrierCode: "DL",
    logoSrc: "https://www.gstatic.com/flights/airline_logos/70px/DL.png",
    ranking: "Lower fare",
    departureTime: "8:30 PM",
    arrivalTime: "10:35 AM",
    origin: "JFK",
    destination: "BCN",
    duration: "8h 05m",
    stops: "Nonstop",
    fareClass: "Premium Select",
    price: "$2,186",
    priceDetails: {
      baseFare: "$2,058",
      taxesAndFees: "$122",
      serviceFee: "$6",
    },
    aircraft: "Airbus A330-300",
    accent: "blue",
    chips: ["Seat 20A", "2 bags", "Priority boarding"],
  },
  {
    id: "outbound-af",
    carrier: "Air France",
    carrierCode: "AF",
    logoSrc: "https://www.gstatic.com/flights/airline_logos/70px/AF.png",
    ranking: "1 stop",
    departureTime: "5:30 PM",
    arrivalTime: "1:55 PM",
    origin: "JFK",
    destination: "BCN",
    duration: "14h 25m",
    stops: "1 stop",
    fareClass: "Business",
    price: "$3,298",
    priceDetails: {
      baseFare: "$3,144",
      taxesAndFees: "$148",
      serviceFee: "$6",
    },
    aircraft: "Boeing 777-300ER",
    accent: "red",
    chips: ["CDG connection", "La Premiere lounge", "2 bags"],
  },
] as const;

export const hotelOptions: readonly PlanHotelOption[] = [
  {
    id: "mandarin-oriental",
    name: "Mandarin Oriental Barcelona",
    brandMark: "MO",
    brandLabel: "Luxury collection",
    ranking: "Selected stay",
    neighborhood: "Passeig de Gracia",
    roomType: "Mandarin suite terrace",
    boardType: "Breakfast included",
    nightlyRate: "$1,678 / night",
    total: "$15,102",
    priceDetails: {
      roomRate: "$14,784",
      taxesAndFees: "$312",
      serviceFee: "$6",
    },
    rating: "4.9",
    image:
      "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
    accent: "gold",
    chips: ["Spa access", "Chauffeur transfer", "Butler service"],
  },
  {
    id: "edition-barcelona",
    name: "The Barcelona EDITION",
    brandMark: "ED",
    brandLabel: "Designer luxury",
    ranking: "Rooftop option",
    neighborhood: "Eixample",
    roomType: "Penthouse loft",
    boardType: "Room only",
    nightlyRate: "$1,392 / night",
    total: "$12,534",
    priceDetails: {
      roomRate: "$12,216",
      taxesAndFees: "$312",
      serviceFee: "$6",
    },
    rating: "4.8",
    image:
      "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
    accent: "green",
    chips: ["Rooftop pool", "Chef tasting access", "Corner suite"],
  },
  {
    id: "hotel-arts",
    name: "Hotel Arts Barcelona",
    brandMark: "HA",
    brandLabel: "Waterfront icon",
    ranking: "Marina suite",
    neighborhood: "Barceloneta waterfront",
    roomType: "Club Marina suite",
    boardType: "Breakfast included",
    nightlyRate: "$1,244 / night",
    total: "$11,202",
    priceDetails: {
      roomRate: "$10,902",
      taxesAndFees: "$294",
      serviceFee: "$6",
    },
    rating: "4.8",
    image:
      "https://images.unsplash.com/photo-1566073771259-6a8506099945?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
    accent: "gold",
    chips: ["Spa + pool", "Marina views", "VIP arrival"],
  },
] as const;

export const returnFlightOptions: readonly PlanFlightOption[] = [
  {
    id: "return-delta",
    carrier: "Delta Air Lines",
    carrierCode: "DL",
    logoSrc: "https://www.gstatic.com/flights/airline_logos/70px/DL.png",
    ranking: "Selected return",
    departureTime: "12:00 PM",
    arrivalTime: "3:05 PM",
    origin: "BCN",
    destination: "JFK",
    duration: "9h 05m",
    stops: "Nonstop",
    fareClass: "Delta One",
    price: "$4,115",
    priceDetails: {
      baseFare: "$3,984",
      taxesAndFees: "$125",
      serviceFee: "$6",
    },
    aircraft: "Airbus A330-900neo",
    accent: "blue",
    chips: ["Suite 3D", "Chauffeur transfer", "Sky Club access"],
  },
  {
    id: "return-delta-premium",
    carrier: "Delta Air Lines",
    carrierCode: "DL",
    logoSrc: "https://www.gstatic.com/flights/airline_logos/70px/DL.png",
    ranking: "Later nonstop",
    departureTime: "4:10 PM",
    arrivalTime: "7:15 PM",
    origin: "BCN",
    destination: "JFK",
    duration: "9h 05m",
    stops: "Nonstop",
    fareClass: "Premium Select",
    price: "$2,486",
    priceDetails: {
      baseFare: "$2,360",
      taxesAndFees: "$120",
      serviceFee: "$6",
    },
    aircraft: "Airbus A330-300",
    accent: "blue",
    chips: ["Seat 21A", "2 bags", "Priority boarding"],
  },
  {
    id: "return-iberia",
    carrier: "Iberia",
    carrierCode: "IB",
    logoSrc: "https://www.gstatic.com/flights/airline_logos/70px/IB.png",
    ranking: "1 stop",
    departureTime: "1:20 PM",
    arrivalTime: "10:40 PM",
    origin: "BCN",
    destination: "JFK",
    duration: "15h 20m",
    stops: "1 stop",
    fareClass: "Business",
    price: "$3,298",
    priceDetails: {
      baseFare: "$3,154",
      taxesAndFees: "$138",
      serviceFee: "$6",
    },
    aircraft: "Airbus A350-900",
    accent: "red",
    chips: ["MAD connection", "Lounge", "Flexible ticket"],
  },
] as const;

export function parseDisplayAmount(value: string): number {
  const normalized = value.replace(/[^0-9.]/g, "");
  const parsed = Number.parseFloat(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
}

export const bookingDisclaimerLines = [
  "All mandatory fees included in total price",
  "Base prices from travel providers. We may earn commission on hotel bookings.",
] as const;

export const planDetailRows = [
  { label: "Travel Dates", value: "Tue, Jun 23 → Thu, Jul 2" },
  { label: "Travelers", value: "1 adult" },
  { label: "Stay Length", value: "9 nights" },
  { label: "Trip Shape", value: "Delta One + luxury suite" },
] as const;

export const planPreferenceChips = [
  "Delta One",
  "Breakfast",
  "Nonstop",
  "Suite terrace",
] as const;

export const searchFlightOptionRows = [
  { label: "Checked Bags", value: "2" },
  { label: "Meal Preference", value: "Chef tasting" },
  { label: "Extra Baggage", value: "None" },
  { label: "Wi-Fi", value: "Included" },
] as const;

export const searchHotelOptionRows = [
  { label: "Board Type", value: "Breakfast included" },
  { label: "Room Type", value: "Mandarin suite terrace" },
  { label: "Bed Type", value: "1 king bed" },
  { label: "Adults", value: "1 adult" },
] as const;

export const bookingSeatRows = [
  {
    label: "JFK → BCN",
    value: "2A • Suite",
    meta: "Delta One suite with direct aisle access",
  },
  {
    label: "BCN → JFK",
    value: "3D • Suite",
    meta: "Pairs with inbound cabin and lounge access",
  },
] as const;

export const bookingProtectionRows = [
  {
    label: "Travel Protection",
    value: "USD 188.00",
    meta: "Covers delays, cancellations, premium baggage, and missed connections",
  },
  {
    label: "Passenger Protection",
    value: "Selected",
    meta: "Medical coverage and premium baggage interruption enabled",
  },
] as const;

export const bookingSpecialRequestRows = [
  {
    label: "Flight Meal",
    value: "Delta One seasonal menu",
    meta: "Applied to outbound and return segments",
  },
  {
    label: "Hotel Request",
    value: "High floor suite with terrace setup",
    meta: "Shared with Mandarin Oriental Barcelona before check-in",
  },
  {
    label: "Ground Transfer",
    value: "Booked",
    meta: "Mercedes S-Class transfer confirmed both ways",
  },
] as const;

export const recordRows: readonly StatsRecordRow[] = [
  {
    icon: "calendar",
    tone: "#f0c62d",
    label: "Longest Trip",
    value: "49 nights",
    meta: "Trip to Los Angeles • Jan 2020",
  },
  {
    icon: "dollar-sign",
    tone: "#4caf50",
    label: "Most Expensive",
    value: "USD 5.3k",
    meta: "Health Summit New York • Sep 2022",
  },
  {
    icon: "navigation",
    tone: "#ff9800",
    label: "Furthest Distance",
    value: "14.3k miles",
    meta: "Europe Multi-City Tour • Jun 2019",
  },
  {
    icon: "plane",
    tone: "#2196f3",
    label: "Most Flights",
    value: "8 flights",
    meta: "Europe City Loop • Jun 2019",
  },
  {
    icon: "trending-up",
    tone: "#ef5350",
    label: "Busiest Year",
    value: "2019",
    meta: "21 trips • 114 nights",
  },
  {
    icon: "award",
    tone: "#e91e63",
    label: "Favorite Airline",
    value: "Delta Air Lines",
    meta: "63 flights",
  },
  {
    icon: "map-pin",
    tone: "#64b8cd",
    label: "Favorite Destination",
    value: "Los Angeles",
    meta: "65 visits",
  },
] as const;

export const statsActivityRows = [
  {
    label: "Places",
    value: "196",
    meta: "63 of 131 eligible trips scanned",
  },
  {
    label: "Hotels",
    value: "54",
    meta: "Most visited category after other",
  },
  {
    label: "Restaurants",
    value: "20",
    meta: "Top city dining pins across trips",
  },
] as const;

export const statsPatternRows = [
  {
    label: "Other",
    value: "89 visits",
    meta: "89 places detected across mixed categories",
  },
  {
    label: "Hotels",
    value: "98 visits",
    meta: "54 places tracked from hotel stays",
  },
  {
    label: "Restaurants",
    value: "35 visits",
    meta: "20 places tracked from dining and bars",
  },
] as const;

export const statsAirlineRows = [
  {
    label: "Wilshire Luxury Penthouse",
    value: "12 visits",
    meta: "Hotels",
  },
  {
    label: "Aguila de Osa Ecolodge",
    value: "5 visits",
    meta: "Hotels",
  },
  {
    label: "Cecconi's Dumbo",
    value: "4 visits",
    meta: "Restaurants",
  },
] as const;

export const planShowcaseItems = [
  {
    key: "outline",
    orderLabel: "01",
    eyebrow: "Plan",
    title: "Prompt to trip outline",
    meta: "Start with the trip request and watch the flights and hotel shape into one structured draft.",
    minHeight: "31rem",
    mobileMinHeight: "28rem",
  },
  {
    key: "search",
    orderLabel: "02",
    eyebrow: "Search",
    title: "Search results in trip context",
    meta: "Compare real flights and stays without leaving the trip you just built.",
    minHeight: "45rem",
    mobileMinHeight: "37rem",
  },
  {
    key: "booking",
    orderLabel: "03",
    eyebrow: "Book",
    title: "Selected plan ready to book",
    meta: "Review the chosen flights and hotel, expand details, and move into approval without leaving the flow.",
    minHeight: "47rem",
    mobileMinHeight: "39rem",
  },
] as const;

export const reviewShowcaseItems = [
  {
    key: "footprint",
    orderLabel: "01",
    eyebrow: "Review",
    title: "Travel footprint",
    meta: "Global and domestic coverage shown in the same stats flow.",
    minHeight: "31rem",
    mobileMinHeight: "28rem",
  },
  {
    key: "records",
    orderLabel: "02",
    eyebrow: "Review",
    title: "Personal records",
    meta: "Your milestones and repeat patterns, fully visible in one pass.",
    minHeight: "35rem",
    mobileMinHeight: "31rem",
  },
] as const;

export const journeyShowcaseItems = [
  {
    key: "plan",
    chapter: "Plan",
    eyebrow: "Plan",
    title: "Prompt in. Trip shape out.",
    meta: "A plain-language request becomes one structured outline.",
    desktopScrollSpan: "82svh",
    mobileScrollSpan: "68svh",
  },
  {
    key: "search",
    chapter: "Search",
    eyebrow: "Search",
    title: "Real options, still inside the trip.",
    meta: "You compare flights and stays without losing context.",
    desktopScrollSpan: "94svh",
    mobileScrollSpan: "76svh",
  },
  {
    key: "booking",
    chapter: "Book",
    eyebrow: "Book",
    title: "Approve the plan and move.",
    meta: "Details, totals, and booking stay in one approval flow.",
    desktopScrollSpan: "102svh",
    mobileScrollSpan: "84svh",
  },
  {
    key: "stats",
    chapter: "Stats",
    eyebrow: "Stats",
    title: "See the history behind the next trip.",
    meta: "Your travel patterns stay visible after booking.",
    desktopScrollSpan: "176svh",
    mobileScrollSpan: "92svh",
  },
] as const;
