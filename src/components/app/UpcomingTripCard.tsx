import { useMemo } from "react";
import styled from "styled-components";
import {
  Calendar,
  Clock,
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
import { computeFlightRoute, getTripDistance, sortFlightsChronologically } from "@/utils/tripMetrics";
import { getTripAirlineBadges } from "@/utils/tripAirlineBadges";
import { getTripCardTheme, resolveTripThemeHashSource } from "./tripCardTheme";

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

const parseTripDate = (dateValue?: string | null): Date | null => {
  if (!dateValue) {
    return null;
  }
  const parsed = parseISO(`${dateValue}T00:00:00Z`);
  return isValid(parsed) ? parsed : null;
};

const getTimeToDepartBadge = (startDate?: string | null): BottomBadge => {
  const startDateObj = parseTripDate(startDate);
  if (!startDateObj) {
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
    (startDateObj.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
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
  const naming = getTripNamingDisplay(trip, { fallbackTitle: trip.title || "Trip" });
  const routeDisplay = computeFlightRoute(trip);
  const sortedFlights = useMemo(() => sortFlightsChronologically(trip.flights), [trip.flights]);
  const primaryFlight = sortedFlights[0];
  const returnFlight = sortedFlights[sortedFlights.length - 1];
  const hotels = trip.hotels ?? [];
  const firstHotel = hotels[0];
  const lastHotel = hotels[hotels.length - 1];
  const hotelNights = hotels.reduce(
    (total, hotel) => total + (typeof hotel.nights === "number" ? hotel.nights : 0),
    0
  );

  const flightCount = trip.flights?.length ?? 0;
  const hotelCount = trip.hotels?.length ?? 0;

  const startDateObj = parseTripDate(trip.startDate);
  const endDateObj = parseTripDate(trip.endDate);

  const startLocation =
    primaryFlight?.departureAirport ??
    firstHotel?.city ??
    routeDisplay?.split("→")[0]?.trim() ??
    naming.routeTitle;
  const endLocation =
    returnFlight?.arrivalAirport ??
    lastHotel?.city ??
    routeDisplay?.split("→").slice(-1)[0]?.trim() ??
    naming.routeTitle;
  const hashSource = resolveTripThemeHashSource({
    destination: typeof trip.destination === "string" ? trip.destination : undefined,
    startLocation,
    endLocation,
    tripId: trip.tripId,
  });
  const distanceMiles = getTripDistance(trip);
  const theme = getTripCardTheme({
    hashSource,
    variant: "upcoming",
    distanceMiles,
  });

  const startTimeDisplay = primaryFlight?.departureTime ?? firstHotel?.checkInTime ?? "Time TBD";
  const endTimeDisplay = returnFlight?.arrivalTime ?? lastHotel?.checkOutTime ?? "Time TBD";

  const routeSubtitle =
    naming.subtitle ??
    (primaryFlight?.departureAirport && primaryFlight?.arrivalAirport
      ? `${primaryFlight.departureAirport} -> ${primaryFlight.arrivalAirport}`
      : routeDisplay ?? "Route pending");

  const infoChips: InfoChip[] = [];
  if (primaryFlight?.seatNumber) {
    infoChips.push({ key: "seat", label: "Seat", value: primaryFlight.seatNumber, icon: Armchair });
  }
  const cabinType = primaryFlight?.cabinType ?? primaryFlight?.fareClass;
  if (cabinType) {
    infoChips.push({ key: "cabin", label: "Cabin", value: cabinType, icon: Ticket });
  }
  const gate =
    primaryFlight?.departure?.gate ?? primaryFlight?.gate ?? primaryFlight?.departureGate;
  if (gate) {
    infoChips.push({ key: "gate", label: "Gate", value: gate, icon: DoorOpen });
  }
  if (primaryFlight?.duration) {
    infoChips.push({ key: "duration", label: "Duration", value: primaryFlight.duration, icon: Timer });
  }
  if (hotelNights > 0) {
    infoChips.push({
      key: "nights",
      label: "Hotel nights",
      value: `${hotelNights} ${hotelNights === 1 ? "night" : "nights"}`,
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

  const tripDurationDays =
    startDateObj && endDateObj
      ? Math.max(
          0,
          Math.round((endDateObj.getTime() - startDateObj.getTime()) / (1000 * 60 * 60 * 24))
        )
      : 0;

  const durationBadge: BottomBadge = {
    key: "duration",
    label: "Trip duration",
    value:
      tripDurationDays > 0
        ? `${tripDurationDays} ${tripDurationDays === 1 ? "day" : "days"}`
        : hotelNights > 0
        ? `${hotelNights} ${hotelNights === 1 ? "night" : "nights"}`
        : "Awaiting details",
    subtitle:
      hotelNights > 0
        ? `${hotelNights} ${hotelNights === 1 ? "night in hotels" : "hotel nights"}`
        : undefined,
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
    <Card
      $gradientStart={theme.gradientStart}
      $gradientEnd={theme.gradientEnd}
      $orb={theme.orb}
      onClick={handleCardClick}
    >
      <CardHeader>
        <HeaderLeft>
          <TripIconCircle $accent={theme.accent}>
            <Plane size={18} />
          </TripIconCircle>

          <TripTitleBlock>
            <TripLabel>Trip</TripLabel>
            <RouteTitle>{naming.routeTitle}</RouteTitle>
            <TripSubtitle>{routeSubtitle}</TripSubtitle>

            <ComponentSummary>
              {flightCount > 0 ? (
                <ComponentTag>
                  <Plane size={12} color={theme.accent} />
                  <span>{flightCount} {flightCount === 1 ? "flight" : "flights"}</span>
                </ComponentTag>
              ) : null}
              {hotelCount > 0 ? (
                <ComponentTag>
                  <HotelIcon size={12} color={theme.accent} />
                  <span>{hotelCount} {hotelCount === 1 ? "stay" : "stays"}</span>
                </ComponentTag>
              ) : null}
            </ComponentSummary>
          </TripTitleBlock>
        </HeaderLeft>

        {(airlineBadges.length > 0 || onDelete) && (
          <HeaderRight>
            {airlineBadges.length > 0 && (
              <BrandBadgeRow>
                {airlineBadges.map((badge) => (
                  <BrandBadge key={badge.key} title={badge.label} aria-label={badge.label}>
                    {badge.logoSrc ? (
                      <BrandBadgeImage src={badge.logoSrc} alt={`${badge.label} logo`} loading="lazy" />
                    ) : (
                      <BrandBadgeFallback>{badge.monogram}</BrandBadgeFallback>
                    )}
                  </BrandBadge>
                ))}
              </BrandBadgeRow>
            )}
            {onDelete ? (
              <DeleteButton type="button" onClick={() => onDelete(trip.tripId)}>
                <Trash2 size={16} />
              </DeleteButton>
            ) : null}
          </HeaderRight>
        )}
      </CardHeader>

      <CardDivider />

      <DateRow>
        <DateColumn>
          <DateLabel>Departing</DateLabel>
          <DateValue>{startDateObj ? format(startDateObj, "EEE, MMM d") : "Date TBD"}</DateValue>
          <TimeValue>{startTimeDisplay}</TimeValue>
          <DateMeta>{startLocation}</DateMeta>
        </DateColumn>

        <DateColumn>
          <DateLabel>Returning</DateLabel>
          <DateValue>{endDateObj ? format(endDateObj, "EEE, MMM d") : "Date TBD"}</DateValue>
          <TimeValue>{endTimeDisplay}</TimeValue>
          <DateMeta>{endLocation}</DateMeta>
        </DateColumn>
      </DateRow>

      {infoChips.length > 0 && (
        <>
          <CardDivider />
          <InfoChipList>
            {infoChips.map((chip) => (
              <InfoChipCard key={chip.key}>
                <InfoChipIcon>
                  <chip.icon size={14} />
                </InfoChipIcon>
                <InfoChipText>
                  <InfoChipLabel>{chip.label}</InfoChipLabel>
                  <InfoChipValue>{chip.value}</InfoChipValue>
                </InfoChipText>
              </InfoChipCard>
            ))}
          </InfoChipList>
        </>
      )}

      <CardDivider />

      <BottomBadgeRow>
        {bottomBadges.map((badge) => (
          <BottomBadgeCard key={badge.key}>
            <BottomBadgeIcon>
              <badge.icon size={16} />
            </BottomBadgeIcon>
            <BottomBadgeText>
              <BottomBadgeLabel>{badge.label}</BottomBadgeLabel>
              <BottomBadgeValue>{badge.value}</BottomBadgeValue>
              {badge.subtitle ? <BottomBadgeSubtitle>{badge.subtitle}</BottomBadgeSubtitle> : null}
            </BottomBadgeText>
          </BottomBadgeCard>
        ))}
      </BottomBadgeRow>
    </Card>
  );
};

const Card = styled.article<{ $gradientStart: string; $gradientEnd: string; $orb: string }>`
  position: relative;
  padding: 1.2rem;
  border-radius: 24px;
  overflow: hidden;
  background: ${({ $gradientStart, $gradientEnd }) =>
    `linear-gradient(135deg, ${$gradientStart} 0%, ${$gradientEnd} 100%)`};
  border: 1px solid rgba(243, 210, 122, 0.12);
  box-shadow: 0 22px 50px rgba(0, 0, 0, 0.3);
  color: #f8fafc;
  cursor: pointer;
  display: grid;
  gap: 0.9rem;
  transition: transform 0.18s ease, border-color 0.18s ease, box-shadow 0.18s ease;

  &:hover {
    transform: translateY(-2px);
    border-color: rgba(243, 210, 122, 0.18);
    box-shadow: 0 28px 56px rgba(0, 0, 0, 0.36);
  }

  > * {
    position: relative;
    z-index: 1;
  }

  &::before {
    content: "";
    position: absolute;
    left: 0;
    top: 0;
    bottom: 0;
    width: 4px;
    border-top-left-radius: 20px;
    border-bottom-left-radius: 20px;
    background: ${({ $orb }) => $orb.replace(/([0-9A-Fa-f]{2})$/, "FF")};
    opacity: 0.9;
    pointer-events: none;
    z-index: 0;
  }

  &::after {
    content: "";
    position: absolute;
    width: 220px;
    height: 220px;
    right: -60px;
    top: -80px;
    border-radius: 999px;
    background: ${({ $orb }) => $orb};
    pointer-events: none;
    z-index: 0;
  }
`;

const CardHeader = styled.div`
  position: relative;
  z-index: 1;
  display: flex;
  justify-content: space-between;
  align-items: stretch;
  gap: 1rem;
`;

const HeaderLeft = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  flex: 1;
`;

const TripIconCircle = styled.div<{ $accent: string }>`
  width: 40px;
  height: 40px;
  border-radius: 999px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: ${({ $accent }) => $accent};
  background: ${({ $accent }) => `${$accent}22`};
  border: 1px solid rgba(255, 248, 236, 0.12);
`;

const TripTitleBlock = styled.div`
  display: grid;
  gap: 0.28rem;
  flex: 1;
`;

const TripLabel = styled.span`
  font-size: 0.72rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: rgba(241, 245, 249, 0.7);
`;

const RouteTitle = styled.h3`
  margin: 0;
  font-size: 1.2rem;
  line-height: 1.2;
  font-weight: 700;
  color: #f8fafc;
`;

const TripSubtitle = styled.p`
  margin: 0;
  font-size: 0.82rem;
  color: rgba(226, 232, 240, 0.78);
`;

const ComponentSummary = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.45rem;
  margin-top: 0.2rem;
`;

const ComponentTag = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  border-radius: 999px;
  padding: 0.25rem 0.48rem;
  background: rgba(255, 248, 236, 0.08);
  color: rgba(248, 250, 252, 0.95);
  font-size: 0.72rem;
  font-weight: 600;
`;

const HeaderRight = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  justify-content: space-between;
  gap: 0.45rem;
`;

const BrandBadgeRow = styled.div`
  display: flex;
  align-items: center;
  gap: 0.4rem;
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
  box-shadow: none;
`;

const BrandBadgeImage = styled.img`
  width: 78%;
  height: 78%;
  object-fit: contain;
  display: block;
  filter: drop-shadow(0 1px 1px rgba(15, 23, 42, 0.18));
`;

const BrandBadgeFallback = styled.span`
  color: rgba(248, 250, 252, 0.9);
  font-weight: 700;
  font-size: 0.78rem;
`;

const DeleteButton = styled.button`
  border: 1px solid rgba(243, 210, 122, 0.14);
  background: rgba(255, 248, 236, 0.06);
  color: #f8fafc;
  width: 34px;
  height: 34px;
  border-radius: 999px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;

  &:hover {
    background: rgba(15, 23, 42, 0.7);
  }
`;

const CardDivider = styled.div`
  height: 1px;
  background: rgba(243, 210, 122, 0.12);
`;

const DateRow = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.95rem;

  @media (max-width: 560px) {
    grid-template-columns: minmax(0, 1fr);
  }
`;

const DateColumn = styled.div`
  display: grid;
  gap: 0.18rem;
`;

const DateLabel = styled.span`
  font-size: 0.68rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: rgba(226, 232, 240, 0.65);
`;

const DateValue = styled.div`
  font-size: 0.92rem;
  font-weight: 650;
  color: #f8fafc;
`;

const TimeValue = styled.div`
  font-size: 0.8rem;
  font-weight: 550;
  color: rgba(248, 250, 252, 0.92);
`;

const DateMeta = styled.div`
  font-size: 0.74rem;
  color: rgba(226, 232, 240, 0.72);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const InfoChipList = styled.div`
  display: grid;
  gap: 0.45rem;
`;

const InfoChipCard = styled.div`
  width: 100%;
  display: flex;
  align-items: center;
  gap: 0.55rem;
  border-radius: 16px;
  padding: 0.56rem 0.7rem;
  background: rgba(255, 248, 236, 0.06);
  border: 1px solid rgba(243, 210, 122, 0.12);
`;

const InfoChipIcon = styled.div`
  width: 24px;
  height: 24px;
  border-radius: 999px;
  background: rgba(255, 248, 236, 0.08);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: rgba(226, 232, 240, 0.92);
`;

const InfoChipText = styled.div`
  display: grid;
  gap: 0.12rem;
`;

const InfoChipLabel = styled.div`
  font-size: 0.64rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: rgba(226, 232, 240, 0.65);
`;

const InfoChipValue = styled.div`
  font-size: 0.82rem;
  font-weight: 650;
  color: #f8fafc;
`;

const BottomBadgeRow = styled.div`
  display: grid;
  gap: 0.5rem;
`;

const BottomBadgeCard = styled.div`
  width: 100%;
  display: flex;
  align-items: center;
  gap: 0.6rem;
  border-radius: 16px;
  padding: 0.68rem 0.75rem;
  background: rgba(255, 248, 236, 0.06);
  border: 1px solid rgba(243, 210, 122, 0.12);
`;

const BottomBadgeIcon = styled.div`
  width: 34px;
  height: 34px;
  border-radius: 999px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 248, 236, 0.08);
  color: rgba(226, 232, 240, 0.95);
`;

const BottomBadgeText = styled.div`
  display: grid;
  gap: 0.1rem;
`;

const BottomBadgeLabel = styled.div`
  font-size: 0.66rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: rgba(226, 232, 240, 0.65);
`;

const BottomBadgeValue = styled.div`
  font-size: 0.88rem;
  font-weight: 700;
  color: #f8fafc;
`;

const BottomBadgeSubtitle = styled.div`
  font-size: 0.72rem;
  color: rgba(226, 232, 240, 0.7);
`;
