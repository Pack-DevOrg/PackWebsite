import airportsJson from "airports-json";

type RawAirport = {
  readonly iata_code?: string;
  readonly type?: string;
  readonly name?: string;
  readonly municipality?: string;
  readonly continent?: string;
  readonly iso_country?: string;
  readonly iso_region?: string;
  readonly latitude_deg?: number | string;
  readonly longitude_deg?: number | string;
  readonly scheduled_service?: string;
};

export type AirportCatalogEntry = {
  readonly iata: string;
  readonly name: string;
  readonly cityName: string | null;
  readonly countryCode: string | null;
  readonly regionCode: string | null;
  readonly regionName: string | null;
  readonly latitude: number;
  readonly longitude: number;
};

export type CountryCatalogEntry = {
  readonly code: string;
  readonly name: string;
  readonly continentCode: string | null;
};

const US_REGION_NAMES: Record<string, string> = {
  AK: "Alaska",
  AL: "Alabama",
  AR: "Arkansas",
  AZ: "Arizona",
  CA: "California",
  CO: "Colorado",
  CT: "Connecticut",
  DC: "District of Columbia",
  DE: "Delaware",
  FL: "Florida",
  GA: "Georgia",
  HI: "Hawaii",
  IA: "Iowa",
  ID: "Idaho",
  IL: "Illinois",
  IN: "Indiana",
  KS: "Kansas",
  KY: "Kentucky",
  LA: "Louisiana",
  MA: "Massachusetts",
  MD: "Maryland",
  ME: "Maine",
  MI: "Michigan",
  MN: "Minnesota",
  MO: "Missouri",
  MS: "Mississippi",
  MT: "Montana",
  NC: "North Carolina",
  ND: "North Dakota",
  NE: "Nebraska",
  NH: "New Hampshire",
  NJ: "New Jersey",
  NM: "New Mexico",
  NV: "Nevada",
  NY: "New York",
  OH: "Ohio",
  OK: "Oklahoma",
  OR: "Oregon",
  PA: "Pennsylvania",
  PR: "Puerto Rico",
  RI: "Rhode Island",
  SC: "South Carolina",
  SD: "South Dakota",
  TN: "Tennessee",
  TX: "Texas",
  UT: "Utah",
  VA: "Virginia",
  VT: "Vermont",
  WA: "Washington",
  WI: "Wisconsin",
  WV: "West Virginia",
  WY: "Wyoming",
};

const normalizeCode = (value?: string | null): string | null => {
  if (typeof value !== "string") {
    return null;
  }
  const trimmed = value.trim().toUpperCase();
  return trimmed.length > 0 ? trimmed : null;
};

const normalizeAliasKey = (value?: string | null): string => {
  return (value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
};

const parseCoordinate = (value?: number | string): number | null => {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === "string") {
    const parsed = Number.parseFloat(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
};

const getAirportPriority = (airport: RawAirport): number => {
  const typeScore =
    airport.type === "large_airport"
      ? 30
      : airport.type === "medium_airport"
        ? 20
        : airport.type === "small_airport"
          ? 10
          : 0;
  const serviceScore = airport.scheduled_service === "yes" ? 5 : 0;
  return typeScore + serviceScore;
};

const getRegionName = (regionCode: string | null): string | null => {
  if (!regionCode) {
    return null;
  }
  const [countryCode, subdivisionCode] = regionCode.split("-");
  if (countryCode === "US" && subdivisionCode) {
    return US_REGION_NAMES[subdivisionCode] ?? subdivisionCode;
  }
  return subdivisionCode ?? regionCode;
};

const countryDisplayNames = new Intl.DisplayNames(["en"], {type: "region"});

const airportMap = (() => {
  const map = new Map<string, AirportCatalogEntry>();
  const priorityByIata = new Map<string, number>();
  const airports = (airportsJson.airports ?? []) as readonly RawAirport[];

  airports.forEach((airport) => {
    const iata = normalizeCode(airport.iata_code);
    const latitude = parseCoordinate(airport.latitude_deg);
    const longitude = parseCoordinate(airport.longitude_deg);

    if (!iata || latitude == null || longitude == null) {
      return;
    }

    const regionCode = normalizeCode(airport.iso_region);
    const nextEntry: AirportCatalogEntry = {
      iata,
      name: airport.name?.trim() || iata,
      cityName: airport.municipality?.trim() || null,
      countryCode: normalizeCode(airport.iso_country),
      regionCode,
      regionName: getRegionName(regionCode),
      latitude,
      longitude,
    };

    const nextPriority = getAirportPriority(airport);
    const existingPriority = priorityByIata.get(iata) ?? Number.NEGATIVE_INFINITY;
    if (!map.has(iata) || nextPriority >= existingPriority) {
      map.set(iata, nextEntry);
      priorityByIata.set(iata, nextPriority);
    }
  });

  return map;
})();

const countryMap = (() => {
  const map = new Map<string, CountryCatalogEntry>();
  const airports = (airportsJson.airports ?? []) as readonly RawAirport[];

  airports.forEach((airport) => {
    const countryCode = normalizeCode(airport.iso_country);
    if (!countryCode || map.has(countryCode)) {
      return;
    }

    map.set(countryCode, {
      code: countryCode,
      name: countryDisplayNames.of(countryCode) ?? countryCode,
      continentCode: normalizeCode(airport.continent),
    });
  });

  return map;
})();

const COUNTRY_ALIASES: Record<string, string> = {
  equador: "EC",
  ecuador: "EC",
  peru: "PE",
  uk: "GB",
  unitedkingdom: "GB",
  usa: "US",
  unitedstates: "US",
  unitedstatesofamerica: "US",
};

const countryCodeByAlias = (() => {
  const map = new Map<string, string>();

  countryMap.forEach((country) => {
    map.set(normalizeAliasKey(country.name), country.code);
  });

  Object.entries(COUNTRY_ALIASES).forEach(([alias, code]) => {
    map.set(alias, code);
  });

  return map;
})();

export const getAirportByIata = (iataCode?: string | null): AirportCatalogEntry | null => {
  const normalized = normalizeCode(iataCode);
  if (!normalized) {
    return null;
  }
  return airportMap.get(normalized) ?? null;
};

export const getCountryEntryByCode = (
  countryCode?: string | null
): CountryCatalogEntry | null => {
  const normalized = normalizeCode(countryCode);
  if (!normalized) {
    return null;
  }
  return countryMap.get(normalized) ?? null;
};

export const getCountryNameByCode = (countryCode?: string | null): string | null => {
  return getCountryEntryByCode(countryCode)?.name ?? null;
};

export const resolveCountryEntry = (
  value?: string | null
): CountryCatalogEntry | null => {
  const normalizedCode = normalizeCode(value);
  if (normalizedCode && countryMap.has(normalizedCode)) {
    return countryMap.get(normalizedCode) ?? null;
  }

  const alias = normalizeAliasKey(value);
  if (!alias) {
    return null;
  }

  const resolvedCode = countryCodeByAlias.get(alias);
  if (!resolvedCode) {
    return null;
  }

  return countryMap.get(resolvedCode) ?? null;
};
