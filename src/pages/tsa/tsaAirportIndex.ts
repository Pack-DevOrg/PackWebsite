import board from "@/content/tsaBoardAirports.json";

export type TsaBoardAirport = {
  readonly airportCode: string;
  readonly airportName: string;
  readonly cityName: string;
};

type BoardFile = {
  readonly generatedAt: string;
  readonly airports: readonly (readonly [string, string, string])[];
};

const boardFile = board as BoardFile;

export const TSA_BOARD_GENERATED_AT = boardFile.generatedAt;

const citySlug = (value: string): string =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

const airports: readonly TsaBoardAirport[] = boardFile.airports.map(
  ([airportCode, airportName, cityName]) => ({
    airportCode: airportCode.toUpperCase(),
    airportName,
    cityName,
  }),
);

const byCode = new Map<string, TsaBoardAirport>();
const cityOwners = new Map<string, string[]>();

for (const airport of airports) {
  byCode.set(airport.airportCode.toLowerCase(), airport);
  const slug = citySlug(airport.cityName);
  if (!slug) {
    continue;
  }
  const owners = cityOwners.get(slug) ?? [];
  owners.push(airport.airportCode.toLowerCase());
  cityOwners.set(slug, owners);
}

const byNameAlias = new Map<string, string>();
for (const [slug, owners] of cityOwners) {
  if (owners.length === 1 && owners[0]) {
    byNameAlias.set(`${slug}-airport`, owners[0]);
  }
}

export function listTsaBoardAirports(): readonly TsaBoardAirport[] {
  return airports;
}

export function tsaAirportCanonicalPath(iata: string): string {
  return `/tsa/${iata.toLowerCase()}`;
}

export type TsaAirportResolution =
  | { readonly kind: "page"; readonly airport: TsaBoardAirport; readonly canonicalPath: string }
  | { readonly kind: "unknown" };

export function resolveTsaAirportSlug(rawSlug: string): TsaAirportResolution {
  const slug = rawSlug.trim().toLowerCase();
  const direct = byCode.get(slug);
  if (direct) {
    return {
      kind: "page",
      airport: direct,
      canonicalPath: tsaAirportCanonicalPath(direct.airportCode),
    };
  }
  const iataAlias = /^([a-z0-9]{3})-airport$/.exec(slug);
  const fromIataAlias = iataAlias ? byCode.get(iataAlias[1] ?? "") : undefined;
  if (fromIataAlias) {
    return {
      kind: "page",
      airport: fromIataAlias,
      canonicalPath: tsaAirportCanonicalPath(fromIataAlias.airportCode),
    };
  }
  const fromCity = byCode.get(byNameAlias.get(slug) ?? "");
  if (fromCity) {
    return {
      kind: "page",
      airport: fromCity,
      canonicalPath: tsaAirportCanonicalPath(fromCity.airportCode),
    };
  }
  return { kind: "unknown" };
}

export function tsaAirportSitemapLocs(): readonly { loc: string; lastmod: string }[] {
  return airports.map((airport) => ({
    loc: `https://www.trypackai.com/tsa/${airport.airportCode.toLowerCase()}`,
    lastmod: TSA_BOARD_GENERATED_AT,
  }));
}
