import { useMemo } from "react";
import styled from "styled-components";
import {
  Calendar,
  Plane,
  Trash2,
  Armchair,
  Ticket,
  DoorOpen,
  Timer,
  Hotel as HotelIcon,
  Compass,
  CalendarCheck,
} from "lucide-react";
import { format, formatDistanceToNowStrict, isValid, parseISO } from "date-fns";
import type { Trip } from "@/api/trips";
import { getTripNamingDisplay } from "@/utils/tripNaming";
import {
  computeFlightRoute,
  getTripDistance,
  sortFlightsChronologically,
} from "@/utils/tripMetrics";
import { getTripAirlineBadges } from "@/utils/tripAirlineBadges";
import { Card, IconDisc, MicroLabel } from "../ui/Chrome";

interface UpcomingTripCardProps {
  readonly trip: Trip;
  readonly onDelete?: (tripId: string) => void;
  readonly onClick?: (tripId: string) => void;
}

interface InfoChip {
  readonly key: string;
  readonly label: string;
  readonly value: string;
  readonly icon: React.ComponentType<{ size?: number }>;
}

interface BottomBadge {
  readonly key: string;
  readonly label: string;
  readonly value: string;
  readonly subtitle?: string;
  readonly icon: React.ComponentType<{ size?: number }>;
}

type TripFlight = NonNullable<Trip["flights"]>[number];
type TripHotel = NonNullable<Trip["hotels"]>[number];

function defaultTitleBecauseMissing(title: string | undefined): string {
  if (title === undefined || title === "") {
    return "Trip";
  }
  return title;
}

function defaultHotelsBecauseMissing(
  hotels: Trip["hotels"] | undefined,
): TripHotel[] {
  if (hotels === undefined) {
    return [];
  }
  return hotels;
}

function defaultFlightsBecauseMissing(
  flights: Trip["flights"] | undefined,
): TripFlight[] {
  if (flights === undefined) {
    return [];
  }
  return flights;
}

function defaultCountBecauseMissing(items: { length: number } | undefined): number {
  if (items === undefined) {
    return 0;
  }
  return items.length;
}

function defaultTimeBecauseMissing(value: string | undefined): string {
  if (value === undefined || value === "") {
    return "Time TBD";
  }
  return value;
}

function firstNonEmptyBecauseFallback(
  candidates: Array<string | undefined | null>,
  fallback: string,
): string {
  for (const candidate of candidates) {
    if (candidate !== undefined && candidate !== null && candidate !== "") {
      return candidate;
    }
  }
  return fallback;
}

function defaultCabinBecauseMissing(
  cabinType: string | undefined,
  fareClass: string | undefined,
): string | undefined {
  if (cabinType !== undefined && cabinType !== "") {
    return cabinType;
  }
  if (fareClass !== undefined && fareClass !== "") {
    return fareClass;
  }
  return undefined;
}

function defaultGateBecauseMissing(flight: TripFlight | undefined): string | undefined {
  if (flight === undefined) {
    return undefined;
  }
  const nested = (flight as { departure?: { gate?: string } }).departure;
  if (nested !== undefined && nested.gate !== undefined && nested.gate !== "") {
    return nested.gate;
  }
  if (flight.gate !== undefined && flight.gate !== "") {
    return flight.gate;
  }
  if (flight.departureGate !== undefined && flight.departureGate !== "") {
    return flight.departureGate;
  }
  return undefined;
}

function defaultRouteSubtitleBecauseMissing(
  namingSubtitle: string | undefined,
  origin: string | undefined,
  dest: string | undefined,
  routeDisplay: string | null | undefined,
): string {
  if (namingSubtitle !== undefined && namingSubtitle !== "") {
    return namingSubtitle;
  }
  if (origin !== undefined && origin !== "" && dest !== undefined && dest !== "") {
    return `${origin} -> ${dest}`;
  }
  if (routeDisplay !== undefined && routeDisplay !== null && routeDisplay !== "") {
    return routeDisplay;
  }
  return "Route pending";
}

function shouldShowHeaderRight(hasBadges: boolean, hasDelete: boolean): boolean {
  if (hasBadges) {
    return true;
  }
  return hasDelete;
}

function parseTripDate(dateValue?: string | null): Date | null {
  if (dateValue === undefined || dateValue === null || dateValue === "") {
    return null;
  }
  const parsed = parseISO(`${dateValue}T00:00:00Z`);
  return isValid(parsed) ? parsed : null;
}

function formatDateLabel(dateObj: Date | null): string {
  if (dateObj === null) {
    return "Date TBD";
  }
  return format(dateObj, "EEE, MMM d");
}

function formatCompactDate(dateObj: Date | null): string {
  if (dateObj === null) {
    return "Date TBD";
  }
  return format(dateObj, "MMM d");
}

function nightWordBecauseCount(count: number): string {
  if (count === 1) {
    return "night";
  }
  return "nights";
}

function dayWordBecauseCount(count: number): string {
  if (count === 1) {
    return "day";
  }
  return "days";
}

function flightWordBecauseCount(count: number): string {
  if (count === 1) {
    return "flight";
  }
  return "flights";
}

function stayWordBecauseCount(count: number): string {
  if (count === 1) {
    return "stay";
  }
  return "stays";
}

const getTimeToDepartBadge = (startDate?: string | null): BottomBadge => {
  const startDateObj = parseTripDate(startDate);
  if (startDateObj === null) {
    return {
      key: "countdown",
      label: "Time to depart",
      value: "Schedule pending",
      icon: Calendar,
    };
  }

  const distance = formatDistanceToNowStrict(startDateObj, {
    addSuffix: true,
    roundingMethod: "floor",
  }).replace("about ", "");

  let displayValue = distance;
  const daysUntil = Math.ceil(
    (startDateObj.getTime() - Date.now()) / (1000 * 60 * 60 * 24),
  );
  if (daysUntil === 0) {
    displayValue = "Today";
  } else if (daysUntil === 1) {
    displayValue = "Tomorrow";
  }

  return {
    key: "countdown",
    label: "Time to depart",
    value: displayValue,
    subtitle: `Departs ${format(startDateObj, "MMM d")}`,
    icon: Calendar,
  };
};

export const UpcomingTripCard: React.FC<UpcomingTripCardProps> = ({
  trip,
  onDelete,
  onClick,
}) => {
  const naming = getTripNamingDisplay(trip, {
    fallbackTitle: defaultTitleBecauseMissing(trip.title),
  });
  const routeDisplay = computeFlightRoute(trip);
  const flights = defaultFlightsBecauseMissing(trip.flights);
  const sortedFlights = useMemo(
    () => sortFlightsChronologically(flights),
    [flights],
  );
  const primaryFlight = sortedFlights[0];
  const returnFlight = sortedFlights[sortedFlights.length - 1];
  const hotels = defaultHotelsBecauseMissing(trip.hotels);
  const firstHotel = hotels[0];
  const lastHotel = hotels[hotels.length - 1];
  const hotelNights = hotels.reduce((total, hotel) => {
    if (typeof hotel.nights === "number") {
      return total + hotel.nights;
    }
    return total;
  }, 0);

  const flightCount = defaultCountBecauseMissing(trip.flights);
  const hotelCount = defaultCountBecauseMissing(trip.hotels);

  const startDateObj = parseTripDate(trip.startDate);
  const endDateObj = parseTripDate(trip.endDate);

  const startLocation = firstNonEmptyBecauseFallback(
    [
      primaryFlight?.departureAirport,
      firstHotel?.city,
      routeDisplay?.split("→")[0]?.trim(),
    ],
    naming.routeTitle,
  );
  const endLocation = firstNonEmptyBecauseFallback(
    [
      returnFlight?.arrivalAirport,
      lastHotel?.city,
      routeDisplay?.split("→").slice(-1)[0]?.trim(),
    ],
    naming.routeTitle,
  );
  const distanceMiles = getTripDistance(trip);

  const startTimeDisplay = defaultTimeBecauseMissing(
    firstNonEmptyBecauseFallback(
      [primaryFlight?.departureTime, firstHotel?.checkInTime],
      "",
    ),
  );
  const endTimeDisplay = defaultTimeBecauseMissing(
    firstNonEmptyBecauseFallback(
      [returnFlight?.arrivalTime, lastHotel?.checkOutTime],
      "",
    ),
  );

  const routeSubtitle = defaultRouteSubtitleBecauseMissing(
    naming.subtitle,
    primaryFlight?.departureAirport,
    primaryFlight?.arrivalAirport,
    routeDisplay,
  );

  const infoChips: InfoChip[] = [];
  if (primaryFlight?.seatNumber) {
    infoChips.push({
      key: "seat",
      label: "Seat",
      value: primaryFlight.seatNumber,
      icon: Armchair,
    });
  }
  const cabinType = defaultCabinBecauseMissing(
    primaryFlight?.cabinType,
    primaryFlight?.fareClass,
  );
  if (cabinType !== undefined) {
    infoChips.push({
      key: "cabin",
      label: "Cabin",
      value: cabinType,
      icon: Ticket,
    });
  }
  const gate = defaultGateBecauseMissing(primaryFlight);
  if (gate !== undefined) {
    infoChips.push({ key: "gate", label: "Gate", value: gate, icon: DoorOpen });
  }
  if (primaryFlight?.duration) {
    infoChips.push({
      key: "duration",
      label: "Duration",
      value: primaryFlight.duration,
      icon: Timer,
    });
  }
  if (hotelNights > 0) {
    infoChips.push({
      key: "nights",
      label: "Hotel nights",
      value: `${hotelNights} ${nightWordBecauseCount(hotelNights)}`,
      icon: HotelIcon,
    });
  }
  if (typeof distanceMiles === "number" && Number.isFinite(distanceMiles)) {
    infoChips.push({
      key: "distance",
      label: "Distance",
      value: `${Math.round(distanceMiles).toLocaleString()} mi`,
      icon: Compass,
    });
  }
  if (primaryFlight?.boardingGroup) {
    infoChips.push({
      key: "boarding",
      label: "Boarding",
      value: `Group ${primaryFlight.boardingGroup}`,
      icon: Ticket,
    });
  }

  let tripDurationDays = 0;
  if (startDateObj !== null && endDateObj !== null) {
    tripDurationDays = Math.max(
      0,
      Math.round(
        (endDateObj.getTime() - startDateObj.getTime()) / (1000 * 60 * 60 * 24),
      ),
    );
  }

  let durationValue = "Awaiting details";
  if (tripDurationDays > 0) {
    durationValue = `${tripDurationDays} ${dayWordBecauseCount(tripDurationDays)}`;
  } else if (hotelNights > 0) {
    durationValue = `${hotelNights} ${nightWordBecauseCount(hotelNights)}`;
  }

  let durationSubtitle: string | undefined;
  if (hotelNights > 0) {
    if (hotelNights === 1) {
      durationSubtitle = "1 night in hotels";
    } else {
      durationSubtitle = `${hotelNights} hotel nights`;
    }
  }

  const durationBadge: BottomBadge = {
    key: "duration",
    label: "Trip duration",
    value: durationValue,
    subtitle: durationSubtitle,
    icon: CalendarCheck,
  };

  const bottomBadges = [getTimeToDepartBadge(trip.startDate), durationBadge];

  const airlineBadges = getTripAirlineBadges(trip, 3);

  const handleCardClick = (event: React.MouseEvent) => {
    if ((event.target as HTMLElement).closest("button")) {
      return;
    }
    onClick?.(trip.tripId);
  };

  return (
    <TripCard onClick={handleCardClick}>
      <CardHeader>
        <HeaderLeft>
          <IconDisc>
            <Plane size={18} />
          </IconDisc>

          <TripTitleBlock>
            <MicroLabel>Trip</MicroLabel>
            <RouteTitle>{naming.routeTitle}</RouteTitle>
            <TripSubtitle>{routeSubtitle}</TripSubtitle>
            <DateRange>
              {formatCompactDate(startDateObj)}–{formatCompactDate(endDateObj)}
            </DateRange>

            <ComponentSummary>
              {flightCount > 0 ? (
                <ComponentTag>
                  <Plane size={12} />
                  <span>
                    {flightCount} {flightWordBecauseCount(flightCount)}
                  </span>
                </ComponentTag>
              ) : null}
              {hotelCount > 0 ? (
                <ComponentTag>
                  <HotelIcon size={12} />
                  <span>
                    {hotelCount} {stayWordBecauseCount(hotelCount)}
                  </span>
                </ComponentTag>
              ) : null}
            </ComponentSummary>
          </TripTitleBlock>
        </HeaderLeft>

        {shouldShowHeaderRight(airlineBadges.length > 0, onDelete !== undefined) ? (
          <HeaderRight>
            {airlineBadges.length > 0 ? (
              <BrandBadgeRow>
                {airlineBadges.map((badge) => (
                  <BrandBadge key={badge.key} title={badge.label} aria-label={badge.label}>
                    {badge.logoSrc ? (
                      <BrandBadgeImage
                        src={badge.logoSrc}
                        alt={`${badge.label} logo`}
                        loading="lazy"
                      />
                    ) : (
                      <BrandBadgeFallback>{badge.monogram}</BrandBadgeFallback>
                    )}
                  </BrandBadge>
                ))}
              </BrandBadgeRow>
            ) : null}
            {onDelete !== undefined ? (
              <DeleteButton type="button" onClick={() => onDelete(trip.tripId)}>
                <Trash2 size={16} />
              </DeleteButton>
            ) : null}
          </HeaderRight>
        ) : null}
      </CardHeader>

      <CardDivider />

      <DateRow>
        <DateColumn>
          <MicroLabel>Departing</MicroLabel>
          <DateValue>{formatDateLabel(startDateObj)}</DateValue>
          <TimeValue>{startTimeDisplay}</TimeValue>
          <DateMeta>{startLocation}</DateMeta>
        </DateColumn>

        <DateColumn>
          <MicroLabel>Returning</MicroLabel>
          <DateValue>{formatDateLabel(endDateObj)}</DateValue>
          <TimeValue>{endTimeDisplay}</TimeValue>
          <DateMeta>{endLocation}</DateMeta>
        </DateColumn>
      </DateRow>

      {infoChips.length > 0 ? (
        <>
          <CardDivider />
          <InfoChipList>
            {infoChips.map((chip) => (
              <InfoChipCard key={chip.key}>
                <InfoChipIcon>
                  <chip.icon size={14} />
                </InfoChipIcon>
                <InfoChipText>
                  <MicroLabel>{chip.label}</MicroLabel>
                  <InfoChipValue>{chip.value}</InfoChipValue>
                </InfoChipText>
              </InfoChipCard>
            ))}
          </InfoChipList>
        </>
      ) : null}

      <CardDivider />

      <BottomBadgeRow>
        {bottomBadges.map((badge) => (
          <BottomBadgeCard key={badge.key}>
            <IconDisc>
              <badge.icon size={16} />
            </IconDisc>
            <BottomBadgeText>
              <MicroLabel>{badge.label}</MicroLabel>
              <BottomBadgeValue>{badge.value}</BottomBadgeValue>
              {badge.subtitle !== undefined ? (
                <BottomBadgeSubtitle>{badge.subtitle}</BottomBadgeSubtitle>
              ) : null}
            </BottomBadgeText>
          </BottomBadgeCard>
        ))}
      </BottomBadgeRow>
    </TripCard>
  );
};

const TripCard = styled(Card)`
  padding: var(--space-3);
  cursor: pointer;
  display: grid;
  gap: var(--space-3);
  color: var(--color-text-primary);
`;

const CardHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: stretch;
  gap: var(--space-3);
`;

const HeaderLeft = styled.div`
  display: flex;
  align-items: flex-start;
  gap: var(--space-2);
  flex: 1;
`;

const TripTitleBlock = styled.div`
  display: grid;
  gap: var(--space-1);
  flex: 1;
`;

const RouteTitle = styled.h3`
  margin: 0;
  font-size: 1.2rem;
  line-height: 1.2;
  font-weight: 700;
  color: var(--color-text-primary);
`;

const TripSubtitle = styled.p`
  margin: 0;
  font-size: var(--font-size-small);
  color: var(--color-text-secondary);
`;

const DateRange = styled.p`
  margin: 0;
  font-size: var(--font-size-small);
  font-family: var(--font-mono);
  color: var(--color-text-muted);
`;

const ComponentSummary = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-1);
  margin-top: var(--space-1);
`;

const ComponentTag = styled.span`
  display: inline-flex;
  align-items: center;
  gap: var(--space-1);
  border-radius: var(--radius-disc);
  padding: var(--space-1) var(--space-2);
  background: var(--color-background-subtle);
  border: 1px solid var(--color-border);
  color: var(--color-text-primary);
  font-size: var(--font-size-small);
  font-weight: 600;
`;

const HeaderRight = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  justify-content: space-between;
  gap: var(--space-1);
`;

const BrandBadgeRow = styled.div`
  display: flex;
  align-items: center;
  gap: var(--space-1);
`;

const BrandBadge = styled.span`
  width: 34px;
  height: 34px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  background: transparent;
  border: none;
`;

const BrandBadgeImage = styled.img`
  width: 78%;
  height: 78%;
  object-fit: contain;
  display: block;
`;

const BrandBadgeFallback = styled.span`
  color: var(--color-text-primary);
  font-weight: 700;
  font-size: var(--font-size-small);
`;

const DeleteButton = styled.button`
  border: 1px solid var(--color-border);
  background: var(--color-background-subtle);
  color: var(--color-text-primary);
  width: 34px;
  height: 34px;
  border-radius: var(--radius-disc);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
`;

const CardDivider = styled.div`
  height: 1px;
  background: var(--color-border);
`;

const DateRow = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--space-3);
`;

const DateColumn = styled.div`
  display: grid;
  gap: var(--space-1);
`;

const DateValue = styled.div`
  font-size: var(--font-size-small);
  font-weight: 650;
  color: var(--color-text-primary);
`;

const TimeValue = styled.div`
  font-size: var(--font-size-small);
  font-weight: 550;
  font-family: var(--font-mono);
  color: var(--color-text-primary);
`;

const DateMeta = styled.div`
  font-size: var(--font-size-small);
  font-family: var(--font-mono);
  color: var(--color-text-secondary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const InfoChipList = styled.div`
  display: grid;
  gap: var(--space-1);
`;

const InfoChipCard = styled.div`
  width: 100%;
  display: flex;
  align-items: center;
  gap: var(--space-2);
  border-radius: var(--radius-l);
  padding: var(--space-2);
  background: var(--color-background-subtle);
  border: 1px solid var(--color-border);
`;

const InfoChipIcon = styled.div`
  width: 24px;
  height: 24px;
  border-radius: var(--radius-disc);
  background: var(--color-background-subtle);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: var(--color-accent);
`;

const InfoChipText = styled.div`
  display: grid;
  gap: var(--space-1);
`;

const InfoChipValue = styled.div`
  font-size: var(--font-size-small);
  font-weight: 650;
  color: var(--color-text-primary);
`;

const BottomBadgeRow = styled.div`
  display: grid;
  gap: var(--space-2);
`;

const BottomBadgeCard = styled.div`
  width: 100%;
  display: flex;
  align-items: center;
  gap: var(--space-2);
  border-radius: var(--radius-l);
  padding: var(--space-2);
  background: var(--color-background-subtle);
  border: 1px solid var(--color-border);
`;

const BottomBadgeText = styled.div`
  display: grid;
  gap: var(--space-1);
`;

const BottomBadgeValue = styled.div`
  font-size: var(--font-size-small);
  font-weight: 700;
  color: var(--color-text-primary);
`;

const BottomBadgeSubtitle = styled.div`
  font-size: var(--font-size-small);
  color: var(--color-text-muted);
`;
