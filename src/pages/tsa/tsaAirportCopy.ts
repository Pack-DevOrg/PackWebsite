import type {
  AirportWaitTimeObservation,
  AirportWaitTimePublicAirport,
  FaaAirportStatus,
  HeldFlight,
} from "@/schemas/airport-security";

export const TSA_AIRPORT_H2S = [
  "Security wait times by checkpoint",
  "Delays today",
  "Ground stop and ground delay status",
  "Flights delayed or cancelled today",
  "Flight status",
] as const;

export function airportPageTitle(airportName: string, iata: string): string {
  return `${airportName} (${iata}) TSA Wait Times, Delays & Ground Stop Status`;
}

export function airportPageH1(airportName: string): string {
  return `${airportName} TSA wait times and delays right now`;
}

export function airportPageDescription(airportName: string, iata: string): string {
  const full = `Live TSA wait times, delays, and FAA ground stop status for ${airportName} (${iata}).`;
  if (full.length >= 60 && full.length <= 165) {
    return full;
  }
  return `Live TSA wait times, delays, and FAA ground stop status for ${iata}.`;
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
  return airport?.faaStatus ?? airport?.snapshot?.faaStatus;
}

export function readHeldFlights(
  airport: Pick<AirportWaitTimePublicAirport, "heldFlights" | "snapshot"> | null | undefined,
): readonly HeldFlight[] | undefined {
  return airport?.heldFlights ?? airport?.snapshot?.heldFlights;
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

export function delaysTodaySentence(
  airportName: string,
  iata: string,
  status: FaaAirportStatus | undefined,
): string {
  if (status?.active && (status.kind === "ground_stop" || status.kind === "ground_delay" || status.kind === "closure")) {
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

export function waitTimesAnswer(
  airportName: string,
  observations: readonly AirportWaitTimeObservation[],
): string {
  const waits = observations
    .map((observation) => {
      const place = [
        observation.terminalDisplayName,
        observation.checkpointDisplayName ?? observation.locationDisplayName,
      ]
        .filter((part): part is string => Boolean(part && part.trim()))
        .join(" ");
      const wait = observation.displayWaitText?.trim()
        || (typeof observation.exactWaitMinutes === "number" ? `${observation.exactWaitMinutes} min` : "");
      return wait ? `${place}: ${wait}`.trim() : "";
    })
    .filter((line) => line.length > 0);
  if (waits.length === 0) {
    return `Pack does not have a published checkpoint wait for ${airportName} in this snapshot.`;
  }
  return waits.join(". ");
}

export function airportFaq(input: {
  readonly airportName: string;
  readonly iata: string;
  readonly hasLiveSnapshot: boolean;
  readonly status: FaaAirportStatus | undefined;
  readonly observations: readonly AirportWaitTimeObservation[];
}): readonly { question: string; answer: string }[] {
  const { airportName, iata, hasLiveSnapshot, status, observations } = input;
  const pending = `Live FAA and TSA status for ${airportName} is not in this snapshot yet.`;
  return [
    {
      question: `Is ${airportName} closed today?`,
      answer: hasLiveSnapshot ? closedTodayAnswer(iata, status) : pending,
    },
    {
      question: `Is there a ground stop at ${airportName}?`,
      answer: hasLiveSnapshot ? groundStopAnswer(iata, status) : pending,
    },
    {
      question: `How long are TSA wait times at ${airportName} right now?`,
      answer: hasLiveSnapshot ? waitTimesAnswer(airportName, observations) : pending,
    },
  ];
}
