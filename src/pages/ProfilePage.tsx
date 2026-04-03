import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import styled from "styled-components";
import {
  AlertCircle,
  BadgeCheck,
  Briefcase,
  Car,
  CreditCard,
  Hotel,
  Mail,
  Phone,
  Plane,
  Shield,
  UserRound,
} from "lucide-react";
import { useAuth } from "@/auth/AuthContext";
import { useApiClient } from "@/api/useApiClient";
import { fetchUserPreferences } from "@/api/userPreferences";
import { useI18n } from "@/i18n/I18nProvider";
import {
  createDefaultUserPreferences,
  type UserPreferences,
} from "@/schemas/user-preferences";
import { formatLocalizedDate } from "@/i18n/format";
import type { SupportedLocale } from "@/i18n/config";

const Page = styled.div`
  display: grid;
  gap: 1.5rem;
`;

const Hero = styled.section`
  display: grid;
  gap: 1.25rem;
  padding: clamp(1.25rem, 2.5vw, 1.75rem);
  border-radius: 24px;
  background:
    radial-gradient(circle at top right, rgba(33, 150, 243, 0.16), transparent 36%),
    radial-gradient(circle at top left, rgba(240, 198, 45, 0.18), transparent 34%),
    linear-gradient(135deg, rgba(18, 18, 18, 0.96) 0%, rgba(30, 30, 30, 0.92) 100%);
  border: 1px solid rgba(255, 255, 255, 0.08);
  box-shadow: 0 28px 64px rgba(5, 3, 12, 0.38);
`;

const HeroTop = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1rem;
  flex-wrap: wrap;
`;

const Identity = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
`;

const ProfileAvatar = styled.div`
  width: 64px;
  height: 64px;
  border-radius: 50%;
  overflow: hidden;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.12);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: #f8fafc;
  font-size: 1.2rem;
  font-weight: 700;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
`;

const IdentityText = styled.div`
  display: grid;
  gap: 0.3rem;

  h1 {
    margin: 0;
    font-size: clamp(1.5rem, 2.4vw, 2rem);
    line-height: 1.1;
  }

  p {
    margin: 0;
    color: ${({ theme }) => theme?.colors?.neutral?.gray200 ?? "#d5d6dc"};
  }
`;

const StatusPill = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.6rem 0.9rem;
  border-radius: 999px;
  background: rgba(76, 175, 80, 0.12);
  color: #82e69a;
  border: 1px solid rgba(76, 175, 80, 0.24);
  font-size: 0.82rem;
  font-weight: 600;
`;

const HeroStats = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.6rem;
`;

const StatChip = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  padding: 0.55rem 0.75rem;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.08);
  color: #f8fafc;
  font-size: 0.82rem;
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 1rem;

  @media (max-width: 980px) {
    grid-template-columns: minmax(0, 1fr);
  }
`;

const Card = styled.section`
  display: grid;
  gap: 1rem;
  padding: 1.15rem 1.2rem;
  border-radius: 22px;
  background: linear-gradient(135deg, rgba(18, 18, 18, 0.96) 0%, rgba(30, 30, 30, 0.92) 100%);
  border: 1px solid rgba(255, 255, 255, 0.08);
`;

const CardHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 0.8rem;

  h2 {
    margin: 0;
    font-size: 1rem;
  }

  p {
    margin: 0.15rem 0 0;
    font-size: 0.84rem;
    color: ${({ theme }) => theme?.colors?.neutral?.gray200 ?? "#d5d6dc"};
  }
`;

const CardIcon = styled.div<{ $tone: string }>`
  width: 42px;
  height: 42px;
  border-radius: 14px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: ${({ $tone }) => `${$tone}1F`};
  color: ${({ $tone }) => $tone};
  flex-shrink: 0;
`;

const PillRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.55rem;
`;

const Pill = styled.span<{ $emphasis?: boolean }>`
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.45rem 0.7rem;
  border-radius: 999px;
  background: ${({ $emphasis }) =>
    $emphasis ? "rgba(240, 198, 45, 0.12)" : "rgba(255, 255, 255, 0.05)"};
  border: 1px solid
    ${({ $emphasis }) =>
      $emphasis ? "rgba(240, 198, 45, 0.25)" : "rgba(255, 255, 255, 0.08)"};
  color: ${({ $emphasis }) => ($emphasis ? "#f6d769" : "#f8fafc")};
  font-size: 0.8rem;
`;

const Section = styled.div`
  display: grid;
  gap: 0.55rem;
`;

const SectionLabel = styled.div`
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: rgba(226, 232, 240, 0.66);
`;

const List = styled.div`
  display: grid;
  gap: 0.6rem;
`;

const ListRow = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  padding: 0.7rem 0.85rem;
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.07);
`;

const ListMain = styled.div`
  display: grid;
  gap: 0.18rem;

  strong {
    font-size: 0.92rem;
  }

  span {
    color: ${({ theme }) => theme?.colors?.neutral?.gray200 ?? "#d5d6dc"};
    font-size: 0.8rem;
  }
`;

const LoadingState = styled.div`
  min-height: 40vh;
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${({ theme }) => theme?.colors?.neutral?.gray200 ?? "#d5d6dc"};
`;

const EmptyState = styled.div`
  display: grid;
  gap: 0.65rem;
  padding: 1rem;
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px dashed rgba(255, 255, 255, 0.14);
  color: ${({ theme }) => theme?.colors?.neutral?.gray200 ?? "#d5d6dc"};
  font-size: 0.88rem;
`;

const maskIdentifier = (value?: string): string | null => {
  if (!value) {
    return null;
  }
  const trimmed = value.trim();
  if (trimmed.length <= 3) {
    return trimmed;
  }
  return `${trimmed.slice(0, 3)}${"•".repeat(Math.max(0, trimmed.length - 3))}`;
};

const formatLabel = (
  value: string | null | undefined,
  fallback: string
): string => {
  if (!value) {
    return fallback;
  }
  return value
    .replace(/_/g, " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
};

const formatDate = (
  value: string | null | undefined,
  locale: SupportedLocale
): string | null => {
  if (!value) {
    return null;
  }
  const parsed = Date.parse(value);
  if (Number.isNaN(parsed)) {
    return null;
  }
  return formatLocalizedDate(new Date(parsed), {
    month: "short",
    day: "numeric",
    year: "numeric",
  }, locale);
};

const getUserInitials = (name?: string, email?: string): string => {
  if (name?.trim()) {
    return name
      .split(" ")
      .filter(Boolean)
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
  }
  return (email?.slice(0, 2) ?? "DA").toUpperCase();
};

const buildTravelerStats = (
  preferences: UserPreferences,
  localizedContent: {
    travelerStats: {
      ktnSaved: string;
      redressSaved: string;
      emergencyContactSet: string;
    };
  }
): string[] => {
  const stats: string[] = [];
  const profile = preferences.travelerProfile;
  if (profile.travelPreferences.homeAirport) {
    stats.push(profile.travelPreferences.homeAirport);
  }
  if (profile.travelDocuments.trustedTraveler.knownTravelerNumber) {
    stats.push(localizedContent.travelerStats.ktnSaved);
  }
  if (profile.travelDocuments.trustedTraveler.redressNumber) {
    stats.push(localizedContent.travelerStats.redressSaved);
  }
  if (profile.emergencyContact.name) {
    stats.push(localizedContent.travelerStats.emergencyContactSet);
  }
  return stats;
};

export const ProfilePage: React.FC = () => {
  const { user } = useAuth();
  const { locale, languageTag } = useI18n();
  const client = useApiClient();
  const localizedContent =
    locale === "es"
      ? {
          loading: "Cargando tu información de viaje…",
          travelerProfileFallback: "Perfil del viajero",
          signedInAccount: "Cuenta conectada",
          synced: "Información de viaje sincronizada",
          travelInformation: "Información de viaje",
          errorTitle: "No pudimos cargar la información de viaje más reciente.",
          errorBody:
            "Mostrando por ahora la estructura del perfil con valores seguros. Intenta actualizar en un momento.",
          travelerProfile: "Perfil del viajero",
          travelerProfileBody:
            "Aeropuerto base, pasaporte, datos de viajero confiable y contacto de emergencia.",
          noHomeAirport: "Sin aeropuerto base",
          noKtn: "Sin KTN",
          noRedress: "Sin número de reparación",
          noPassportNationality: "Sin nacionalidad de pasaporte",
          emergencyContact: "Contacto de emergencia",
          relationshipNotSet: "Relación no definida",
          emergencyContactEmpty: "Aún no se agregó un contacto de emergencia.",
          travelDocuments: "Documentos de viaje",
          noPreferredDocument: "Sin documento preferido",
          passportExpiryPrefix: "Vence pasaporte",
          notSet: "sin definir",
          visaChecksPrefix: "Verificación de visa",
          on: "activada",
          off: "desactivada",
          flights: "Vuelos",
          flightsBody:
            "Cabina, asiento, rutas y preferencias de lealtad aérea.",
          nonstopOnly: "Solo sin escalas",
          stopsMax: "{count} escalas máx.",
          anyStopsMax: "Cualquier número de escalas",
          noRedEye: "Sin vuelos nocturnos",
          searchPriorities: "Prioridades de búsqueda",
          preferredAirlines: "Aerolíneas preferidas",
          membershipNumberNotSet: "Número de membresía no definido",
          noAirlinePrograms: "Aún no hay programas de lealtad aérea guardados.",
          hotels: "Hoteles",
          hotelsBody:
            "Habitación, régimen, amenidades y preferencias de lealtad hotelera.",
          standardRoom: "Habitación estándar",
          roomOnly: "Solo habitación",
          stars: "{count}+ estrellas",
          anyStarRating: "Cualquier calificación",
          smoking: "Fumadores",
          nonSmoking: "No fumadores",
          amenities: "Amenidades",
          noHotelAmenities: "Sin amenidades de hotel guardadas",
          hotelPrograms: "Programas hoteleros",
          noHotelPrograms: "Aún no hay programas hoteleros guardados.",
          cars: "Autos",
          carsBody:
            "Marcas de renta, tipos de vehículo y preferencias de reserva.",
          noVehicleType: "Sin tipo de vehículo",
          travelInsuranceOn: "Seguro de viaje activado",
          travelInsuranceOff: "Seguro de viaje desactivado",
          rentalCompanies: "Compañías de renta",
          noCarPrograms: "Aún no hay membresías de renta guardadas.",
          vehicleTypes: "Tipos de vehículo",
          noCarTypes: "Sin preferencias de tipo de auto guardadas",
          passportSuffix: "pasaporte",
          ktnPrefix: "KTN",
          redressPrefix: "Reparación",
          pointsSuffix: "pts",
          travelerStats: {
            ktnSaved: "KTN guardado",
            redressSaved: "Reparación guardada",
            emergencyContactSet: "Contacto de emergencia listo",
          },
        }
      : {
          loading: "Loading your travel information…",
          travelerProfileFallback: "Traveler profile",
          signedInAccount: "Signed-in account",
          synced: "Travel information synced",
          travelInformation: "Travel Information",
          errorTitle: "We couldn’t load the latest travel information.",
          errorBody:
            "Showing the profile structure with safe defaults for now. Try refreshing in a moment.",
          travelerProfile: "Traveler Profile",
          travelerProfileBody:
            "Home airport, passport, trusted traveler details, and emergency contact.",
          noHomeAirport: "No home airport",
          noKtn: "No KTN",
          noRedress: "No redress",
          noPassportNationality: "No passport nationality",
          emergencyContact: "Emergency Contact",
          relationshipNotSet: "Relationship not set",
          emergencyContactEmpty: "Emergency contact not added yet.",
          travelDocuments: "Travel Documents",
          noPreferredDocument: "No preferred document",
          passportExpiryPrefix: "Passport expiry",
          notSet: "not set",
          visaChecksPrefix: "Visa checks",
          on: "on",
          off: "off",
          flights: "Flights",
          flightsBody:
            "Cabin, seat, routing, and airline loyalty preferences.",
          nonstopOnly: "Nonstop only",
          stopsMax: "{count} stops max",
          anyStopsMax: "Any stops max",
          noRedEye: "No red-eye",
          searchPriorities: "Search Priorities",
          preferredAirlines: "Preferred Airlines",
          membershipNumberNotSet: "Membership number not set",
          noAirlinePrograms: "No airline loyalty programs saved yet.",
          hotels: "Hotels",
          hotelsBody:
            "Room, board, amenity, and hotel loyalty preferences.",
          standardRoom: "Standard room",
          roomOnly: "Room only",
          stars: "{count}+ stars",
          anyStarRating: "Any star rating",
          smoking: "Smoking",
          nonSmoking: "Non-smoking",
          amenities: "Amenities",
          noHotelAmenities: "No hotel amenities saved",
          hotelPrograms: "Hotel Programs",
          noHotelPrograms: "No hotel loyalty programs saved yet.",
          cars: "Cars",
          carsBody:
            "Rental brands, vehicle types, and booking preferences.",
          noVehicleType: "No vehicle type",
          travelInsuranceOn: "Travel insurance on",
          travelInsuranceOff: "Travel insurance off",
          rentalCompanies: "Rental Companies",
          noCarPrograms: "No car-rental memberships saved yet.",
          vehicleTypes: "Vehicle Types",
          noCarTypes: "No car type preferences saved",
          passportSuffix: "passport",
          ktnPrefix: "KTN",
          redressPrefix: "Redress",
          pointsSuffix: "pts",
          travelerStats: {
            ktnSaved: "KTN saved",
            redressSaved: "Redress saved",
            emergencyContactSet: "Emergency contact set",
          },
        };

  const fallbackPreferences = useMemo(
    () => createDefaultUserPreferences(user?.sub ?? "", user?.email ?? ""),
    [user?.email, user?.sub]
  );

  const preferencesQuery = useQuery({
    queryKey: ["user-preferences"],
    queryFn: () =>
      fetchUserPreferences(client, {
        sub: user?.sub,
        email: user?.email,
      }),
    staleTime: 5 * 60 * 1000,
  });

  const preferences = preferencesQuery.data ?? fallbackPreferences;
  const travelerStats = buildTravelerStats(preferences, localizedContent);
  const flightPriorities = preferences.flightPreferences.searchPriorities ?? [];
  const hotelPriorities = preferences.hotelPreferences.searchPriorities ?? [];
  const carPriorities = preferences.carRentalPreferences.searchPriorities ?? [];

  if (preferencesQuery.isLoading && !preferencesQuery.data) {
    return <LoadingState>{localizedContent.loading}</LoadingState>;
  }

  return (
    <Page>
      <Hero>
        <HeroTop>
          <Identity>
            <ProfileAvatar aria-hidden="true">
              {user?.picture ? <img src={user.picture} alt="" /> : getUserInitials(user?.name, user?.email)}
            </ProfileAvatar>
            <IdentityText>
              <h1>{user?.name ?? localizedContent.travelerProfileFallback}</h1>
              <p>{user?.email ?? localizedContent.signedInAccount}</p>
            </IdentityText>
          </Identity>
          <StatusPill>
            <BadgeCheck size={16} />
            {localizedContent.synced}
          </StatusPill>
        </HeroTop>

        <HeroStats>
          <StatChip>
            <UserRound size={14} />
            {localizedContent.travelInformation}
          </StatChip>
          {travelerStats.map((stat) => (
            <StatChip key={stat}>{stat}</StatChip>
          ))}
        </HeroStats>
      </Hero>

      {preferencesQuery.isError ? (
        <EmptyState>
          <strong>{localizedContent.errorTitle}</strong>
          <span>{localizedContent.errorBody}</span>
        </EmptyState>
      ) : null}

      <Grid>
        <Card>
          <CardHeader>
            <CardIcon $tone="#F15A72">
              <UserRound size={18} />
            </CardIcon>
            <div>
              <h2>{localizedContent.travelerProfile}</h2>
              <p>{localizedContent.travelerProfileBody}</p>
            </div>
          </CardHeader>

          <PillRow>
            <Pill>{preferences.travelerProfile.travelPreferences.homeAirport || localizedContent.noHomeAirport}</Pill>
            <Pill>{maskIdentifier(preferences.travelerProfile.travelDocuments.trustedTraveler.knownTravelerNumber) ? `${localizedContent.ktnPrefix} ${maskIdentifier(preferences.travelerProfile.travelDocuments.trustedTraveler.knownTravelerNumber)}` : localizedContent.noKtn}</Pill>
            <Pill>{maskIdentifier(preferences.travelerProfile.travelDocuments.trustedTraveler.redressNumber) ? `${localizedContent.redressPrefix} ${maskIdentifier(preferences.travelerProfile.travelDocuments.trustedTraveler.redressNumber)}` : localizedContent.noRedress}</Pill>
            <Pill>{preferences.travelerProfile.travelDocuments.passport.nationality ? `${preferences.travelerProfile.travelDocuments.passport.nationality} ${localizedContent.passportSuffix}` : localizedContent.noPassportNationality}</Pill>
          </PillRow>

          <Section>
            <SectionLabel>{localizedContent.emergencyContact}</SectionLabel>
            {preferences.travelerProfile.emergencyContact.name ? (
              <ListRow>
                <ListMain>
                  <strong>{preferences.travelerProfile.emergencyContact.name}</strong>
                  <span>{preferences.travelerProfile.emergencyContact.relationship || localizedContent.relationshipNotSet}</span>
                </ListMain>
                <ListMain>
                  {preferences.travelerProfile.emergencyContact.phone ? (
                    <span><Phone size={13} /> {preferences.travelerProfile.emergencyContact.phone}</span>
                  ) : null}
                  {preferences.travelerProfile.emergencyContact.email ? (
                    <span><Mail size={13} /> {preferences.travelerProfile.emergencyContact.email}</span>
                  ) : null}
                </ListMain>
              </ListRow>
            ) : (
              <EmptyState>{localizedContent.emergencyContactEmpty}</EmptyState>
            )}
          </Section>

          <Section>
            <SectionLabel>{localizedContent.travelDocuments}</SectionLabel>
            <PillRow>
              <Pill>
                <Shield size={14} />
                {preferences.travelerProfile.documentPreferences.preferredDocumentType
                  ? formatLabel(preferences.travelerProfile.documentPreferences.preferredDocumentType, localizedContent.noPreferredDocument)
                  : localizedContent.noPreferredDocument}
              </Pill>
              <Pill>
                {localizedContent.passportExpiryPrefix} {formatDate(preferences.travelerProfile.travelDocuments.passport.expiryDate, locale) ?? localizedContent.notSet}
              </Pill>
              <Pill>{localizedContent.visaChecksPrefix} {preferences.travelerProfile.documentPreferences.visaRequirementCheck ? localizedContent.on : localizedContent.off}</Pill>
            </PillRow>
          </Section>
        </Card>

        <Card>
          <CardHeader>
            <CardIcon $tone="#2196F3">
              <Plane size={18} />
            </CardIcon>
            <div>
              <h2>{localizedContent.flights}</h2>
              <p>{localizedContent.flightsBody}</p>
            </div>
          </CardHeader>

          <PillRow>
            <Pill $emphasis>{formatLabel(preferences.flightPreferences.preferredCabinClass, localizedContent.notSet)}</Pill>
            <Pill>{formatLabel(preferences.flightPreferences.fareType, localizedContent.notSet)}</Pill>
            <Pill>{formatLabel(preferences.flightPreferences.preferredSeatType, localizedContent.notSet)}</Pill>
            <Pill>{preferences.flightPreferences.maxStops === 0 ? localizedContent.nonstopOnly : preferences.flightPreferences.maxStops != null ? localizedContent.stopsMax.replace("{count}", String(preferences.flightPreferences.maxStops)) : localizedContent.anyStopsMax}</Pill>
            {preferences.flightPreferences.avoidRedEyeFlights ? <Pill>{localizedContent.noRedEye}</Pill> : null}
          </PillRow>

          <Section>
            <SectionLabel>{localizedContent.searchPriorities}</SectionLabel>
            <PillRow>
              {flightPriorities.map((priority, index) => (
                <Pill key={priority} $emphasis={index === 0}>
                  {formatLabel(priority, localizedContent.notSet)}
                </Pill>
              ))}
            </PillRow>
          </Section>

          <Section>
            <SectionLabel>{localizedContent.preferredAirlines}</SectionLabel>
            {preferences.flightPreferences.loyaltyPrograms.length > 0 ? (
              <List>
                {preferences.flightPreferences.loyaltyPrograms.slice(0, 5).map((program) => (
                  <ListRow key={program.id}>
                    <ListMain>
                      <strong>{program.airlineName || program.airlineCode}</strong>
                      <span>{program.membershipNumber || localizedContent.membershipNumberNotSet}</span>
                    </ListMain>
                    <ListMain>
                      {program.tier ? <span>{program.tier}</span> : null}
                      {typeof program.pointsBalance === "number" ? <span>{program.pointsBalance.toLocaleString(languageTag)} {localizedContent.pointsSuffix}</span> : null}
                    </ListMain>
                  </ListRow>
                ))}
              </List>
            ) : (
              <EmptyState>{localizedContent.noAirlinePrograms}</EmptyState>
            )}
          </Section>
        </Card>

        <Card>
          <CardHeader>
            <CardIcon $tone="#F0C62D">
              <Hotel size={18} />
            </CardIcon>
            <div>
              <h2>{localizedContent.hotels}</h2>
              <p>{localizedContent.hotelsBody}</p>
            </div>
          </CardHeader>

          <PillRow>
            <Pill $emphasis>
              {preferences.hotelPreferences.preferredRoomTypes[0]
                ? formatLabel(
                    preferences.hotelPreferences.preferredRoomTypes[0],
                    localizedContent.standardRoom
                  )
                : localizedContent.standardRoom}
            </Pill>
            <Pill>
              {preferences.hotelPreferences.boardTypes[0]
                ? formatLabel(
                    preferences.hotelPreferences.boardTypes[0],
                    localizedContent.roomOnly
                  )
                : localizedContent.roomOnly}
            </Pill>
            <Pill>
              {preferences.hotelPreferences.minStarRating
                ? localizedContent.stars.replace(
                    "{count}",
                    String(preferences.hotelPreferences.minStarRating)
                  )
                : localizedContent.anyStarRating}
            </Pill>
            <Pill>
              {preferences.hotelPreferences.smokingPreference
                ? localizedContent.smoking
                : localizedContent.nonSmoking}
            </Pill>
          </PillRow>

          <Section>
            <SectionLabel>{localizedContent.amenities}</SectionLabel>
            <PillRow>
              {preferences.hotelPreferences.hotelAmenities.length > 0 ? (
                preferences.hotelPreferences.hotelAmenities.slice(0, 8).map((amenity) => (
                  <Pill key={amenity}>
                    {formatLabel(amenity, localizedContent.notSet)}
                  </Pill>
                ))
              ) : (
                <Pill>{localizedContent.noHotelAmenities}</Pill>
              )}
            </PillRow>
          </Section>

          <Section>
            <SectionLabel>{localizedContent.hotelPrograms}</SectionLabel>
            {preferences.hotelPreferences.loyaltyPrograms.length > 0 ? (
              <List>
                {preferences.hotelPreferences.loyaltyPrograms.slice(0, 5).map((program) => (
                  <ListRow key={program.id}>
                    <ListMain>
                      <strong>{program.hotelChain || program.hotelChainCode}</strong>
                      <span>{program.membershipNumber || localizedContent.membershipNumberNotSet}</span>
                    </ListMain>
                    <ListMain>
                      {program.tier ? <span>{program.tier}</span> : null}
                      {typeof program.pointsBalance === "number" ? (
                        <span>
                          {program.pointsBalance.toLocaleString(languageTag)}{" "}
                          {localizedContent.pointsSuffix}
                        </span>
                      ) : null}
                    </ListMain>
                  </ListRow>
                ))}
              </List>
            ) : (
              <EmptyState>{localizedContent.noHotelPrograms}</EmptyState>
            )}
          </Section>

          <Section>
            <SectionLabel>{localizedContent.searchPriorities}</SectionLabel>
            <PillRow>
              {hotelPriorities.map((priority, index) => (
                <Pill key={priority} $emphasis={index === 0}>
                  {formatLabel(priority, localizedContent.notSet)}
                </Pill>
              ))}
            </PillRow>
          </Section>
        </Card>

        <Card>
          <CardHeader>
            <CardIcon $tone="#FF9800">
              <Car size={18} />
            </CardIcon>
            <div>
              <h2>{localizedContent.cars}</h2>
              <p>{localizedContent.carsBody}</p>
            </div>
          </CardHeader>

          <PillRow>
            <Pill $emphasis>
              {preferences.carRentalPreferences.preferredCarTypes[0]
                ? formatLabel(
                    preferences.carRentalPreferences.preferredCarTypes[0],
                    localizedContent.noVehicleType
                  )
                : localizedContent.noVehicleType}
            </Pill>
            <Pill>
              {formatLabel(
                preferences.bookingPreferences.upgradePreference,
                localizedContent.notSet
              )}
            </Pill>
            <Pill>
              {preferences.travelRequirements.travelInsurancePreference
                ? localizedContent.travelInsuranceOn
                : localizedContent.travelInsuranceOff}
            </Pill>
            <Pill>
              {formatLabel(
                preferences.bookingPreferences.budgetRangePreference,
                localizedContent.notSet
              )}
            </Pill>
          </PillRow>

          <Section>
            <SectionLabel>{localizedContent.rentalCompanies}</SectionLabel>
            {preferences.carRentalPreferences.loyaltyPrograms.length > 0 ? (
              <List>
                {preferences.carRentalPreferences.loyaltyPrograms.slice(0, 5).map((program) => (
                  <ListRow key={program.id}>
                    <ListMain>
                      <strong>{program.company || program.companyCode}</strong>
                      <span>{program.membershipNumber || localizedContent.membershipNumberNotSet}</span>
                    </ListMain>
                    <ListMain>{program.tier ? <span>{program.tier}</span> : null}</ListMain>
                  </ListRow>
                ))}
              </List>
            ) : (
              <EmptyState>{localizedContent.noCarPrograms}</EmptyState>
            )}
          </Section>

          <Section>
            <SectionLabel>{localizedContent.vehicleTypes}</SectionLabel>
            <PillRow>
              {preferences.carRentalPreferences.preferredCarTypes.length > 0 ? (
                preferences.carRentalPreferences.preferredCarTypes.slice(0, 6).map((type) => (
                  <Pill key={type}>{formatLabel(type, localizedContent.notSet)}</Pill>
                ))
              ) : (
                <Pill>{localizedContent.noCarTypes}</Pill>
              )}
            </PillRow>
          </Section>

          <Section>
            <SectionLabel>{localizedContent.searchPriorities}</SectionLabel>
            <PillRow>
              {carPriorities.map((priority, index) => (
                <Pill key={priority} $emphasis={index === 0}>
                  {formatLabel(priority, localizedContent.notSet)}
                </Pill>
              ))}
            </PillRow>
          </Section>
        </Card>
      </Grid>
    </Page>
  );
};

export default ProfilePage;
