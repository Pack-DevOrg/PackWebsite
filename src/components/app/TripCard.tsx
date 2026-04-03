import styled from "styled-components";
import { CalendarRange, MapPin, Plane, Trash2 } from "lucide-react";
import type { Trip } from "@/api/trips";
import {
  formatTripTitleForDisplay,
  getTripNamingDisplay,
} from "@/utils/tripNaming";
import { getOvernightLocations } from "@/utils/tripTitles";
import { formatLocalizedDate } from "@/i18n/format";

const Card = styled.article`
  display: grid;
  gap: 1.25rem;
  padding: 1.75rem;
  border-radius: 22px;
  background: rgba(9, 8, 20, 0.78);
  border: 1px solid rgba(255, 255, 255, 0.06);
  box-shadow: 0 24px 50px rgba(5, 3, 12, 0.55);
  position: relative;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1rem;
`;

const TitleGroup = styled.div`
  display: grid;
  gap: 0.45rem;
`;

const Title = styled.h3`
  margin: 0;
  font-size: 1.25rem;
  font-weight: 600;
  letter-spacing: -0.01em;
`;

const Subtitle = styled.div`
  font-size: 0.95rem;
  color: ${({ theme }) => theme?.colors?.neutral?.gray200 ?? "#d5d6dc"};
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
`;

const CustomTitle = styled.span`
  margin: 0;
  font-size: 0.95rem;
  color: ${({ theme }) => theme?.colors?.neutral?.gray150 ?? "#e1e1f0"};
`;

const StatusBadge = styled.span<{ $status: string }>`
  font-size: 0.82rem;
  font-weight: 600;
  padding: 0.35rem 0.9rem;
  border-radius: 999px;
  text-transform: capitalize;
  background: ${({ $status, theme }) =>
    $status === "cancelled"
      ? "rgba(231, 35, 64, 0.15)"
      : theme?.colors?.brand?.primary
      ? "rgba(240, 198, 45, 0.16)"
      : "rgba(240, 198, 45, 0.16)"};
  color: ${({ $status, theme }) =>
    $status === "cancelled"
      ? theme?.colors?.brand?.secondary ?? "#e72340"
      : theme?.colors?.brand?.primary ?? "#f0c62d"};
  border: 1px solid
    ${({ $status }) =>
      $status === "cancelled" ? "rgba(231, 35, 64, 0.24)" : "rgba(240, 198, 45, 0.28)"};
`;

const MetaRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.9rem 1.25rem;
  font-size: 0.9rem;
  color: ${({ theme }) => theme?.colors?.neutral?.gray150 ?? "#e1e1f0"};

  span {
    display: inline-flex;
    align-items: center;
    gap: 0.45rem;
  }
`;

const Description = styled.p`
  margin: 0;
  font-size: 0.95rem;
  line-height: 1.55;
  color: ${({ theme }) => theme?.colors?.neutral?.gray200 ?? "#d5d6dc"};
`;

const Footer = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
`;

const Metrics = styled.div`
  display: inline-flex;
  gap: 0.8rem;
  font-size: 0.85rem;
  color: ${({ theme }) => theme?.colors?.neutral?.gray200 ?? "#d5d6dc"};

  span {
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
  }
`;

const DeleteButton = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  border: none;
  border-radius: 999px;
  padding: 0.5rem 0.95rem;
  background: rgba(231, 35, 64, 0.14);
  color: ${({ theme }) => theme?.colors?.brand?.secondary ?? "#e72340"};
  cursor: pointer;
  font-weight: 500;
  transition: transform 0.15s ease, opacity 0.15s ease;

  &:hover {
    opacity: 0.85;
    transform: translateY(-1px);
  }
`;

interface TripCardProps {
  readonly trip: Trip;
  readonly onDelete?: (tripId: string) => void;
  readonly isPast?: boolean;
}

const formatDateRange = (start: string, end: string): string => {
  const startDate = new Date(`${start}T00:00:00Z`);
  const endDate = new Date(`${end}T00:00:00Z`);
  const startLabel = formatLocalizedDate(startDate, {
    month: "short",
    day: "numeric",
  });
  if (start === end) {
    return startLabel;
  }
  const endLabel = formatLocalizedDate(endDate, {
    month: "short",
    day: "numeric",
  });
  return `${startLabel} – ${endLabel}`;
};

const extractPrimaryLocation = (trip: Trip): string | null => {
  if (trip.flights && trip.flights.length > 0) {
    const firstFlight = trip.flights[0];
    return firstFlight.arrivalAirport ?? firstFlight.destination ?? null;
  }
  if (trip.hotels && trip.hotels.length > 0) {
    return trip.hotels[0].city ?? trip.hotels[0].name ?? null;
  }
  return null;
};

export const TripCard: React.FC<TripCardProps> = ({ trip, onDelete, isPast }) => {
  const naming = getTripNamingDisplay(trip, { fallbackTitle: trip.title || "Trip" });
  const location = extractPrimaryLocation(trip);
  const dateRange = formatDateRange(trip.startDate, trip.endDate);
  const nights =
    Math.max(
      1,
      Math.round(
        (new Date(`${trip.endDate}T00:00:00Z`).getTime() -
          new Date(`${trip.startDate}T00:00:00Z`).getTime()) /
          (1000 * 60 * 60 * 24)
      )
    ) ?? 1;
  const overnightStops = getOvernightLocations(trip);
  const pastTitle = formatTripTitleForDisplay(trip.title || naming.routeTitle);
  const routeLine = isPast ? null : naming.routeOnlyDisplay ?? naming.routeTitle;
  const showLocationMeta = !isPast && Boolean(location);
  const showOvernightMeta = !isPast && overnightStops.length > 0;

  return (
    <Card>
      <Header>
        <TitleGroup>
          <Title>{isPast ? pastTitle : naming.routeTitle}</Title>
          {routeLine ? (
            <CustomTitle>{routeLine}</CustomTitle>
          ) : !isPast && naming.subtitle ? (
            <CustomTitle>{naming.subtitle}</CustomTitle>
          ) : null}
          <Subtitle>
            <CalendarRange size={18} /> {dateRange} • {nights} night
            {nights > 1 ? "s" : ""}
          </Subtitle>
        </TitleGroup>
        <StatusBadge $status={trip.status}>{trip.status}</StatusBadge>
      </Header>

      <MetaRow>
        {showLocationMeta ? (
          <span>
            <MapPin size={16} /> {location}
          </span>
        ) : null}
        {showOvernightMeta ? (
          <span>
            <Plane size={16} /> Overnight: {overnightStops.join(" • ")}
          </span>
        ) : null}
        {trip.confirmationCodes?.length ? (
          <span>Codes: {trip.confirmationCodes.join(", ")}</span>
        ) : null}
      </MetaRow>

      {trip.description ? <Description>{trip.description}</Description> : null}

      <Footer>
        <Metrics>
          <span>
            <Plane size={16} /> {trip.flights?.length ?? 0} flight
            {(trip.flights?.length ?? 0) !== 1 ? "s" : ""}
          </span>
          {trip.hotels?.length ? (
            <span>
              <CalendarRange size={16} /> {trip.hotels?.length ?? 0} stay
              {(trip.hotels?.length ?? 0) !== 1 ? "s" : ""}
            </span>
          ) : null}
        </Metrics>
        {onDelete ? (
          <DeleteButton onClick={() => onDelete(trip.tripId)}>
            <Trash2 size={16} />
            Delete
          </DeleteButton>
        ) : null}
      </Footer>
    </Card>
  );
};
