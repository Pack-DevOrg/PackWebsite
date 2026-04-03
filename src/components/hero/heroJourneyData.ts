import {geoAlbersUsa, geoMercator, geoPath} from "d3-geo";
import {feature} from "topojson-client";
import countriesDataset from "airports-json/data/countries.json";
import usNationTopology from "us-atlas/nation-10m.json";
import usStatesTopology from "us-atlas/states-10m.json";
import worldTopology from "world-atlas/countries-110m.json";

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

export const WORLD_MAP_DIMENSIONS = {width: 960, height: 500} as const;
export const US_MAP_DIMENSIONS = {width: 975, height: 610} as const;
export const MAP_STYLE = {
  baseFill: "rgba(118, 118, 118, 0.22)",
  highlightFill: "#ffd54a",
  stroke: "rgba(210, 210, 210, 0.62)",
  strokeWidth: 0.5,
  dotColor: "#d62d43",
  dotStrokeColor: "#2b2b2d",
  dotStrokeWidth: 0.75,
} as const;

const countryRecords = countriesDataset as Array<Record<string, unknown>>;

const COUNTRY_ID_BY_CODE = new Map(
  countryRecords.flatMap((country) => {
    const code =
      typeof country.code === "string" ? country.code.trim().toUpperCase() : "";
    const id =
      typeof country.id === "string" || typeof country.id === "number"
        ? String(country.id)
        : "";
    return code && id ? [[code, id] as const] : [];
  }),
);

const COUNTRY_NAME_BY_CODE = new Map(
  countryRecords.flatMap((country) => {
    const code =
      typeof country.code === "string" ? country.code.trim().toUpperCase() : "";
    const name =
      typeof country.name === "string" ? country.name.trim() : "";
    return code && name ? [[code, name] as const] : [];
  }),
);

const COUNTRY_NAME_BY_ID = new Map(
  countryRecords.flatMap((country) => {
    const id =
      typeof country.id === "string" || typeof country.id === "number"
        ? String(country.id)
        : "";
    const name =
      typeof country.name === "string" ? country.name.trim() : "";
    return id && name ? [[id, name] as const] : [];
  }),
);

const COUNTRY_NAME_ALIASES: Record<string, readonly string[]> = {
  US: ["United States of America", "United States", "USA"],
};

const visitedCountryCodes = [
  "US",
  "MX",
  "BR",
  "GB",
  "FR",
  "ES",
  "IT",
  "DE",
  "NL",
  "PT",
  "AE",
  "IN",
  "JP",
  "SG",
  "TH",
  "AU",
  "NZ",
] as const;

export const visitedCountryIds = new Set(
  visitedCountryCodes.flatMap((code) => {
    const id = COUNTRY_ID_BY_CODE.get(code);
    return id ? [id, String(Number(id))] : [];
  }),
);

export const visitedCountryNames = new Set(
  visitedCountryCodes.flatMap((code) => {
    const name = COUNTRY_NAME_BY_CODE.get(code);
    return name ? [name, ...(COUNTRY_NAME_ALIASES[code] ?? [])] : COUNTRY_NAME_ALIASES[code] ?? [];
  }),
);

const US_STATE_FIPS: Record<string, string> = {
  AL: "01",
  AK: "02",
  AZ: "04",
  AR: "05",
  CA: "06",
  CO: "08",
  CT: "09",
  DE: "10",
  DC: "11",
  FL: "12",
  GA: "13",
  HI: "15",
  ID: "16",
  IL: "17",
  IN: "18",
  IA: "19",
  KS: "20",
  KY: "21",
  LA: "22",
  ME: "23",
  MD: "24",
  MA: "25",
  MI: "26",
  MN: "27",
  MS: "28",
  MO: "29",
  MT: "30",
  NE: "31",
  NV: "32",
  NH: "33",
  NJ: "34",
  NM: "35",
  NY: "36",
  NC: "37",
  ND: "38",
  OH: "39",
  OK: "40",
  OR: "41",
  PA: "42",
  RI: "44",
  SC: "45",
  SD: "46",
  TN: "47",
  TX: "48",
  UT: "49",
  VT: "50",
  VA: "51",
  WA: "53",
  WV: "54",
  WI: "55",
  WY: "56",
  PR: "72",
};

export const visitedUsStateIds = new Set(
  [
    "CA",
    "WA",
    "OR",
    "AZ",
    "NV",
    "UT",
    "CO",
    "TX",
    "MN",
    "IL",
    "TN",
    "GA",
    "FL",
    "VA",
    "NC",
    "SC",
    "NY",
    "MA",
    "PA",
    "NJ",
    "OH",
    "MI",
    "LA",
    "MO",
    "AK",
    "HI",
  ].flatMap((state) => {
    const fips = US_STATE_FIPS[state];
    return fips ? [fips, String(Number(fips))] : [];
  }),
);

const worldCityPoints = [
  {id: "san-francisco", latitude: 37.7749, longitude: -122.4194, visits: 6},
  {id: "los-angeles", latitude: 34.0522, longitude: -118.2437, visits: 5},
  {id: "new-york", latitude: 40.7128, longitude: -74.006, visits: 9},
  {id: "anchorage-world", latitude: 61.2181, longitude: -149.9003, visits: 1},
  {id: "honolulu-world", latitude: 21.3099, longitude: -157.8581, visits: 1},
  {id: "mexico-city", latitude: 19.4326, longitude: -99.1332, visits: 3},
  {id: "sao-paulo", latitude: -23.5505, longitude: -46.6333, visits: 2},
  {id: "london", latitude: 51.5072, longitude: -0.1276, visits: 8},
  {id: "paris", latitude: 48.8566, longitude: 2.3522, visits: 6},
  {id: "amsterdam", latitude: 52.3676, longitude: 4.9041, visits: 3},
  {id: "berlin", latitude: 52.52, longitude: 13.405, visits: 3},
  {id: "madrid", latitude: 40.4168, longitude: -3.7038, visits: 2},
  {id: "rome", latitude: 41.9028, longitude: 12.4964, visits: 2},
  {id: "dubai", latitude: 25.2048, longitude: 55.2708, visits: 4},
  {id: "mumbai", latitude: 19.076, longitude: 72.8777, visits: 2},
  {id: "bangkok", latitude: 13.7563, longitude: 100.5018, visits: 2},
  {id: "singapore", latitude: 1.3521, longitude: 103.8198, visits: 5},
  {id: "tokyo", latitude: 35.6762, longitude: 139.6503, visits: 7},
  {id: "sydney", latitude: -33.8688, longitude: 151.2093, visits: 2},
  {id: "auckland", latitude: -36.8509, longitude: 174.7645, visits: 1},
] as const;

const usCityPoints = [
  {id: "seattle", latitude: 47.6062, longitude: -122.3321, visits: 4},
  {id: "portland", latitude: 45.5152, longitude: -122.6784, visits: 3},
  {id: "san-francisco-us", latitude: 37.7749, longitude: -122.4194, visits: 7},
  {id: "san-jose", latitude: 37.3382, longitude: -121.8863, visits: 4},
  {id: "los-angeles-us", latitude: 34.0522, longitude: -118.2437, visits: 6},
  {id: "san-diego", latitude: 32.7157, longitude: -117.1611, visits: 4},
  {id: "las-vegas", latitude: 36.1699, longitude: -115.1398, visits: 5},
  {id: "phoenix", latitude: 33.4484, longitude: -112.074, visits: 3},
  {id: "salt-lake-city", latitude: 40.7608, longitude: -111.891, visits: 2},
  {id: "denver", latitude: 39.7392, longitude: -104.9903, visits: 5},
  {id: "dallas", latitude: 32.7767, longitude: -96.797, visits: 6},
  {id: "austin", latitude: 30.2672, longitude: -97.7431, visits: 3},
  {id: "houston", latitude: 29.7604, longitude: -95.3698, visits: 5},
  {id: "minneapolis", latitude: 44.9778, longitude: -93.265, visits: 3},
  {id: "chicago", latitude: 41.8781, longitude: -87.6298, visits: 6},
  {id: "detroit", latitude: 42.3314, longitude: -83.0458, visits: 2},
  {id: "nashville", latitude: 36.1627, longitude: -86.7816, visits: 4},
  {id: "atlanta", latitude: 33.749, longitude: -84.388, visits: 7},
  {id: "miami", latitude: 25.7617, longitude: -80.1918, visits: 5},
  {id: "orlando", latitude: 28.5383, longitude: -81.3792, visits: 2},
  {id: "charlotte", latitude: 35.2271, longitude: -80.8431, visits: 3},
  {id: "raleigh", latitude: 35.7796, longitude: -78.6382, visits: 2},
  {id: "dc", latitude: 38.9072, longitude: -77.0369, visits: 4},
  {id: "philly", latitude: 39.9526, longitude: -75.1652, visits: 3},
  {id: "new-york-us", latitude: 40.7128, longitude: -74.006, visits: 8},
  {id: "boston", latitude: 42.3601, longitude: -71.0589, visits: 4},
  {id: "pittsburgh", latitude: 40.4406, longitude: -79.9959, visits: 2},
  {id: "cleveland", latitude: 41.4993, longitude: -81.6944, visits: 2},
  {id: "new-orleans", latitude: 29.9511, longitude: -90.0715, visits: 2},
  {id: "st-louis", latitude: 38.627, longitude: -90.1994, visits: 2},
  {id: "anchorage", latitude: 61.2181, longitude: -149.9003, visits: 1},
  {id: "honolulu", latitude: 21.3099, longitude: -157.8581, visits: 1},
] as const;

const worldFeatures = (() => {
  const topology = worldTopology as any;
  const collection = feature(topology, topology.objects.countries) as any;
  return collection.features as Array<{
    id?: string | number;
    geometry: unknown;
    properties?: {name?: string};
  }>;
})();

const usStateFeatures = (() => {
  const topology = usStatesTopology as any;
  const collection = feature(topology, topology.objects.states) as any;
  return collection.features as Array<{id?: string | number; geometry: unknown}>;
})();

const usNationFeature = (() => {
  const topology = usNationTopology as any;
  const extracted = feature(topology, topology.objects.nation) as any;
  return extracted.type === "FeatureCollection" ? extracted.features[0] : extracted;
})();

const worldProjection = (() => {
  const projection = geoMercator().fitSize(
    [WORLD_MAP_DIMENSIONS.width, WORLD_MAP_DIMENSIONS.height],
    {type: "Sphere"} as any,
  );
  const scale = projection.scale();
  if (typeof scale === "number" && Number.isFinite(scale)) {
    projection.scale(scale * 1.7);
  }
  return projection;
})();

const usProjection = geoAlbersUsa().fitSize(
  [US_MAP_DIMENSIONS.width, US_MAP_DIMENSIONS.height],
  usNationFeature as any,
);

const worldPathGenerator = geoPath(worldProjection);
const usPathGenerator = geoPath(usProjection);

export const worldPathData = worldFeatures
  .map((featureData, index) => {
    const d = worldPathGenerator(featureData as any);
    if (!d) return null;
    const id = featureData.id ? String(featureData.id) : `world-${index}`;
    const topologyName =
      typeof featureData.properties?.name === "string"
        ? featureData.properties.name
        : "";
    return {
      id,
      name: topologyName || COUNTRY_NAME_BY_ID.get(id) || "",
      d,
    };
  })
  .filter((value): value is {id: string; name: string; d: string} => Boolean(value));

export const usPathData = usStateFeatures
  .map((featureData, index) => {
    const d = usPathGenerator(featureData as any);
    if (!d) return null;
    return {
      id: featureData.id ? String(featureData.id) : `state-${index}`,
      d,
    };
  })
  .filter((value): value is {id: string; d: string} => Boolean(value));

export const usNationPath = usNationFeature ? usPathGenerator(usNationFeature as any) ?? "" : "";

export const worldProjectedPoints = worldCityPoints
  .map((point) => {
    const projected = worldProjection([point.longitude, point.latitude]);
    if (!projected) return null;
    return {...point, x: projected[0], y: projected[1]};
  })
  .filter(
    (
      point,
    ): point is (typeof worldCityPoints)[number] & {x: number; y: number} =>
      Boolean(point),
  );

export const usProjectedPoints = usCityPoints
  .map((point) => {
    const projected = usProjection([point.longitude, point.latitude]);
    if (!projected) return null;
    return {...point, x: projected[0], y: projected[1]};
  })
  .filter(
    (
      point,
    ): point is (typeof usCityPoints)[number] & {x: number; y: number} =>
      Boolean(point),
  );

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
