declare module "airports-json" {
interface AirportJsonRecord {
  readonly iata_code?: string;
  readonly municipality?: string;
  readonly name?: string;
  readonly iso_region?: string;
  readonly iso_country?: string;
}

interface RegionJsonRecord {
  readonly code?: string;
  readonly name?: string;
}

interface CountryJsonRecord {
  readonly code?: string;
  readonly name?: string;
}

interface AirportsJsonModule {
  readonly airports: AirportJsonRecord[];
  readonly regions: RegionJsonRecord[];
  readonly countries: CountryJsonRecord[];
}

const airportsJson: AirportsJsonModule;
export default airportsJson;
}
