declare module "airports-json" {
  type AirportsJsonAirport = {
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

  const content: {
    readonly airports?: readonly AirportsJsonAirport[];
  };

  export default content;
}
