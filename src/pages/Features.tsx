import React from "react";
import styled from "styled-components";
import {
  MessageSquareText,
  PlaneTakeoff,
  Calendar,
  Globe,
  Smartphone,
  Zap,
  Shield,
  Users,
  MapPin,
  Clock,
  Heart,
  Brain,
  Map,
  BadgeCheck,
  RefreshCw,
  Link2,
  UserRound,
  Share2,
  Receipt,
} from "lucide-react";
import WaitlistForm from "../components/WaitlistForm";
import PrefetchLink from "../components/PrefetchLink";
import { useMountEffect } from "../hooks/useMountEffect";
import { useI18n } from "@/i18n/I18nProvider";
import {
  capabilityPageDefinitionMap,
  capabilityPageDefinitions,
  type CapabilityPageSlug,
} from "@/content/capabilityPages";

const FeaturesContainer = styled.section`
  max-width: 1200px;
  margin: 0 auto;
  padding: var(--space-4) var(--space-3);

  @media (min-width: 768px) {
    padding: var(--space-5) var(--space-4);
  }
`;

const PageHeader = styled.div`
  width: min(100%, 46rem);
  margin-left: auto;
  margin-right: auto;
  text-align: center;
  margin-bottom: var(--space-5);
  display: grid;
  justify-items: center;
`;

const Title = styled.h1`
  font-size: var(--font-size-2xl);
  margin-bottom: var(--space-2);
  background: linear-gradient(90deg, #fff, #e0e0e0);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  text-align: center;

  @media (min-width: 768px) {
    font-size: var(--font-size-3xl);
  }
`;

const Subtitle = styled.p`
  font-size: var(--font-size-large);
  color: var(--color-text-secondary);
  margin-bottom: var(--space-4);
  max-width: 600px;
  margin-left: auto;
  margin-right: auto;
  line-height: 1.6;
  text-align: center;
`;

const HeroFeature = styled.div`
  background: rgba(255, 255, 255, 0.03);
  border-radius: var(--border-radius);
  border: 1px solid rgba(255, 255, 255, 0.05);
  padding: var(--space-5);
  margin-bottom: var(--space-5);
  text-align: center;
  position: relative;
  overflow: hidden;

  &::before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 2px;
    background: linear-gradient(
      90deg,
      transparent,
      var(--color-accent),
      transparent
    );
    opacity: 0.7;
  }
`;

const HeroIcon = styled.div`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 80px;
  height: 80px;
  background: rgba(249, 47, 96, 0.1);
  border-radius: 50%;
  margin-bottom: var(--space-3);
  color: var(--color-accent);

  svg {
    width: 40px;
    height: 40px;
    filter: drop-shadow(0 0 12px rgba(249, 47, 96, 0.5));
  }
`;

const HeroTitle = styled.h2`
  font-size: var(--font-size-xl);
  margin-bottom: var(--space-2);
  color: var(--color-text-primary);
`;

const HeroDescription = styled.p`
  font-size: var(--font-size-medium);
  color: var(--color-text-secondary);
  line-height: 1.6;
  max-width: 500px;
  margin: 0 auto;
`;

const FeaturesGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--space-4);
  margin-bottom: var(--space-5);

  @media (min-width: 768px) {
    grid-template-columns: repeat(2, 1fr);
  }

  @media (min-width: 1024px) {
    grid-template-columns: repeat(3, 1fr);
  }
`;

const FeatureCard = styled(PrefetchLink)`
  background: rgba(255, 255, 255, 0.03);
  border-radius: var(--border-radius);
  border: 1px solid rgba(255, 255, 255, 0.05);
  padding: var(--space-4);
  display: grid;
  gap: var(--space-3);
  color: inherit;
  text-decoration: none;
  transition: transform 160ms ease-out, box-shadow 160ms ease-out;

  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
  }

  @media (prefers-reduced-motion: reduce) {
    transition: none;

    &:hover {
      transform: none;
    }
  }
`;

const FeatureHeader = styled.div`
  display: flex;
  align-items: center;
  gap: var(--space-3);
`;

const FeatureIcon = styled.div`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 60px;
  height: 60px;
  background: rgba(249, 47, 96, 0.1);
  border-radius: 50%;
  color: var(--color-accent);
  flex-shrink: 0;

  svg {
    width: 24px;
    height: 24px;
  }
`;

const FeatureTitle = styled.h3`
  font-size: var(--font-size-large);
  margin-bottom: 0;
  color: var(--color-text-primary);
  font-weight: 600;
`;

const FeatureDescription = styled.p`
  color: var(--color-text-secondary);
  line-height: 1.6;
  font-size: var(--font-size-small);
`;

const ComparisonSection = styled.div`
  background: rgba(255, 255, 255, 0.03);
  border-radius: var(--border-radius);
  border: 1px solid rgba(255, 255, 255, 0.05);
  padding: var(--space-5);
  margin-bottom: var(--space-5);
`;

const ComparisonTitle = styled.h2`
  font-size: var(--font-size-xl);
  text-align: center;
  margin-bottom: var(--space-4);
  color: var(--color-text-primary);
`;

const ComparisonGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--space-4);

  @media (min-width: 768px) {
    grid-template-columns: repeat(2, 1fr);
  }
`;

const ComparisonCard = styled.div<{ $isRoute?: boolean }>`
  padding: var(--space-4);
  border-radius: var(--border-radius);
  border: 1px solid
    ${(props) =>
      props.$isRoute ? "rgba(249, 47, 96, 0.3)" : "rgba(255, 255, 255, 0.1)"};
  background: ${(props) =>
    props.$isRoute ? "rgba(249, 47, 96, 0.05)" : "rgba(255, 255, 255, 0.02)"};
`;

const ComparisonCardTitle = styled.h3`
  font-size: var(--font-size-large);
  margin-bottom: var(--space-3);
  color: var(--color-text-primary);
  text-align: center;
`;

const ComparisonList = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0;
`;

const ComparisonItem = styled.li<{ $isPositive?: boolean }>`
  display: flex;
  align-items: center;
  margin-bottom: var(--space-2);
  color: ${(props) => (props.$isPositive ? "#4ade80" : "#f87171")};

  &::before {
    content: "${(props) => (props.$isPositive ? "✓" : "✗")}";
    margin-right: var(--space-2);
    font-weight: bold;
  }
`;

const Features: React.FC = () => {
  const { locale, pathFor } = useI18n();
  const capabilityIcons: Record<CapabilityPageSlug, React.ReactNode> = {
    "travel-history": <Brain />,
    "travel-stats": <Map />,
    "loyalty-details": <BadgeCheck />,
    "trip-planning-from-events": <Calendar />,
    "trip-updates": <RefreshCw />,
    "travel-booking": <PlaneTakeoff />,
    "upcoming-trip-details": <Clock />,
    "airport-security-wait-times": <Shield />,
    "trip-calendar-sync": <Calendar />,
    "connected-accounts": <Link2 />,
    "traveler-profiles": <UserRound />,
    "trip-sharing": <Share2 />,
    "live-trip-views": <Smartphone />,
    "trip-expenses": <Receipt />,
  };
  const localizedContent =
    locale === "es"
      ? {
          pageTitle: "Por qué los viajeros usan Pack como planificador de viajes con IA",
          pageSubtitle:
            "Pack convierte contexto de viaje, viajes pasados, confirmaciones y preferencias en un viaje curado que puedes revisar con confianza.",
          heroTitle: "De correos, fotos y planes dispersos a un viaje terminado",
          heroDescription:
            "Pack conecta tu inbox, calendario, viajes pasados, preferencias y fotos de viaje para que planear se sienta curado en vez de caótico.",
          comparisonTitle: "Apps de búsqueda o itinerario vs. Pack",
          traditionalTitle: "Apps de búsqueda e itinerario",
          packTitle: "Planificador con IA de Pack",
          traditionalItems: [
            "Ideas o resultados de búsqueda en lugar de un borrador de viaje listo para revisar",
            "Demasiadas pestañas, formularios y correos de confirmación",
            "Poca memoria de viajes pasados, preferencias y hábitos reales",
            "Fotos, reservas y tiempos organizados manualmente después de reservar",
          ],
          packItems: [
            "Historial de viaje, reservas y contexto en una sola vista",
            "Planificación proactiva y reactiva desde múltiples fuentes",
            "Búsqueda y reserva de vuelos, hoteles y autos",
            "Más utilidad antes y durante el viaje",
          ],
          ctaTitle: "Mira cómo Pack planearía tu próximo viaje",
          ctaBody:
            "Únete a la lista de espera para obtener acceso anticipado a una forma de viajar más organizada y personalizada.",
          schemaName: "Pack - Asistente de viaje con IA",
          schemaDescription:
            "Asistente inteligente de viajes que planifica viajes, coordina vuelos y hoteles mediante una experiencia de reserva integrada y crea itinerarios personalizados a través de conversación natural.",
          schemaAudience:
            "Viajeros, viajeros de negocios y personas que planifican vacaciones",
          coreFeatures: capabilityPageDefinitions.map((page) => ({
            icon: capabilityIcons[page.slug],
            href: page.slug,
            title:
              page.slug === "trip-planning-from-events"
                ? "Planea viajes desde eventos y prompts"
                : page.slug === "airport-security-wait-times"
                  ? "Muestra esperas de seguridad aeroportuaria"
                  : page.slug === "trip-calendar-sync"
                    ? "Sincroniza eventos del viaje al calendario"
                    : page.slug === "connected-accounts"
                      ? "Conecta cuentas y proveedores externos"
                      : page.slug === "trip-sharing"
                        ? "Comparte viajes y coordina viajes en grupo"
                        : page.slug === "live-trip-views"
                          ? "Mantiene vistas en vivo del próximo viaje"
                          : page.slug === "trip-expenses"
                            ? "Organiza gastos del viaje"
                            : capabilityPageDefinitionMap[page.slug].featureTitle,
            description:
              page.slug === "trip-planning-from-events"
                ? "Pack puede partir de eventos públicos, eventos privados y prompts en lenguaje natural para armar un viaje antes de que la búsqueda se fragmente."
                : page.slug === "airport-security-wait-times"
                  ? "Pack puede mostrar tiempos de espera de seguridad en web y app como parte del contexto real del día de viaje."
                  : page.slug === "trip-calendar-sync"
                    ? "Los eventos del viaje pueden volver al calendario del dispositivo para que el horario del viaje viva donde ya miras tu día."
                    : page.slug === "connected-accounts"
                      ? "Pack puede conectar email, calendario y otras fuentes de viaje para arrancar desde más contexto y menos configuración manual."
                      : page.slug === "trip-sharing"
                        ? "Links, invitaciones, viajes vinculados, copias e importaciones ayudan a mantener el viaje colaborativo."
                        : page.slug === "live-trip-views"
                          ? "Las vistas del próximo viaje pueden permanecer visibles con estado, acciones y contexto rápido cuando estás en movimiento."
                          : page.slug === "trip-expenses"
                            ? "Los gastos pueden mantenerse unidos al viaje para que el costo total sea más legible después."
                            : capabilityPageDefinitionMap[page.slug].featureDescription,
          })),
        }
      : {
          pageTitle: "What Pack helps travelers do",
          pageSubtitle:
            "Pack turns travel context, past trips, confirmations, and preferences into one curated trip you can review with confidence.",
          heroTitle: "From scattered emails, photos, and plans to one finished trip",
          heroDescription:
            "Pack connects your inbox, calendar, past trips, preferences, and travel photos so planning feels curated instead of chaotic.",
          comparisonTitle: "How Pack differs from search and itinerary apps",
          traditionalTitle: "Search and itinerary apps",
          packTitle: "Pack AI travel planner",
          traditionalItems: [
            "Ideas or search results instead of a trip draft you can actually review",
            "Too many tabs, forms, and confirmation emails",
            "Little memory of past trips, preferences, and real booking habits",
            "Photos, reservations, and timing organized manually after booking",
          ],
          packItems: [
            "Travel history, bookings, and context in one view",
            "Proactive and reactive trip planning from many sources",
            "Search and booking across flights, hotels, and cars",
            "More utility before and during the trip",
          ],
          ctaTitle: "See how Pack would plan your next trip",
          ctaBody:
            "Join the waitlist to get early access to a more organized, more personalized way to travel.",
          schemaName: "Pack - AI Travel Assistant",
          schemaDescription:
            "Intelligent AI travel assistant that plans trips, coordinates flights and hotels through an integrated booking experience, and creates personalized itineraries through natural conversation.",
          schemaAudience:
            "Travelers, Business Travelers, Vacation Planners",
          coreFeatures: capabilityPageDefinitions.map((page) => ({
            icon: capabilityIcons[page.slug],
            href: page.slug,
            title:
              page.slug === "trip-planning-from-events"
                ? "Plans trips from events and prompts"
                : page.slug === "airport-security-wait-times"
                  ? "Shows airport security wait times"
                  : page.slug === "trip-calendar-sync"
                    ? "Syncs trip events to calendars"
                    : page.slug === "connected-accounts"
                      ? "Connects external accounts and providers"
                      : page.slug === "trip-sharing"
                        ? "Shares trips and supports group travel"
                        : page.slug === "live-trip-views"
                          ? "Keeps live upcoming-trip views visible"
                          : page.slug === "trip-expenses"
                            ? "Organizes trip expenses"
                            : capabilityPageDefinitionMap[page.slug].featureTitle,
            description:
              page.slug === "trip-planning-from-events"
                ? "Pack can start from public events, private timing, and plain-language prompts before search gets fragmented."
                : page.slug === "airport-security-wait-times"
                  ? "Pack can surface airport security waits in app and web as part of broader travel-day context."
                  : page.slug === "trip-calendar-sync"
                    ? "Trip events can flow back to device calendars so travel timing stays visible where you already manage your day."
                    : page.slug === "connected-accounts"
                      ? "Pack can connect email, calendar, and related travel sources so planning starts from richer travel context."
                      : page.slug === "trip-sharing"
                        ? "Links, invitations, linked trips, copies, and imports help keep collaborative travel from fragmenting."
                        : page.slug === "live-trip-views"
                          ? "Upcoming trips can stay visible with faster status and action surfaces when time matters."
                          : page.slug === "trip-expenses"
                            ? "Travel costs can stay attached to the trip record so the full cost is easier to review later."
                            : capabilityPageDefinitionMap[page.slug].featureDescription,
          })),
        };
  const coreFeatures = localizedContent.coreFeatures;

  // Generate Product schema markup for Features
  useMountEffect(() => {
    const generateFeaturesSchema = () => {
      const schema = {
        "@context": "https://schema.org",
        "@type": "Product",
        name: localizedContent.schemaName,
        description: localizedContent.schemaDescription,
        brand: {
          "@type": "Brand",
          name: "Pack",
        },
        category: "Travel Software",
        audience: {
          "@type": "Audience",
          audienceType: localizedContent.schemaAudience,
        },
        featureList: coreFeatures.map((feature) => feature.title),
        applicationCategory: "TravelApplication",
        operatingSystem: "iOS, Android, Web Browser",
        offers: {
          "@type": "Offer",
          availability: "https://schema.org/PreOrder",
          url: "https://trypackai.com",
        },
      };

      // Remove existing schema
      const existingSchema = document.querySelector(
        'script[data-schema="features"]'
      );
      if (existingSchema) {
        existingSchema.remove();
      }

      // Add new schema
      const script = document.createElement("script");
      script.type = "application/ld+json";
      script.setAttribute("data-schema", "features");
      script.textContent = JSON.stringify(schema);
      document.head.appendChild(script);
    };

    generateFeaturesSchema();

    // Cleanup on unmount
    return () => {
      const schema = document.querySelector('script[data-schema="features"]');
      if (schema) {
        schema.remove();
      }
    };
  });

  return (
    <FeaturesContainer>
      <PageHeader>
        <Title>{localizedContent.pageTitle}</Title>
        <Subtitle>
          {localizedContent.pageSubtitle}
        </Subtitle>
      </PageHeader>

      <HeroFeature>
        <HeroIcon>
          <Globe />
        </HeroIcon>
        <HeroTitle>{localizedContent.heroTitle}</HeroTitle>
        <HeroDescription>
          {localizedContent.heroDescription}
        </HeroDescription>
      </HeroFeature>

      <div>
        <FeaturesGrid>
          {coreFeatures.map((feature, index) => (
            <FeatureCard
              key={index}
              to={pathFor(`/${feature.href}`)}
            >
              <FeatureHeader>
                <FeatureIcon>{feature.icon}</FeatureIcon>
                <FeatureTitle>{feature.title}</FeatureTitle>
              </FeatureHeader>
              <FeatureDescription>{feature.description}</FeatureDescription>
            </FeatureCard>
          ))}
        </FeaturesGrid>
      </div>

      <ComparisonSection>
        <ComparisonTitle>
          {localizedContent.comparisonTitle}
        </ComparisonTitle>
        <ComparisonGrid>
          <ComparisonCard>
            <ComparisonCardTitle>{localizedContent.traditionalTitle}</ComparisonCardTitle>
            <ComparisonList>
              {localizedContent.traditionalItems.map((item) => (
                <ComparisonItem key={item} $isPositive={false}>
                  {item}
                </ComparisonItem>
              ))}
            </ComparisonList>
          </ComparisonCard>

          <ComparisonCard $isRoute>
            <ComparisonCardTitle>{localizedContent.packTitle}</ComparisonCardTitle>
            <ComparisonList>
              {localizedContent.packItems.map((item) => (
                <ComparisonItem key={item} $isPositive>
                  {item}
                </ComparisonItem>
              ))}
            </ComparisonList>
          </ComparisonCard>
        </ComparisonGrid>
      </ComparisonSection>

      <div
        style={{
          textAlign: "center",
          padding: "var(--space-5)",
          background: "rgba(249, 47, 96, 0.1)",
          borderRadius: "var(--border-radius)",
          border: "1px solid rgba(249, 47, 96, 0.2)",
        }}
      >
        <h3
          style={{
            marginBottom: "var(--space-2)",
            color: "var(--color-text-primary)",
            fontSize: "var(--font-size-xl)",
          }}
        >
          {localizedContent.ctaTitle}
        </h3>
        <p
          style={{
            color: "var(--color-text-secondary)",
            marginBottom: "var(--space-4)",
            fontSize: "var(--font-size-medium)",
            lineHeight: 1.6,
          }}
        >
          {localizedContent.ctaBody}
        </p>
        <WaitlistForm />
      </div>
    </FeaturesContainer>
  );
};

export default Features;
