import board from "@/content/tsaBoardAirports.json";

type TsaBoardAirport = {
  readonly airportCode: string;
  readonly airportName: string;
  readonly cityName: string;
  readonly countryCode?: string;
  readonly officialUrl?: string;
};

const TSA_BOARD_GENERATED_AT = board.generatedAt;

const citySlug = (value: string): string =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

const rawAirportRows: readonly (readonly string[])[] = board.airports;

const airports: readonly TsaBoardAirport[] = rawAirportRows.map((row) => {
  const airportCode = (row[0] ? row[0] : "").toUpperCase();
  const airportName = row[1] ? row[1] : airportCode;
  const cityName = row[2] ? row[2] : "";
  const countryCode = (row[3] ? row[3] : "").toUpperCase();
  const officialUrl = row[4] ? row[4] : "";
  return {
    airportCode,
    airportName,
    cityName,
    ...(countryCode.length === 2 ? { countryCode } : {}),
    ...(officialUrl.length > 0 ? { officialUrl } : {}),
  };
});

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

function tsaAirportCanonicalPath(iata: string): string {
  return `/tsa/${iata.toLowerCase()}`;
}

type TsaAirportResolution =
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
