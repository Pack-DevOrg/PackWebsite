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
} from "lucide-react";
import WaitlistForm from "../components/WaitlistForm";
import { useMountEffect } from "../hooks/useMountEffect";
import { useI18n } from "@/i18n/I18nProvider";

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

const FeatureCard = styled.div`
  background: rgba(255, 255, 255, 0.03);
  border-radius: var(--border-radius);
  border: 1px solid rgba(255, 255, 255, 0.05);
  padding: var(--space-4);
  display: grid;
  gap: var(--space-3);
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
  const { locale } = useI18n();
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
          coreFeatures: [
            {
              icon: <MessageSquareText />,
              title: "Planificador de viajes con IA por conversación",
              description:
                "Describe un viaje como 'una semana en España' y Pack puede convertirlo en un borrador estructurado usando conversación, contexto y preferencias.",
            },
            {
              icon: <Brain />,
              title: "Extrae y muestra viajes pasados",
              description:
                "Pack puede extraer historial de viaje y reconstruir vuelos, hoteles, autos y otros detalles para que tus viajes pasados queden visibles y reutilizables.",
            },
            {
              icon: <Clock />,
              title: "Muestra stats, mapas y contexto del viaje",
              description:
                "Stats, mapas y líneas de tiempo ayudan a entender de un vistazo cómo se conectan vuelos, hoteles, autos y eventos.",
            },
            {
              icon: <Heart />,
              title: "Guarda lealtad y preferencias del viajero",
              description:
                "Pack organiza números de viajero frecuente, programas de lealtad, perfiles, preferencias, necesidades de accesibilidad y detalles del viajero confiable.",
            },
            {
              icon: <Calendar />,
              title: "Planea viajes de forma proactiva",
              description:
                "Pack puede planear viajes desde eventos públicos, eventos privados de correo o calendario, y prompts sintéticos en lenguaje natural.",
            },
            {
              icon: <MapPin />,
              title: "Edita y actualiza viajes desde múltiples fuentes",
              description:
                "Chat, voz, fotos, email, calendario y metadatos de fotos pueden ayudar a editar, organizar y actualizar viajes de forma reactiva.",
            },
            {
              icon: <Users />,
              title: "Busca y reserva viajes",
              description:
                "Pack está diseñado para buscar y reservar vuelos, hoteles, autos y flujos relacionados de reserva dentro de una experiencia conectada.",
            },
            {
              icon: <PlaneTakeoff />,
              title: "Más utilidad antes y durante el viaje",
              description:
                "El viaje puede mostrar clima, tiempos, esperas de seguridad, eventos, traslados y acciones de transporte cuando se acerca la salida.",
            },
            {
              icon: <Shield />,
              title: "Esperas de seguridad y sincronización",
              description:
                "Pack muestra tiempos de seguridad aeroportuaria en app y web, y también puede sincronizar eventos del viaje al calendario del dispositivo.",
            },
            {
              icon: <Smartphone />,
              title: "Cuentas conectadas, colaboración y vistas en vivo",
              description:
                "Conecta cuentas externas, comparte viajes, colabora con grupos y mantén vistas en vivo del próximo viaje con acciones y estados útiles.",
            },
            {
              icon: <Zap />,
              title: "Organiza gastos del viaje",
              description:
                "Pack también está diseñado para organizar gastos relacionados con el viaje para que el costo total del viaje sea más legible.",
            },
          ],
        }
      : {
          pageTitle: "Why travelers use Pack as an AI travel planner",
          pageSubtitle:
            "Pack turns travel context, past trips, confirmations, and preferences into one curated trip you can review with confidence.",
          heroTitle: "From scattered emails, photos, and plans to one finished trip",
          heroDescription:
            "Pack connects your inbox, calendar, past trips, preferences, and travel photos so planning feels curated instead of chaotic.",
          comparisonTitle: "Search-first or itinerary-only travel apps vs. Pack",
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
          coreFeatures: [
            {
              icon: <MessageSquareText />,
              title: "AI travel planner by conversation",
              description:
                "Describe a trip like 'a week in Spain' and Pack can turn it into a structured travel draft using conversation, context, and preferences.",
            },
            {
              icon: <Brain />,
              title: "Extracts and displays past travel history",
              description:
                "Pack can extract travel history and reconstruct flights, hotels, cars, and related details so past trips become visible and reusable.",
            },
            {
              icon: <Clock />,
              title: "Shows travel stats, maps, and trip context",
              description:
                "Travel stats, maps, and timelines help show how flights, hotels, cars, and trip events connect at a glance.",
            },
            {
              icon: <Heart />,
              title: "Stores loyalty and traveler preferences",
              description:
                "Pack organizes loyalty numbers, program details, traveler profiles, trusted traveler details, accessibility needs, and booking preferences.",
            },
            {
              icon: <Calendar />,
              title: "Plans trips proactively",
              description:
                "Pack can plan trips from public events, private email and calendar events, and synthetic prompts in plain language.",
            },
            {
              icon: <MapPin />,
              title: "Edits and updates trips from many inputs",
              description:
                "Chat, voice, photos, email, calendar, and photo metadata can all help edit, organize, and reactively update trips.",
            },
            {
              icon: <Users />,
              title: "Searches and books travel",
              description:
                "Pack is designed to search and book flights, hotels, rental cars, and related travel booking workflows inside one connected experience.",
            },
            {
              icon: <PlaneTakeoff />,
              title: "Adds utility before and during the trip",
              description:
                "Upcoming trips can show weather, timing, airport security waits, trip events, drive times, and transportation actions.",
            },
            {
              icon: <Shield />,
              title: "Security waits and calendar sync",
              description:
                "Pack shows airport security wait times in the app and web experience, and can sync trip events to device calendars.",
            },
            {
              icon: <Smartphone />,
              title: "Connected accounts, sharing, and live trip views",
              description:
                "External accounts can be connected, trips can be shared and collaborated on, and upcoming trips can stay visible with live status and actions.",
            },
            {
              icon: <Zap />,
              title: "Organizes trip expenses",
              description:
                "Pack is also designed to organize travel expenses so the full cost of a trip is easier to track and review.",
            },
          ],
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
