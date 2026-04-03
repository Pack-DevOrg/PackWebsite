import styled from "styled-components";
import type { ComponentType, MouseEvent, FC } from "react";
import { useState, useRef } from "react";
import { format as formatDate, formatDistanceToNowStrict, isValid, parseISO } from "date-fns";
import {
  CalendarRange,
  MapPin,
  Plane,
  Trash2,
  Clock,
  Hotel as HotelIcon,
  Route as RouteIcon,
  ChevronDown,
} from "lucide-react";
import type { Trip } from "@/api/trips";
import {
  formatTripTitleForDisplay,
  getTripNamingDisplay,
} from "@/utils/tripNaming";
import { getOvernightLocations } from "@/utils/tripTitles";
import {
  calculateNights,
  computeFlightRoute,
  formatDateRange,
  getCountdownInfo,
  getTripDistance,
  sortFlightsChronologically,
} from "@/utils/tripMetrics";
import { getTripAirlineBadges } from "@/utils/tripAirlineBadges";
import { formatLocalizedDate } from "@/i18n/format";
import { useIsomorphicLayoutEffect } from "@/hooks/useIsomorphicLayoutEffect";
import { getTripCardTheme, resolveTripThemeHashSource } from "./tripCardTheme";

type InfoChipIcon = ComponentType<{ size?: number }>;

interface InfoChip {
  readonly label: string;
  readonly value: string;
  readonly icon: InfoChipIcon;
}

interface PastMetric {
  readonly key: string;
  readonly label: string;
  readonly value: string;
  readonly subtitle?: string;
  readonly icon: InfoChipIcon;
}

interface FlightLegSummary {
  readonly key: string;
  readonly dateLabel: string;
  readonly timeLabel: string;
  readonly routeLabel: string;
  readonly detailLabel: string;
}

const formatTripStartDate = (startDate?: string | null): string | null => {
  if (!startDate) {
    return null;
  }
  const timestamp = Date.parse(`${startDate}T00:00:00Z`);
  if (Number.isNaN(timestamp)) {
    return null;
  }
  return formatLocalizedDate(new Date(timestamp), {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

const parseTripDate = (dateValue?: string | null): Date | null => {
  if (!dateValue) {
    return null;
  }
  const parsed = parseISO(`${dateValue}T00:00:00Z`);
  return isValid(parsed) ? parsed : null;
};

const formatFlightLegDate = (dateValue?: string | null): string => {
  const parsed = parseTripDate(dateValue);
  return parsed ? formatDate(parsed, "EEE, MMM d") : "Date TBD";
};

const formatFlightLegTime = (
  departureTime?: string | null,
  arrivalTime?: string | null
): string => {
  const parts = [departureTime?.trim(), arrivalTime?.trim()].filter(Boolean);
  if (parts.length === 2) {
    return `${parts[0]} - ${parts[1]}`;
  }
  if (parts.length === 1) {
    return parts[0] as string;
  }
  return "Time TBD";
};

interface TripCardProps {
  readonly trip: Trip;
  readonly onDelete?: (tripId: string) => void;
  readonly onClick?: (tripId: string) => void;
  readonly isPast?: boolean;
  readonly expandedRowKey?: number | null;
  readonly onToggleRow?: (rowKey: number) => void;
}

export const EnhancedTripCard: FC<TripCardProps> = ({
  trip,
  onDelete,
  onClick,
  isPast,
  expandedRowKey,
  onToggleRow,
}) => {
  const isCollapsible = Boolean(isPast);
  const cardRef = useRef<HTMLDivElement | null>(null);
  const [rowKey, setRowKey] = useState<number>(0);

  useIsomorphicLayoutEffect(() => {
    const measure = () => {
      if (cardRef.current) {
        setRowKey(cardRef.current.offsetTop);
      }
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);
  const naming = getTripNamingDisplay(trip, { fallbackTitle: trip.title || "Trip" });
  const routeDisplay = computeFlightRoute(trip);
  const dateRange = formatDateRange(trip.startDate, trip.endDate);
  const countdownInfo = getCountdownInfo(trip);
  const nights = calculateNights(trip.startDate, trip.endDate);
  const nightsLabel = `${nights} night${nights === 1 ? "" : "s"}`;
  const flightCount = trip.flights?.length ?? 0;
  const hotelCount = trip.hotels?.length ?? 0;
  const distance = getTripDistance(trip);
  const startDateDisplay = formatTripStartDate(trip.startDate);
  const overnightStops = getOvernightLocations(trip);
  const routeSummary =
    naming.routeOnlyDisplay ??
    routeDisplay ??
    (overnightStops.length > 0 ? overnightStops.join(" • ") : dateRange);
  const pastTitle = formatTripTitleForDisplay(trip.title || naming.routeTitle);
  const primaryTitle = isPast ? pastTitle : naming.routeTitle;
  const subtitle = isPast ? null : naming.subtitle ?? routeSummary;
  const sortedFlights = sortFlightsChronologically(trip.flights ?? []);
  const primaryFlight = sortedFlights[0];
  const finalFlight = sortedFlights[sortedFlights.length - 1];
  const startDateObj = parseTripDate(trip.startDate);
  const endDateObj = parseTripDate(trip.endDate);
  const startLocation =
    primaryFlight?.departureAirport ??
    routeDisplay?.split("→")[0]?.trim() ??
    naming.routeTitle;
  const endLocation =
    finalFlight?.arrivalAirport ??
    routeDisplay?.split("→").slice(-1)[0]?.trim() ??
    naming.routeTitle;
  const hashSource = resolveTripThemeHashSource({
    destination: typeof trip.destination === "string" ? trip.destination : undefined,
    startLocation,
    endLocation,
    tripId: trip.tripId,
  });
  const cardTheme = getTripCardTheme({
    hashSource,
    variant: isPast ? "past" : "upcoming",
    distanceMiles: distance,
  });
  const startTime = primaryFlight?.departureTime ?? "Time TBD";
  const endTime = finalFlight?.arrivalTime ?? "Time TBD";
  const airlineBadges = getTripAirlineBadges(trip, 3);
  const flightLegs: FlightLegSummary[] = sortedFlights.map((flight, index) => ({
    key: `${flight.id ?? flight.flightNumber ?? "flight"}-${index}`,
    dateLabel: formatFlightLegDate(flight.departureDate),
    timeLabel: formatFlightLegTime(flight.departureTime, flight.arrivalTime),
    routeLabel: `${flight.departureAirport?.trim() || "Unknown"} -> ${flight.arrivalAirport?.trim() || "Unknown"}`,
    detailLabel:
      [flight.airline?.trim(), flight.flightNumber?.trim()].filter(Boolean).join(" • ") ||
      "Flight segment",
  }));

  const pastMetrics: PastMetric[] = [];
  if (isPast) {
    if (endDateObj) {
      const distance = formatDistanceToNowStrict(endDateObj, {
        addSuffix: true,
        roundingMethod: "floor",
      }).replace("about ", "");
      const daysSince = Math.floor(
        (Date.now() - endDateObj.getTime()) / (1000 * 60 * 60 * 24)
      );
      const normalizedDistance =
        daysSince === 0 ? "Today" : daysSince === 1 ? "Yesterday" : distance;
      pastMetrics.push({
        key: "since-return",
        label: "Time since return",
        value: normalizedDistance,
        subtitle: `Ended ${formatDate(endDateObj, "MMM d")}`,
        icon: Clock,
      });
    }
    pastMetrics.push({
      key: "duration",
      label: "Trip duration",
      value: nights > 0 ? `${nights} ${nights === 1 ? "day" : "days"}` : "Awaiting details",
      subtitle:
        nights > 0
          ? `${nights} ${nights === 1 ? "night in hotels" : "hotel nights"}`
          : undefined,
      icon: CalendarRange,
    });
  }

  const summaryTags = [
    { label: "Flights", value: `${flightCount}` },
    ...(isPast && hotelCount === 0
      ? []
      : [{ label: "Stays", value: `${hotelCount}` }]),
    { label: "Nights", value: nightsLabel },
  ];

  const infoChips: InfoChip[] = [];
  if (distance != null) {
    infoChips.push({
      label: "Distance",
      value: `${Math.round(distance).toLocaleString()} mi`,
      icon: RouteIcon,
    });
  }

  const isExpanded = !isCollapsible || (expandedRowKey != null && rowKey === expandedRowKey);

  const handleCardClick = (event: MouseEvent<HTMLDivElement>) => {
    if ((event.target as HTMLElement).closest("button")) {
      return;
    }
    if (isCollapsible) {
      onToggleRow?.(rowKey);
      return;
    }
    onClick?.(trip.tripId);
  };

  return (
    <Card
      ref={cardRef}
      $gradientStart={cardTheme.gradientStart}
      $gradientEnd={cardTheme.gradientEnd}
      $orb={cardTheme.orb}
      $isPast={Boolean(isPast)}
      onClick={handleCardClick}
    >
      <CardHeader>
        <HeaderLeft>
          <IconCircle $accent={cardTheme.accent}>
            <Plane size={18} />
          </IconCircle>
          <HeaderText>
            <TripLabel>
              <TripLabelText>{isPast ? "Completed trip" : "Trip"}</TripLabelText>
              {isPast && startDateDisplay ? (
                <TripLabelDate>{startDateDisplay}</TripLabelDate>
              ) : null}
            </TripLabel>
            <RouteTitle $expanded={isExpanded}>{primaryTitle}</RouteTitle>
            {subtitle ? <TripSubtitle>{subtitle}</TripSubtitle> : null}
          </HeaderText>
        </HeaderLeft>
        {(airlineBadges.length > 0 || !isPast) && (
          <HeaderRight>
            {!isPast ? (
              <CountdownBadge $isActive={countdownInfo.isUpcoming}>
                <Clock size={16} />
                <span>{countdownInfo.text}</span>
              </CountdownBadge>
            ) : null}
            {airlineBadges.length > 0 ? (
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
            ) : null}
          </HeaderRight>
        )}
      </CardHeader>

      <CollapsibleContent $collapsed={!isExpanded}>
        {isPast ? (
          <>
            <CardDivider />
            <DateRow>
              <DateColumn>
                <DateLabel>Departed</DateLabel>
                <DateValue>{startDateObj ? formatDate(startDateObj, "EEE, MMM d") : "Date TBD"}</DateValue>
                <TimeValue>{startTime}</TimeValue>
                <DateMeta>{startLocation}</DateMeta>
              </DateColumn>
              <DateColumn>
                <DateLabel>Returned</DateLabel>
                <DateValue>{endDateObj ? formatDate(endDateObj, "EEE, MMM d") : "Date TBD"}</DateValue>
                <TimeValue>{endTime}</TimeValue>
                <DateMeta>{endLocation}</DateMeta>
              </DateColumn>
            </DateRow>
            {flightLegs.length > 0 ? (
              <>
                <CardDivider />
                <FlightLegSection>
                  <FlightLegEyebrow>
                    {flightLegs.length === 1 ? "Flight leg" : "Flight legs"}
                  </FlightLegEyebrow>
                  <FlightLegList>
                    {flightLegs.map((flightLeg) => (
                      <FlightLegCard key={flightLeg.key}>
                        <FlightLegTop>
                          <FlightLegDate>{flightLeg.dateLabel}</FlightLegDate>
                          <FlightLegTime>{flightLeg.timeLabel}</FlightLegTime>
                        </FlightLegTop>
                        <FlightLegRoute>{flightLeg.routeLabel}</FlightLegRoute>
                        <FlightLegDetail>{flightLeg.detailLabel}</FlightLegDetail>
                      </FlightLegCard>
                    ))}
                  </FlightLegList>
                </FlightLegSection>
              </>
            ) : null}
          </>
        ) : (
          <>
            <CardDivider />
            <SecondaryMeta>
              <MetaItem>
                <CalendarRange size={16} />
                {dateRange}
              </MetaItem>
              <MetaItem>
                <MapPin size={16} />
                {routeSummary}
              </MetaItem>
            </SecondaryMeta>
          </>
        )}

        <CardDivider />
        <SummaryTags>
          {summaryTags.map((tag) => (
            <SummaryTag key={`${tag.label}-${tag.value}`} $accent={cardTheme.accent}>
              {tag.label === "Nights" ? tag.value : `${tag.value} ${tag.label}`}
            </SummaryTag>
          ))}
        </SummaryTags>

        {infoChips.length > 0 ? (
          <>
            <CardDivider />
            <InfoChipGrid>
              {infoChips.map((chip) => (
                <InfoChipCard key={`${chip.label}-${chip.value}`}>
                  <chip.icon size={16} />
                  <div>
                    <InfoChipLabel>{chip.label}</InfoChipLabel>
                    <InfoChipValue>{chip.value}</InfoChipValue>
                  </div>
                </InfoChipCard>
              ))}
            </InfoChipGrid>
          </>
        ) : null}

        {trip.description ? (
          <>
            <CardDivider />
            <Description>{trip.description}</Description>
          </>
        ) : null}
        {isPast && pastMetrics.length > 0 ? (
          <>
            <CardDivider />
            <PastMetricsContainer>
              {pastMetrics.map((metric) => (
                <PastMetricCard key={metric.key}>
                  <PastMetricIcon $accent={cardTheme.accent}>
                    <metric.icon size={16} />
                  </PastMetricIcon>
                  <PastMetricText>
                    <PastMetricLabel>{metric.label}</PastMetricLabel>
                    <PastMetricValue>{metric.value}</PastMetricValue>
                    {metric.subtitle ? (
                      <PastMetricSubtitle>{metric.subtitle}</PastMetricSubtitle>
                    ) : null}
                  </PastMetricText>
                </PastMetricCard>
              ))}
            </PastMetricsContainer>
          </>
        ) : null}

        <CardDivider />
        <Footer>
          <Tags>
            {trip.tags?.slice(0, 3).map((tag) => (
              <Tag key={tag}>{tag}</Tag>
            ))}
          </Tags>
          {onDelete ? (
            <DeleteButton type="button" onClick={() => onDelete(trip.tripId)}>
              <Trash2 size={16} />
              Delete
            </DeleteButton>
          ) : null}
        </Footer>
      </CollapsibleContent>

      <CollapseIndicator $expanded={isExpanded} $visible={isCollapsible}>
        <ChevronDown size={18} />
        {isExpanded ? "Hide details" : "Show details"}
      </CollapseIndicator>
    </Card>
  );
};

const Card = styled.article<{ $gradientStart: string; $gradientEnd: string; $orb: string; $isPast: boolean }>`
  position: relative;
  padding: clamp(1.3rem, 2.5vw, 2rem);
  border-radius: 26px;
  background: ${({ $gradientStart, $gradientEnd }) =>
    `linear-gradient(135deg, ${$gradientStart} 0%, ${$gradientEnd} 100%)`};
  border: 1px solid rgba(243, 210, 122, 0.14);
  box-shadow: 0 28px 60px rgba(0, 0, 0, 0.28);
  overflow: hidden;
  display: grid;
  gap: 1rem;
  color: #fff;
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  width: 100%;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 36px 74px rgba(0, 0, 0, 0.34);
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
    border-top-left-radius: 22px;
    border-bottom-left-radius: 22px;
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
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1.25rem;
  position: relative;
  z-index: 1;
`;

const HeaderLeft = styled.div`
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 1rem;
  align-items: flex-start;
  flex: 1;
  width: 100%;
`;

const HeaderText = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
`;

const HeaderRight = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 0.55rem;
  flex-shrink: 0;

  @media (max-width: 720px) {
    align-items: flex-start;
  }
`;

const IconCircle = styled.div<{ $accent: string }>`
  width: 42px;
  height: 42px;
  border-radius: 50%;
  background: ${({ $accent }) => `${$accent}22`};
  border: 1px solid rgba(255, 248, 236, 0.12);
  color: ${({ $accent }) => $accent};
  display: flex;
  align-items: center;
  justify-content: center;
`;

const TripLabel = styled.span`
  display: grid;
  gap: 0.18rem;
  font-size: 0.68rem;
  color: rgba(255, 255, 255, 0.8);
`;

const TripLabelText = styled.span`
  letter-spacing: 0.2em;
  text-transform: uppercase;
  line-height: 1;
  font-weight: 700;
`;

const TripLabelDate = styled.span`
  display: block;
  margin-top: 0.08rem;
  font-size: 0.74rem;
  line-height: 1.15;
  letter-spacing: 0.02em;
  text-transform: none;
  color: rgba(255, 255, 255, 0.62);
  font-weight: 500;
`;

const RouteTitle = styled.h3<{ $expanded: boolean }>`
  margin: 0.55rem 0 0;
  font-size: clamp(1.15rem, 1.7vw, 1.45rem);
  font-weight: 700;
  letter-spacing: -0.015em;
  line-height: 1.22;
  width: 100%;
  ${({ $expanded }) =>
    $expanded
      ? `
    display: block;
    overflow: visible;
    white-space: normal;
  `
      : `
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  `}
  word-break: break-word;
`;

const TripSubtitle = styled.p`
  margin: 0.15rem 0 0;
  font-size: 0.82rem;
  color: rgba(255, 255, 255, 0.85);
  width: 100%;
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
  overflow: hidden;
  white-space: normal;
`;

const CountdownBadge = styled.div<{ $isActive: boolean }>`
  padding: 0.65rem 0.95rem;
  border-radius: 999px;
  border: 1px solid rgba(243, 210, 122, 0.16);
  background: ${({ $isActive }) =>
    $isActive ? "rgba(255, 248, 236, 0.08)" : "rgba(255, 248, 236, 0.05)"};
  min-width: 170px;
  display: inline-flex;
  gap: 0.45rem;
  font-size: 0.9rem;
  font-weight: 600;
  line-height: 1.25;
  align-items: center;

  svg {
    color: rgba(255, 255, 255, 0.95);
    flex-shrink: 0;
  }
`;

const BrandBadgeRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 0.45rem;
  flex-wrap: wrap;
`;

const BrandBadge = styled.span`
  width: 36px;
  height: 36px;
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
  color: rgba(248, 250, 252, 0.92);
  font-weight: 700;
  font-size: 0.8rem;
`;

const SecondaryMeta = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 0.75rem;
  position: relative;
  z-index: 1;
`;

const DateRow = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 1rem;

  @media (max-width: 640px) {
    grid-template-columns: minmax(0, 1fr);
  }
`;

const DateColumn = styled.div`
  display: grid;
  gap: 0.2rem;
`;

const DateLabel = styled.span`
  font-size: 0.7rem;
  color: rgba(226, 232, 240, 0.72);
  text-transform: uppercase;
  letter-spacing: 0.08em;
`;

const DateValue = styled.div`
  font-size: 0.95rem;
  font-weight: 650;
  color: #f8fafc;
`;

const TimeValue = styled.div`
  font-size: 0.8rem;
  color: rgba(241, 245, 249, 0.9);
`;

const DateMeta = styled.div`
  font-size: 0.76rem;
  color: rgba(226, 232, 240, 0.72);
`;

const FlightLegSection = styled.div`
  display: grid;
  gap: 0.75rem;
`;

const FlightLegEyebrow = styled.span`
  font-size: 0.68rem;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: rgba(243, 210, 122, 0.82);
  font-weight: 700;
`;

const FlightLegList = styled.div`
  display: grid;
  gap: 0.75rem;
`;

const FlightLegCard = styled.div`
  display: grid;
  gap: 0.24rem;
  padding: 0.8rem 0.95rem;
  border-radius: 16px;
  background: rgba(255, 248, 236, 0.05);
  border: 1px solid rgba(243, 210, 122, 0.12);
`;

const FlightLegTop = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  flex-wrap: wrap;
`;

const FlightLegDate = styled.span`
  font-size: 0.74rem;
  color: rgba(226, 232, 240, 0.72);
  text-transform: uppercase;
  letter-spacing: 0.08em;
`;

const FlightLegTime = styled.span`
  font-size: 0.76rem;
  color: rgba(241, 245, 249, 0.88);
  font-weight: 600;
`;

const FlightLegRoute = styled.div`
  font-size: 0.98rem;
  color: #f8fafc;
  font-weight: 700;
`;

const FlightLegDetail = styled.div`
  font-size: 0.8rem;
  color: rgba(226, 232, 240, 0.78);
`;

const MetaItem = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  padding: 0.65rem 0.85rem;
  border-radius: 18px;
  background: rgba(255, 248, 236, 0.06);
  border: 1px solid rgba(243, 210, 122, 0.12);
  font-size: 0.85rem;

  svg {
    color: rgba(255, 255, 255, 0.85);
  }
`;

const SummaryTags = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
`;

const SummaryTag = styled.span<{ $accent: string }>`
  padding: 0.28rem 0.7rem;
  border-radius: 999px;
  background: rgba(255, 248, 236, 0.08);
  font-size: 0.78rem;
  letter-spacing: 0.03em;
`;

const InfoChipGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 0.75rem;
`;

const InfoChipCard = styled.div`
  display: flex;
  gap: 0.5rem;
  background: rgba(255, 248, 236, 0.06);
  padding: 0.62rem 0.74rem;
  border-radius: 16px;
  border: 1px solid rgba(243, 210, 122, 0.12);

  svg {
    color: rgba(255, 255, 255, 0.9);
  }
`;

const InfoChipLabel = styled.span`
  font-size: 0.7rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  opacity: 0.7;
`;

const InfoChipValue = styled.span`
  display: block;
  font-size: 0.85rem;
  font-weight: 600;
`;

const Description = styled.p`
  margin: 0;
  font-size: 0.88rem;
  line-height: 1.6;
  color: rgba(241, 245, 249, 0.9);
  background: rgba(255, 248, 236, 0.05);
  border: 1px solid rgba(243, 210, 122, 0.12);
  border-radius: 16px;
  padding: 0.75rem 0.85rem;
`;

const CollapsibleContent = styled.div<{ $collapsed: boolean }>`
  overflow: hidden;
  max-height: ${({ $collapsed }) => ($collapsed ? "0px" : "1000px")};
  opacity: ${({ $collapsed }) => ($collapsed ? 0 : 1)};
  pointer-events: ${({ $collapsed }) => ($collapsed ? "none" : "auto")};
  transition: max-height 0.35s ease, opacity 0.25s ease;
  display: grid;
  gap: 0.8rem;
`;

const Footer = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
`;

const PastMetricsContainer = styled.div`
  display: grid;
  gap: 0.65rem;
`;

const PastMetricCard = styled.div`
  display: flex;
  align-items: center;
  gap: 0.7rem;
  background: rgba(255, 248, 236, 0.06);
  border: 1px solid rgba(243, 210, 122, 0.12);
  border-radius: 16px;
  padding: 0.68rem 0.75rem;
`;

const PastMetricIcon = styled.div<{ $accent: string }>`
  width: 34px;
  height: 34px;
  border-radius: 999px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 248, 236, 0.08);
  color: ${({ $accent }) => $accent};
`;

const PastMetricText = styled.div`
  display: grid;
  gap: 0.1rem;
`;

const PastMetricLabel = styled.div`
  font-size: 0.66rem;
  color: rgba(226, 232, 240, 0.7);
  text-transform: uppercase;
  letter-spacing: 0.08em;
`;

const PastMetricValue = styled.div`
  font-size: 0.9rem;
  font-weight: 700;
  color: #f8fafc;
`;

const PastMetricSubtitle = styled.div`
  font-size: 0.72rem;
  color: rgba(226, 232, 240, 0.72);
`;

const Tags = styled.div`
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
  flex: 1;
`;

const Tag = styled.span`
  font-size: 0.72rem;
  padding: 0.3rem 0.65rem;
  border-radius: 999px;
  background: rgba(15, 23, 42, 0.42);
  color: rgba(255, 255, 255, 0.85);
  border: 1px solid rgba(148, 163, 184, 0.25);
`;

const DeleteButton = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  border: none;
  border-radius: 999px;
  padding: 0.5rem 0.95rem;
  background: rgba(231, 35, 64, 0.14);
  color: ${({ theme }) => theme?.colors?.brand?.secondary ?? "#e72340"};
  cursor: pointer;
  font-weight: 600;
  font-size: 0.82rem;
  transition: transform 0.15s ease, background 0.15s ease;
  z-index: 1;

  &:hover {
    background: rgba(231, 35, 64, 0.2);
    transform: translateY(-1px);
  }

  svg {
    width: 16px;
    height: 16px;
  }
`;

const CollapseIndicator = styled.div<{ $expanded: boolean; $visible: boolean }>`
  display: ${({ $visible }) => ($visible ? "flex" : "none")};
  align-items: center;
  justify-content: center;
  gap: 0.4rem;
  padding-top: 0.5rem;
  font-size: 0.8rem;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: rgba(255, 255, 255, 0.75);

  svg {
    transition: transform 0.2s ease;
    transform: rotate(${({ $expanded }) => ($expanded ? 180 : 0)}deg);
  }
`;

const CardDivider = styled.div`
  height: 1px;
  background: rgba(148, 163, 184, 0.22);
`;
