import React from "react";
import styled from "styled-components";
import {
  PlaneTakeoff,
  Calendar,
  Smartphone,
  Shield,
  Clock,
  Brain,
  Map as MapIcon,
  BadgeCheck,
  RefreshCw,
  Link2,
  UserRound,
  Share2,
  Receipt,
} from "lucide-react";
import WaitlistForm from "../components/WaitlistForm";
import FeatureShowcase from "../components/FeatureShowcase";
import PrefetchLink from "../components/PrefetchLink";
import { FEATURE_SCREENS } from "@/content/featureScreens";
import { useI18n } from "@/i18n/I18nProvider";
import PageSeo from "@/seo/pageSeo";
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





/* Slim "go deeper" band — the showcase carries the feature story now; this
   just keeps the guide pages one click (and one crawl) away. */
const GuidesBand = styled.nav`
  margin-top: var(--space-6);
  margin-bottom: var(--space-6);
  display: grid;
  justify-items: center;
  gap: var(--space-2);
  padding-top: var(--space-4);
  border-top: 1px solid rgba(255, 255, 255, 0.08);
`;

const GuidesLabel = styled.p`
  margin: 0;
  color: var(--color-text-secondary);
  font-size: var(--font-size-small);
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
`;

const GuidesLinks = styled.div`
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 0.35rem var(--space-3);
`;

const GuideLink = styled(PrefetchLink)`
  color: var(--color-text-secondary);
  font-size: var(--font-size-small);
  text-decoration: none;
  transition: color 140ms ease;

  &:hover,
  &:focus-visible {
    color: var(--color-accent);
  }
`;

const Features: React.FC = () => {
  const { locale, pathFor } = useI18n();
  const capabilityIcons: Record<CapabilityPageSlug, React.ReactNode> = {
    "travel-history": <Brain />,
    "travel-stats": <MapIcon />,
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
          ctaTitle: "Mira cómo Pack planearía tu próximo viaje",
          ctaBody:
            "Únete a la lista de espera para obtener acceso anticipado a una forma de viajar más organizada y personalizada.",
          systemsTitle: "Profundiza en las guías",
          systems: [
            { title: "Planificar", href: "/guides/event-trip-planning" },
            { title: "Conectar", href: "/guides/travel-context-engine" },
            { title: "Organizar", href: "/guides/trip-organization" },
            { title: "Reservar", href: "/guides/booking-context" },
            { title: "Coordinar", href: "/guides/group-trip-planning" },
            { title: "Recordar", href: "/guides/travel-stats-and-maps" },
            { title: "Actuar", href: "/guides/travel-day-intelligence" },
            { title: "Confiar", href: "/guides/reliable-ai-travel-planning" },
          ],
          schemaName: "Pack - Asistente de viaje con IA",
          schemaDescription:
            "Asistente inteligente de viajes que planifica viajes, te ayuda a completar vuelos y hoteles mediante un checkout seguro dentro de Pack y crea itinerarios personalizados a través de conversación natural.",
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
          ctaTitle: "See how Pack would plan your next trip",
          ctaBody:
            "Join the waitlist to get early access to a more organized, more personalized way to travel.",
          systemsTitle: "Go deeper in the guides",
          systems: [
            { title: "Plan", href: "/guides/event-trip-planning" },
            { title: "Connect", href: "/guides/travel-context-engine" },
            { title: "Organize", href: "/guides/trip-organization" },
            { title: "Book", href: "/guides/booking-context" },
            { title: "Coordinate", href: "/guides/group-trip-planning" },
            { title: "Remember", href: "/guides/travel-stats-and-maps" },
            { title: "Act", href: "/guides/travel-day-intelligence" },
            { title: "Trust", href: "/guides/reliable-ai-travel-planning" },
          ],
          schemaName: "Pack - AI Travel Assistant",
          schemaDescription:
            "Intelligent AI travel assistant that plans trips, helps you complete flights and hotels through secure in-app checkout in Pack, and creates personalized itineraries through natural conversation.",
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
  // Tag each localized capability card into the demo screen that shows it,
  // so the showcase panel can render them beside the right clip.
  const featureBySlug = new Map(coreFeatures.map((feature) => [feature.href, feature]));
  const showcasePanels = Object.fromEntries(
    FEATURE_SCREENS.map((screen) => [
      screen.id,
      screen.capabilitySlugs.flatMap((slug) => {
        const feature = featureBySlug.get(slug);
        return feature ? [feature] : [];
      }),
    ]),
  );
  const featuresSchema = {
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
      url: "https://www.trypackai.com",
    },
  };

  return (
    <FeaturesContainer>
      <PageSeo
        title="Pack Features | AI trip planning, booking, and travel organization"
        description="Explore Pack features for AI trip planning, booking, connected travel data, collaboration, and travel-day coordination."
        path="/features"
        schema={[featuresSchema]}
      />
      <PageHeader>
        <Title>{localizedContent.pageTitle}</Title>
        <Subtitle>
          {localizedContent.pageSubtitle}
        </Subtitle>
      </PageHeader>

      <FeatureShowcase panels={showcasePanels} />

      <GuidesBand aria-label="Travel guides">
        <GuidesLabel>{localizedContent.systemsTitle}</GuidesLabel>
        <GuidesLinks>
          {localizedContent.systems.map((system) => (
            <GuideLink key={system.href} to={pathFor(system.href)}>
              {system.title}
            </GuideLink>
          ))}
        </GuidesLinks>
      </GuidesBand>

      <div
        style={{
          textAlign: "center",
          padding: "var(--space-5)",
          background: "rgba(243, 210, 122, 0.08)",
          borderRadius: "var(--border-radius)",
          border: "1px solid rgba(243, 210, 122, 0.2)",
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
