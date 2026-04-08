import type { Trip } from "@/api/trips";

const resolveAirlineLogoModules = (): Record<string, string> => {
  try {
    const loadGlob = new Function(
      'return typeof import.meta !== "undefined" && import.meta.glob ? import.meta.glob : undefined;',
    ) as () =>
      | ((
          pattern: string,
          options: { eager: boolean; import: string }
        ) => Record<string, string>)
      | undefined;

    const glob = loadGlob();
    if (!glob) {
      return {};
    }

    return glob(
      "../../../PackAesthetics/assets/airlines-shared/*.png",
      {
        eager: true,
        import: "default",
      }
    );
  } catch {
    return {};
  }
};

const airlineLogoModules = resolveAirlineLogoModules();

const AIRLINE_LOGOS = Object.entries(airlineLogoModules).reduce<Record<string, string>>(
  (logos, [modulePath, src]) => {
    const match = modulePath.match(/\/([A-Z0-9]{2,3})\.png$/i);
    if (match) {
      logos[match[1].toUpperCase()] = src;
    }
    return logos;
  },
  {}
);

const buildGstaticLogoUrl = (code: string): string =>
  `https://www.gstatic.com/flights/airline_logos/70px/${encodeURIComponent(code)}.png`;

const AIRLINE_CODE_TO_NAME: Record<string, string> = {
  "3M": "Silver Airways",
  AA: "American Airlines",
  AC: "Air Canada",
  AF: "Air France",
  AI: "Air India",
  AK: "AirAsia",
  AM: "Aeromexico",
  AS: "Alaska Airlines",
  AV: "Avianca",
  B6: "JetBlue Airways",
  BA: "British Airways",
  CA: "Air China",
  CM: "Copa Airlines",
  CX: "Cathay Pacific",
  CZ: "China Southern Airlines",
  DL: "Delta Air Lines",
  EK: "Emirates",
  ET: "Ethiopian Airlines",
  EY: "Etihad Airways",
  F9: "Frontier Airlines",
  FR: "Ryanair",
  G4: "Allegiant Air",
  IB: "Iberia",
  JL: "Japan Airlines",
  JT: "Lion Air",
  JU: "Air Serbia",
  KE: "Korean Air",
  KL: "KLM Royal Dutch Airlines",
  LA: "LATAM Airlines",
  LH: "Lufthansa",
  LO: "LOT Polish Airlines",
  MU: "China Eastern Airlines",
  NH: "All Nippon Airways",
  NK: "Spirit Airlines",
  OO: "SkyWest Airlines",
  PC: "Pegasus Airlines",
  QP: "Akasa Air",
  QR: "Qatar Airways",
  QX: "Horizon Air",
  S7: "S7 Airlines",
  SQ: "Singapore Airlines",
  SY: "Sun Country Airlines",
  TG: "Thai Airways",
  TK: "Turkish Airlines",
  TS: "Air Transat",
  U2: "easyJet",
  UA: "United Airlines",
  W6: "Wizz Air",
  WN: "Southwest Airlines",
  WS: "WestJet",
  YX: "Republic Airways",
};

const AIRLINE_NAME_TO_CODE = Object.entries(AIRLINE_CODE_TO_NAME).reduce<Record<string, string>>(
  (lookup, [code, name]) => {
    lookup[normalizeAirlineName(name)] = code;
    return lookup;
  },
  {}
);

AIRLINE_NAME_TO_CODE[normalizeAirlineName("Delta")] = "DL";
AIRLINE_NAME_TO_CODE[normalizeAirlineName("American")] = "AA";
AIRLINE_NAME_TO_CODE[normalizeAirlineName("United")] = "UA";
AIRLINE_NAME_TO_CODE[normalizeAirlineName("Southwest")] = "WN";
AIRLINE_NAME_TO_CODE[normalizeAirlineName("JetBlue")] = "B6";
AIRLINE_NAME_TO_CODE[normalizeAirlineName("Alaska")] = "AS";
AIRLINE_NAME_TO_CODE[normalizeAirlineName("Spirit")] = "NK";
AIRLINE_NAME_TO_CODE[normalizeAirlineName("Frontier")] = "F9";
AIRLINE_NAME_TO_CODE[normalizeAirlineName("Allegiant")] = "G4";
AIRLINE_NAME_TO_CODE[normalizeAirlineName("KLM")] = "KL";
AIRLINE_NAME_TO_CODE[normalizeAirlineName("LATAM")] = "LA";

type TripFlight = NonNullable<Trip["flights"]>[number];

export interface TripAirlineBadge {
  readonly key: string;
  readonly code: string;
  readonly label: string;
  readonly logoSrc?: string;
  readonly monogram: string;
}

function normalizeAirlineName(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^\w\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function toMonogram(value: string): string {
  const compact = value.replace(/[^A-Za-z0-9]/g, "");
  if (compact.length >= 2) {
    return compact.slice(0, 2).toUpperCase();
  }
  const initials = value
    .split(/\s+/)
    .map((part) => part.charAt(0))
    .join("");
  return initials.slice(0, 2).toUpperCase() || "AI";
}

function normalizeCode(value?: string | null): string | null {
  if (typeof value !== "string") {
    return null;
  }
  const normalized = value.trim().toUpperCase();
  if (!/^[A-Z0-9]{2,3}$/.test(normalized)) {
    return null;
  }
  return normalized;
}

function extractFlightNumberCode(value?: string | null): string | null {
  if (typeof value !== "string") {
    return null;
  }
  const match = value.trim().match(/^([A-Za-z0-9]{2,3})/);
  return match ? normalizeCode(match[1]) : null;
}

function resolveCodeFromName(value?: string | null): string | null {
  if (typeof value !== "string" || !value.trim()) {
    return null;
  }
  return AIRLINE_NAME_TO_CODE[normalizeAirlineName(value)] ?? null;
}

function extractAirlineCode(flight?: TripFlight | null): string | null {
  if (!flight) {
    return null;
  }

  return (
    normalizeCode((flight as TripFlight & { marketingCarrier?: string }).marketingCarrier) ??
    normalizeCode((flight as TripFlight & { operatingCarrier?: string }).operatingCarrier) ??
    normalizeCode(flight.airlineCode) ??
    normalizeCode(flight.carrierCode) ??
    extractFlightNumberCode(flight.flightNumber) ??
    resolveCodeFromName(flight.airline) ??
    resolveCodeFromName((flight as TripFlight & { operatedBy?: string }).operatedBy)
  );
}

function resolveAirlineLabel(flight: TripFlight, code: string): string {
  if (typeof flight.airline === "string" && flight.airline.trim()) {
    return flight.airline.trim();
  }
  return AIRLINE_CODE_TO_NAME[code] ?? code;
}

export function getTripAirlineBadges(trip: Trip, maxBadges = 3): TripAirlineBadge[] {
  const badges: TripAirlineBadge[] = [];
  const seen = new Set<string>();

  for (const flight of trip.flights ?? []) {
    if (!flight || badges.length >= maxBadges) {
      continue;
    }

    const code = extractAirlineCode(flight);
    if (!code || seen.has(code)) {
      continue;
    }

    const label = resolveAirlineLabel(flight, code);
    badges.push({
      key: code,
      code,
      label,
      logoSrc: AIRLINE_LOGOS[code] ?? buildGstaticLogoUrl(code),
      monogram: toMonogram(code),
    });
    seen.add(code);
  }

  return badges;
}
