import {
  normalizeAirportWaitObservation,
  type AirportWaitTimeObservation,
  type AirportWaitTimePublicAirport,
  type FaaAirportStatus,
  type HeldFlight,
} from "@/schemas/airport-security";

export const TSA_AIRPORT_H2S = [
  "Security wait times by checkpoint",
  "Delays today",
  "Ground stop and ground delay status",
  "Flights delayed or cancelled today",
  "Flight status",
] as const;

const INTERNATIONAL_AIRPORT_H2S = [
  "Airport security wait times by checkpoint",
  "Delays today",
  "Airspace and delay status",
  "Flights delayed or cancelled today",
  "Flight status",
] as const;

const CIVIL_AVIATION_AUTHORITY_BY_ISO_COUNTRY: Readonly<Record<string, string>> = {
  US: "FAA",
  CA: "NAV CANADA and CATSA",
  GB: "UK CAA and NATS",
  DE: "DFS and Luftfahrt-Bundesamt",
  FR: "DGAC",
  CH: "FOCA and Skyguide",
  JP: "JCAB",
  AU: "Airservices Australia",
  NZ: "Airways New Zealand and CAA NZ",
  SG: "CAAS",
  HK: "HKCAD",
  KR: "MOLIT",
  AE: "GCAA",
  QA: "QCAA",
  MX: "AFAC",
  BR: "ANAC and DECEA",
};

const EUROCONTROL_ISO_COUNTRY_CODES: ReadonlySet<string> = new Set([
  "AT",
  "BE",
  "BG",
  "CY",
  "CZ",
  "DK",
  "EE",
  "ES",
  "FI",
  "GR",
  "HR",
  "HU",
  "IE",
  "IS",
  "IT",
  "LT",
  "LU",
  "LV",
  "MT",
  "NL",
  "NO",
  "PL",
  "PT",
  "RO",
  "SE",
  "SI",
  "SK",
]);

function normalizeIsoAlpha2(raw: string | null | undefined): string {
  if (typeof raw !== "string") {
    return "";
  }
  const trimmed = raw.trim().toUpperCase();
  if (trimmed.length !== 2) {
    return "";
  }
  const first = trimmed.charCodeAt(0);
  const second = trimmed.charCodeAt(1);
  const isUpperAscii =
    first >= 65 && first <= 90 && second >= 65 && second <= 90;
  return isUpperAscii ? trimmed : "";
}

function normalizeHttpUrl(raw: string | undefined): string {
  if (typeof raw !== "string") {
    return "";
  }
  const trimmed = raw.trim();
  if (
    trimmed.startsWith("https://") ||
    trimmed.startsWith("http://")
  ) {
    return trimmed;
  }
  return "";
}

export function resolveAirportCountryCode(
  apiCountryCode: string | undefined,
  catalogCountryCode: string | undefined,
): string {
  const fromApi = normalizeIsoAlpha2(apiCountryCode);
  if (fromApi.length === 2) {
    return fromApi;
  }
  return normalizeIsoAlpha2(catalogCountryCode);
}

export function resolveOfficialAirportUrl(
  apiOfficialUrl: string | undefined,
  catalogOfficialUrl: string | undefined,
): string {
  const fromApi = normalizeHttpUrl(apiOfficialUrl);
  if (fromApi.length > 0) {
    return fromApi;
  }
  return normalizeHttpUrl(catalogOfficialUrl);
}

function resolveFlightAuthorityLabel(countryCode: string): string {
  const iso = normalizeIsoAlpha2(countryCode);
  const direct = iso.length === 2
    ? CIVIL_AVIATION_AUTHORITY_BY_ISO_COUNTRY[iso]
    : undefined;
  if (direct) {
    return direct;
  }
  if (iso.length === 2 && EUROCONTROL_ISO_COUNTRY_CODES.has(iso)) {
    return "EUROCONTROL and national aviation authority";
  }
  return "the local civil aviation authority";
}

export function airportSectionHeadings(
  countryCode: string,
): readonly [string, string, string, string, string] {
  return countryCode === "US" ? TSA_AIRPORT_H2S : INTERNATIONAL_AIRPORT_H2S;
}

export function airportPageTitle(
  airportName: string,
  iata: string,
  countryCode: string,
): string {
  if (countryCode === "US") {
    return `${airportName} (${iata}) TSA Wait Times, Delays & Ground Stop Status`;
  }
  return `${airportName} (${iata}) Airport Security Wait Times & Flight Status`;
}

export function airportPageH1(airportName: string, countryCode: string): string {
  if (countryCode === "US") {
    return `${airportName} TSA wait times and delays right now`;
  }
  return `Airport security wait times at ${airportName}`;
}

export function airportPageDescription(
  airportName: string,
  iata: string,
  countryCode: string,
): string {
  if (countryCode === "US") {
    const full = `Live TSA wait times, delays, and FAA ground stop status for ${airportName} (${iata}).`;
    if (full.length >= 60 && full.length <= 165) {
      return full;
    }
    return `Live TSA wait times, delays, and FAA ground stop status for ${iata}.`;
  }
  const full = `Airport security wait times and official flight status links for ${airportName} (${iata}).`;
  if (full.length >= 60 && full.length <= 165) {
    return full;
  }
  return `Airport security wait times and official flight status links for ${iata}.`;
}

export function airportBackLinkLabel(countryCode: string): string {
  return countryCode === "US"
    ? "All airport TSA wait times"
    : "All airport security wait times";
}

export function formatFaaEnd(endsAt: string, timeZone: string | undefined): string {
  const timestamp = Date.parse(endsAt);
  if (!Number.isFinite(timestamp)) {
    return endsAt;
  }
  const formatted = new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    timeZone: timeZone && timeZone.length > 0 ? timeZone : "America/New_York",
    timeZoneName: "short",
  }).format(new Date(timestamp));
  return formatted.replace(/\u202f/g, " ").replace(/\b(AM|PM)\b/, (meridiem) =>
    meridiem.toLowerCase(),
  );
}

export function readFaaStatus(
  airport: Pick<AirportWaitTimePublicAirport, "faaStatus" | "snapshot"> | null | undefined,
): FaaAirportStatus | undefined {
  return airport?.faaStatus ? airport.faaStatus : airport?.snapshot?.faaStatus;
}

export function readHeldFlights(
  airport: Pick<AirportWaitTimePublicAirport, "heldFlights" | "snapshot"> | null | undefined,
): readonly HeldFlight[] | undefined {
  return airport?.heldFlights ? airport.heldFlights : airport?.snapshot?.heldFlights;
}

export function faaKindForLake(status: FaaAirportStatus | undefined): string {
  if (!status || !status.active || status.kind === "none") {
    return "none";
  }
  return status.kind;
}

export function faaBannerSentence(iata: string, status: FaaAirportStatus | undefined): string {
  if (!status || !status.active || status.kind === "none") {
    return `${iata} is open. No FAA ground stop or airport closure.`;
  }
  const until = status.endsAt ? ` until ${formatFaaEnd(status.endsAt, status.timeZone)}` : "";
  const reason = status.reason ? ` (${status.reason})` : "";
  if (status.kind === "closure") {
    return `${iata} is closed${until}${reason}.`;
  }
  if (status.kind === "ground_delay") {
    return `${iata} is under an FAA ground delay${until}${reason}. No airport closure.`;
  }
  return `${iata} is under an FAA ground stop${until}${reason}. No airport closure.`;
}

export function airportBannerSentence(input: {
  readonly iata: string;
  readonly countryCode: string;
  readonly status: FaaAirportStatus | undefined;
  readonly isInitialUsFetchPending: boolean;
}): string {
  const { iata, countryCode, status, isInitialUsFetchPending } = input;
  if (countryCode !== "US") {
    const authority = resolveFlightAuthorityLabel(countryCode);
    return `Live status unavailable. Pack does not query live ${authority} traffic-management feeds for ${iata}.`;
  }
  if (status) {
    return faaBannerSentence(iata, status);
  }
  if (isInitialUsFetchPending) {
    return `Checking the live FAA status for ${iata}.`;
  }
  return `Live status unavailable for ${iata} right now.`;
}

export function delaysTodaySentence(
  airportName: string,
  iata: string,
  status: FaaAirportStatus | undefined,
  countryCode: string,
): string {
  if (countryCode !== "US") {
    const authority = resolveFlightAuthorityLabel(countryCode);
    return `Live status unavailable. Pack does not query live ${authority} delay programs for ${airportName}.`;
  }
  if (!status) {
    return `Live status unavailable for ${airportName} right now.`;
  }
  if (
    status.active &&
    (status.kind === "ground_stop" ||
      status.kind === "ground_delay" ||
      status.kind === "closure")
  ) {
    return faaBannerSentence(iata, status);
  }
  return `No FAA delay program is posted for ${airportName} right now.`;
}

export function closedTodayAnswer(iata: string, status: FaaAirportStatus | undefined): string {
  if (status?.active && status.kind === "closure") {
    return `Yes. ${faaBannerSentence(iata, status)}`;
  }
  return `No. ${faaBannerSentence(iata, status)}`;
}

export function groundStopAnswer(iata: string, status: FaaAirportStatus | undefined): string {
  if (status?.active && status.kind === "ground_stop") {
    return `Yes. ${faaBannerSentence(iata, status)}`;
  }
  return `No. ${faaBannerSentence(iata, status)}`;
}

export function formatCheckpointObservationLine(
  observation: AirportWaitTimeObservation,
  fetchStatus?: string,
): string {
  const normalized = normalizeAirportWaitObservation(observation, fetchStatus);
  const place = [
    normalized.terminalDisplayName,
    normalized.checkpointDisplayName
      ? normalized.checkpointDisplayName
      : normalized.locationDisplayName,
  ]
    .filter((part): part is string => Boolean(part && part.trim()))
    .join(" ");
  const wait = normalized.displayWaitText ? normalized.displayWaitText : "Unavailable";
  return place.length > 0 ? `${place}: ${wait}` : wait;
}

function waitTimesAnswer(
  airportName: string,
  observations: readonly AirportWaitTimeObservation[],
  fetchStatus?: string,
): string {
  const waits = observations
    .map((observation) => formatCheckpointObservationLine(observation, fetchStatus))
    .filter((line) => line.length > 0);
  if (waits.length === 0) {
    return `Pack does not have a published checkpoint wait for ${airportName} in this snapshot.`;
  }
  return waits.join(". ");
}

export function airportFaq(input: {
  readonly airportName: string;
  readonly iata: string;
  readonly countryCode: string;
  readonly hasLiveSnapshot: boolean;
  readonly isInitialUsFetchPending: boolean;
  readonly status: FaaAirportStatus | undefined;
  readonly observations: readonly AirportWaitTimeObservation[];
  readonly fetchStatus?: string;
}): readonly { question: string; answer: string }[] {
  const {
    airportName,
    iata,
    countryCode,
    hasLiveSnapshot,
    isInitialUsFetchPending,
    status,
    observations,
    fetchStatus,
  } = input;

  if (countryCode !== "US") {
    const authority = resolveFlightAuthorityLabel(countryCode);
    const closedGuidance =
      `Live status unavailable. Check the official ${airportName} website or ${authority} advisories for current operating status.`;
    const flightGuidance =
      `Live status unavailable on Pack for ${iata}. Check the official ${airportName} website or your airline for live departure and arrival updates.`;
    const waitFallback = `Airport security wait times for ${airportName} are not in this snapshot yet.`;
    return [
      {
        question: `Is ${airportName} closed today?`,
        answer: closedGuidance,
      },
      {
        question: `Where can I check live flight delays for ${airportName}?`,
        answer: flightGuidance,
      },
      {
        question: `How long are Airport security wait times at ${airportName} right now?`,
        answer: hasLiveSnapshot
          ? waitTimesAnswer(airportName, observations, fetchStatus)
          : waitFallback,
      },
    ];
  }

  const pendingUs = `Live FAA and TSA status for ${airportName} is not in this snapshot yet.`;
  const unavailableUs = `Live status unavailable for ${airportName} right now.`;
  const statusAnswerFallback = isInitialUsFetchPending ? pendingUs : unavailableUs;

  return [
    {
      question: `Is ${airportName} closed today?`,
      answer: status ? closedTodayAnswer(iata, status) : statusAnswerFallback,
    },
    {
      question: `Is there a ground stop at ${airportName}?`,
      answer: status ? groundStopAnswer(iata, status) : statusAnswerFallback,
    },
    {
      question: `How long are TSA wait times at ${airportName} right now?`,
      answer: hasLiveSnapshot
        ? waitTimesAnswer(airportName, observations, fetchStatus)
        : statusAnswerFallback,
    },
  ];
}
