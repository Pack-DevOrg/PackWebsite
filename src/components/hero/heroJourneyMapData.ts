import {geoAlbersUsa, geoMercator, geoPath} from "d3-geo";
import {feature} from "topojson-client";
import {
  getCountryCatalogEntryByCode,
  getCountryCatalogEntryById,
  getCountryIdByCode,
} from "@doneai/schemas/locality-catalog";
import usNationTopology from "us-atlas/nation-10m.json";
import usStatesTopology from "us-atlas/states-10m.json";
import worldTopology from "world-atlas/countries-110m.json";

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
    const id = getCountryIdByCode(code);
    return id ? [id, String(Number(id))] : [];
  }),
);

export const visitedCountryNames = new Set(
  visitedCountryCodes.flatMap((code) => {
    const name = getCountryCatalogEntryByCode(code)?.name;
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
      name: topologyName || getCountryCatalogEntryById(id)?.name || "",
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
