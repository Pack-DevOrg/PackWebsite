import React from "react";
import styled from "styled-components";
import {
  MessageSquareText,
  PlaneTakeoff,
  Calendar,
  CreditCard,
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
          pageTitle: "Por qué los viajeros usan Pack",
          pageSubtitle:
            "Pack convierte contexto y preferencias de viaje en un viaje curado que puedes revisar con confianza.",
          heroTitle: "De detalles de viaje dispersos a un viaje terminado",
          heroDescription:
            "Pack conecta tu inbox, calendario, preferencias y opciones de reserva para que planear se sienta curado y no caótico.",
          comparisonTitle: "Planificación tradicional vs. Pack",
          traditionalTitle: "Apps tradicionales de viaje",
          packTitle: "Experiencia Pack",
          traditionalItems: [
            "Resultados de búsqueda en lugar de un viaje terminado",
            "Demasiadas pestañas, formularios y correos de confirmación",
            "Poca memoria de cómo viajas en realidad",
            "Organización manual después de reservar",
          ],
          packItems: [
            "Conversación natural que se convierte en un borrador real del viaje",
            "Recomendaciones guiadas por tus preferencias e historial",
            "Confirmaciones y tiempos organizados automáticamente",
            "Checkout del proveedor más una cronología más clara",
          ],
          ctaTitle: "Mira cómo Pack planearía tu próximo viaje",
          ctaBody:
            "Únete a la lista de espera para obtener acceso anticipado a una forma de viajar más organizada y personalizada.",
          ctaNote:
            "Las funciones descritas representan capacidades planificadas. Pack está actualmente en desarrollo. La tecnología de IA tiene limitaciones y los resultados pueden variar.",
          schemaName: "Pack - Asistente de viaje con IA",
          schemaDescription:
            "Asistente inteligente de viajes que planifica viajes, te ayuda a completar vuelos y hoteles mediante el checkout seguro del proveedor y crea itinerarios personalizados a través de conversación natural.",
          schemaAudience:
            "Viajeros, viajeros de negocios y personas que planifican vacaciones",
          coreFeatures: [
            {
              icon: <MessageSquareText />,
              title: "Planifica conversando",
              description:
                "Describe el viaje en lenguaje natural y Pack lo convierte en un borrador estructurado en lugar de un hilo de sugerencias.",
            },
            {
              icon: <Brain />,
              title: "Aprende tus preferencias",
              description:
                "Pack usa tus viajes pasados, tu inbox y el contexto del calendario para entender cómo reservas, dónde te quedas y qué tiempos te funcionan.",
            },
            {
              icon: <Clock />,
              title: "Borradores de viaje, no respuestas de chat",
              description:
                "Vuelos, hoteles y tiempos del viaje se ensamblan en algo que realmente puedes revisar y aprobar.",
            },
            {
              icon: <Heart />,
              title: "Recuerda lo que te gusta",
              description:
                "Aeropuertos preferidos, aerolíneas favoritas, estilos de hotel y hábitos de reserva se mantienen para que cada viaje comience más cerca de lo que encaja contigo.",
            },
            {
              icon: <Calendar />,
              title: "Organiza confirmaciones automáticamente",
              description:
                "Las confirmaciones de viaje y el calendario se integran en una sola vista organizada en vez de quedar dispersos entre correos y pestañas.",
            },
            {
              icon: <PlaneTakeoff />,
              title: "Checkout del proveedor",
              description:
                "Pack te ayuda a elegir y luego te envía al checkout de la aerolínea o del hotel para que la reserva permanezca con el proveedor.",
            },
            {
              icon: <Shield />,
              title: "Manejo discreto",
              description:
                "El contexto del viaje se maneja con cuidado y los datos de pago permanecen en páginas alojadas por el proveedor y no dentro de Pack.",
            },
            {
              icon: <Smartphone />,
              title: "Una vista clara del viaje",
              description:
                "Planes, confirmaciones, estancias y tiempos viven juntos en una vista más fácil de entender de un vistazo.",
            },
            {
              icon: <Zap />,
              title: "Útil cuando los planes cambian rápido",
              description:
                "Desde una escapada rápida hasta un itinerario de último minuto, Pack te ayuda a llegar más rápido a una respuesta terminada.",
            },
          ],
        }
      : {
          pageTitle: "Why travelers use Pack",
          pageSubtitle:
            "Pack turns travel context and preferences into one curated trip you can review with confidence.",
          heroTitle: "From scattered travel details to one finished trip",
          heroDescription:
            "Pack connects your inbox, calendar, preferences, and booking options so planning feels curated instead of chaotic.",
          comparisonTitle: "Traditional travel planning vs. Pack",
          traditionalTitle: "Traditional Travel Apps",
          packTitle: "Pack Experience",
          traditionalItems: [
            "Search results instead of a finished trip",
            "Too many tabs, forms, and confirmation emails",
            "Little memory of how you actually travel",
            "Manual organization after booking",
          ],
          packItems: [
            "Natural conversation that turns into a real trip draft",
            "Recommendations shaped by your preferences and history",
            "Confirmations and timing organized automatically",
            "Provider checkout plus one clearer travel timeline",
          ],
          ctaTitle: "See how Pack would plan your next trip",
          ctaBody:
            "Join the waitlist to get early access to a more organized, more personalized way to travel.",
          ctaNote:
            "Features described represent planned capabilities. Pack is currently in development. AI technology has limitations and results may vary.",
          schemaName: "Pack - AI Travel Assistant",
          schemaDescription:
            "Intelligent AI travel assistant that plans trips, helps you complete flights and hotels through the provider's secure checkout, and creates personalized itineraries through natural conversation.",
          schemaAudience:
            "Travelers, Business Travelers, Vacation Planners",
          coreFeatures: [
            {
              icon: <MessageSquareText />,
              title: "Plan by conversation",
              description:
                "Describe the trip in plain language and Pack turns it into a structured travel draft instead of a thread of suggestions.",
            },
            {
              icon: <Brain />,
              title: "Learns your travel preferences",
              description:
                "Pack uses your past trips, inbox, and calendar context to understand how you book, where you stay, and what timing works for you.",
            },
            {
              icon: <Clock />,
              title: "Trip drafts, not chat replies",
              description:
                "Flights, hotel stays, and trip timing are assembled into something you can actually review and approve.",
            },
            {
              icon: <Heart />,
              title: "Remembers what you like",
              description:
                "Preferred airports, favorite airlines, hotel styles, and booking habits carry forward so each trip starts closer to what fits.",
            },
            {
              icon: <Calendar />,
              title: "Auto-organizes confirmations",
              description:
                "Travel confirmations and calendar timing are pulled into one organized trip view instead of scattered emails and tabs.",
            },
            {
              icon: <PlaneTakeoff />,
              title: "Provider checkout",
              description:
                "Pack helps you choose, then hands off to the airline or hotel checkout flow so the booking stays with the provider.",
            },
            {
              icon: <Shield />,
              title: "Handled discreetly",
              description:
                "Travel context is handled with care, and payment details stay on provider-hosted checkout pages rather than inside Pack.",
            },
            {
              icon: <Smartphone />,
              title: "One clear trip view",
              description:
                "Plans, confirmations, stays, and timing live together in one view that is easier to understand at a glance.",
            },
            {
              icon: <Zap />,
              title: "Useful when plans move fast",
              description:
                "From a quick weekend to a last-minute itinerary, Pack helps you get to a finished answer faster.",
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
        <p
          style={{
            color: "var(--color-text-secondary)",
            fontSize: "var(--font-size-small)",
            fontStyle: "italic",
            marginBottom: "var(--space-3)",
          }}
        >
          {localizedContent.ctaNote}
        </p>
        <WaitlistForm />
      </div>
    </FeaturesContainer>
  );
};

export default Features;
