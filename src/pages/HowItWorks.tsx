import React from "react";
import styled from "styled-components";
import {
  MessageSquareText,
  Brain,
  Search,
  CheckCircle,
  PlaneTakeoff,
  Bell,
} from "lucide-react";
import WaitlistForm from "../components/WaitlistForm";
import { useMountEffect } from "../hooks/useMountEffect";
import { useI18n } from "@/i18n/I18nProvider";

const HowItWorksContainer = styled.section`
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

const StepsContainer = styled.div`
  display: grid;
  gap: var(--space-5);
  margin-bottom: var(--space-5);
`;

const StepCard = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--space-4);
  align-items: center;
  background: rgba(255, 255, 255, 0.03);
  border-radius: var(--border-radius);
  border: 1px solid rgba(255, 255, 255, 0.05);
  padding: var(--space-5);
  position: relative;
  overflow: hidden;
  transform: translateY(0);
  transition: transform 160ms ease-out;

  @media (min-width: 768px) {
    grid-template-columns: auto 1fr;
    gap: var(--space-5);
  }

  &::before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 2px;
    background: linear-gradient(90deg, transparent, var(--color-accent), transparent);
    opacity: 0.7;
  }

  &:hover {
    transform: translateY(-3px);
  }

  @media (prefers-reduced-motion: reduce) {
    transition: none;

    &:hover {
      transform: none;
    }
  }
`;

const StepNumber = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 80px;
  height: 80px;
  background: rgba(249, 47, 96, 0.1);
  border-radius: 50%;
  border: 2px solid rgba(249, 47, 96, 0.3);
  font-size: var(--font-size-xl);
  font-weight: bold;
  color: var(--color-accent);
  margin: 0 auto;

  @media (min-width: 768px) {
    margin: 0;
  }
`;

const StepContent = styled.div`
  text-align: center;

  @media (min-width: 768px) {
    text-align: left;
  }
`;

const StepTitle = styled.h3`
  font-size: var(--font-size-xl);
  margin-bottom: var(--space-2);
  color: var(--color-text-primary);
  font-weight: 600;
`;

const StepDescription = styled.p`
  color: var(--color-text-secondary);
  line-height: 1.6;
  font-size: var(--font-size-medium);
  margin-bottom: var(--space-3);
`;

const StepFeatures = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0;
  display: grid;
  gap: var(--space-2);
`;

const StepFeature = styled.li`
  display: flex;
  align-items: center;
  gap: var(--space-2);
  color: var(--color-text-secondary);
  font-size: var(--font-size-small);

  svg {
    width: 16px;
    height: 16px;
    color: var(--color-accent);
    flex-shrink: 0;
  }
`;

const ProcessFlow = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: var(--space-4);
  margin-bottom: var(--space-5);
  padding: var(--space-5);
  background: rgba(255, 255, 255, 0.03);
  border-radius: var(--border-radius);
  border: 1px solid rgba(255, 255, 255, 0.05);
`;

const ProcessStep = styled.div`
  display: grid;
  gap: var(--space-3);
  padding: var(--space-4);
  border-radius: var(--border-radius);
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.05);
`;

const ProcessHeader = styled.div`
  display: flex;
  align-items: center;
  gap: var(--space-3);
`;

const ProcessIcon = styled.div`
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

const ProcessTitle = styled.h4`
  font-size: var(--font-size-medium);
  margin-bottom: 0;
  color: var(--color-text-primary);
  font-weight: 600;
`;

const ProcessDescription = styled.p`
  color: var(--color-text-secondary);
  font-size: var(--font-size-small);
  line-height: 1.5;
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
  font-size: var(--font-size-small);

  &::before {
    content: "${(props) => (props.$isPositive ? "✓" : "✗")}";
    margin-right: var(--space-2);
    font-weight: bold;
  }
`;

const howItWorksContent = {
  en: {
    pageTitle: "How Pack Works",
    pageSubtitle:
      "Pack turns conversation and travel context into a trip you can review and approve with confidence.",
    schemaName: "How to Plan and Book Travel with Pack",
    schemaDescription:
      "Learn how Pack's AI travel assistant helps you plan and book personalized trips through natural conversation and intelligent recommendations.",
    schemaSupply: ["Internet connection", "Travel preferences and budget"],
    schemaTool: "Pack Chat Interface",
    processSteps: [
      { icon: <MessageSquareText />, title: "Chat", description: "Start with what you need, in plain language" },
      { icon: <Brain />, title: "Learn", description: "Pack understands your preferences and patterns" },
      { icon: <Search />, title: "Curate", description: "Flights and stays become one organized draft" },
      { icon: <CheckCircle />, title: "Review", description: "See one clear answer before approval" },
      { icon: <PlaneTakeoff />, title: "Book", description: "Finish checkout through the provider" },
      { icon: <Bell />, title: "Travel", description: "Keep the trip current while plans move" },
    ],
    steps: [
      {
        number: 1,
        title: "Start with the trip",
        description:
          "Tell Pack what you need in natural language, or connect your travel inbox and calendar so the trip context is already there.",
        features: [
          "Natural language prompts instead of form-heavy search",
          "Email confirmations and calendar timing can be brought into the trip",
          "Traveler context starts building immediately",
          "Planning begins from what you actually need, not a blank screen",
        ],
      },
      {
        number: 2,
        title: "Pack learns how you travel",
        description:
          "Past trips, booking history, and travel patterns help Pack understand your preferred airports, hotel style, budgets, and timing.",
        features: [
          "Learns from past bookings and repeated patterns",
          "Understands brand, route, and timing preferences",
          "Uses calendar context to avoid obvious conflicts",
          "Builds a better starting point for every next trip",
        ],
      },
      {
        number: 3,
        title: "A real trip draft comes together",
        description:
          "Pack assembles flights, stays, and timing into a clear trip draft so you can evaluate one coherent plan instead of piecing everything together yourself.",
        features: [
          "Personalized options, not generic search output",
          "Trip timing is visible across flights and stays",
          "Travel context is organized into one reviewable plan",
          "Options are curated around fit, not just price",
        ],
      },
      {
        number: 4,
        title: "You review one organized answer",
        description:
          "Before booking, you can see what the trip is, why it fits, and whether the timing works, without bouncing between providers and confirmation emails.",
        features: [
          "Clear review before approval",
          "Itinerary-level visibility across flights and hotels",
          "Preference-aware suggestions are easier to compare",
          "Less backtracking before you commit",
        ],
      },
      {
        number: 5,
        title: "Checkout stays with the provider",
        description:
          "Once you are ready, Pack passes the trip into the airline or hotel checkout flow so payment and reservation stay with the provider.",
        features: [
          "Provider-hosted checkout for flights and stays",
          "Pack does not need to hold your card details",
          "Less copying and re-entering trip data",
          "Booked details can flow back into your organized trip view",
        ],
      },
      {
        number: 6,
        title: "The trip stays usable while you travel",
        description:
          "After booking, Pack keeps the trip readable and current, so departures, arrivals, hotel details, and trip history are easier to access when they matter.",
        features: [
          "Travel details stay organized in one place",
          "Live trip context is easier to follow on the go",
          "Records from past travel improve future planning",
          "Your travel footprint becomes part of the next trip",
        ],
      },
    ],
    comparisonTitle: "Traditional travel planning vs. the Pack flow",
    comparisonTraditionalTitle: "Traditional Method",
    comparisonTraditionalItems: [
      "Hours of research across multiple websites",
      "Comparing disconnected options with little context",
      "Confirmation emails and planning notes spread everywhere",
      "Manual itinerary coordination",
      "More room for booking mistakes and missed details",
      "Every new trip starts from scratch",
    ],
    comparisonRouteTitle: "Pack Process",
    comparisonRouteItems: [
      "Natural conversation instead of form-heavy search",
      "Options shaped by your preferences and past travel",
      "One organized trip draft before checkout",
      "Travel details coordinated into one timeline",
      "Review before approval with better context",
      "Smarter planning as your travel history grows",
    ],
    ctaTitle: "See how Pack would handle your next trip",
    ctaBody:
      "Join the waitlist for early access to a travel planning flow that feels more curated, more organized, and easier to approve.",
    disclaimer:
      "Features described represent planned capabilities. Pack is currently in development. AI technology has limitations and results may vary.",
  },
  es: {
    pageTitle: "Cómo funciona Pack",
    pageSubtitle:
      "Pack convierte conversación y contexto de viaje en un trayecto que puedes revisar y aprobar con confianza.",
    schemaName: "Cómo planear y reservar un viaje con Pack",
    schemaDescription:
      "Descubre cómo el asistente de viajes de Pack te ayuda a planear y reservar viajes personalizados mediante conversación natural y recomendaciones inteligentes.",
    schemaSupply: ["Conexión a internet", "Preferencias de viaje y presupuesto"],
    schemaTool: "Interfaz de chat de Pack",
    processSteps: [
      { icon: <MessageSquareText />, title: "Habla", description: "Empieza con lo que necesitas, en lenguaje natural" },
      { icon: <Brain />, title: "Aprende", description: "Pack entiende tus preferencias y patrones" },
      { icon: <Search />, title: "Curar", description: "Vuelos y estancias se convierten en un borrador organizado" },
      { icon: <CheckCircle />, title: "Revisa", description: "Ve una respuesta clara antes de aprobar" },
      { icon: <PlaneTakeoff />, title: "Reserva", description: "Termina el checkout con el proveedor" },
      { icon: <Bell />, title: "Viaja", description: "Mantén el viaje al día mientras los planes se mueven" },
    ],
    steps: [
      {
        number: 1,
        title: "Empieza por el viaje",
        description:
          "Dile a Pack lo que necesitas en lenguaje natural o conecta tu correo y calendario para que el contexto ya esté listo.",
        features: [
          "Prompts en lenguaje natural en lugar de búsqueda llena de formularios",
          "Las confirmaciones por correo y los tiempos del calendario pueden entrar al viaje",
          "El contexto del viajero empieza a construirse de inmediato",
          "La planificación parte de lo que realmente necesitas, no de una pantalla en blanco",
        ],
      },
      {
        number: 2,
        title: "Pack aprende cómo viajas",
        description:
          "Viajes pasados, historial de reservas y patrones ayudan a entender aeropuertos, estilo de hotel, presupuesto y horarios preferidos.",
        features: [
          "Aprende de reservas pasadas y patrones repetidos",
          "Entiende marcas, rutas y preferencias de horario",
          "Usa el calendario para evitar conflictos obvios",
          "Construye un mejor punto de partida para cada siguiente viaje",
        ],
      },
      {
        number: 3,
        title: "Se arma un borrador real del viaje",
        description:
          "Pack reúne vuelos, estancias y tiempos en un borrador claro para que evalúes un plan coherente en vez de unir todo por tu cuenta.",
        features: [
          "Opciones personalizadas, no resultados genéricos",
          "El tiempo del viaje es visible entre vuelos y estancias",
          "El contexto se organiza en un plan revisable",
          "Las opciones se curan por ajuste, no solo por precio",
        ],
      },
      {
        number: 4,
        title: "Revisas una respuesta organizada",
        description:
          "Antes de reservar, puedes ver qué es el viaje, por qué encaja y si el horario funciona, sin saltar entre proveedores y correos.",
        features: [
          "Revisión clara antes de aprobar",
          "Visibilidad del itinerario entre vuelos y hoteles",
          "Las sugerencias con contexto son más fáciles de comparar",
          "Menos idas y vueltas antes de comprometerte",
        ],
      },
      {
        number: 5,
        title: "El checkout se queda con el proveedor",
        description:
          "Cuando estás listo, Pack envía el viaje al flujo de checkout de la aerolínea o del hotel para que el pago y la reserva permanezcan con el proveedor.",
        features: [
          "Checkout alojado por el proveedor para vuelos y estancias",
          "Pack no necesita guardar tus datos de tarjeta",
          "Menos copiar y volver a ingresar información",
          "Los detalles reservados pueden volver a tu vista organizada",
        ],
      },
      {
        number: 6,
        title: "El viaje sigue siendo útil mientras viajas",
        description:
          "Después de reservar, Pack mantiene el viaje legible y actualizado para que salidas, llegadas, hoteles e historial sean fáciles de consultar cuando importan.",
        features: [
          "Los detalles del viaje permanecen organizados en un solo lugar",
          "El contexto en vivo es más fácil de seguir en movimiento",
          "Los registros de viajes pasados mejoran la próxima planificación",
          "Tu historial se convierte en parte del siguiente viaje",
        ],
      },
    ],
    comparisonTitle: "Planificación tradicional vs. el flujo de Pack",
    comparisonTraditionalTitle: "Método tradicional",
    comparisonTraditionalItems: [
      "Horas de investigación en múltiples sitios",
      "Comparar opciones desconectadas con poco contexto",
      "Correos de confirmación y notas repartidos por todas partes",
      "Coordinación manual del itinerario",
      "Más espacio para errores y detalles perdidos",
      "Cada nuevo viaje empieza desde cero",
    ],
    comparisonRouteTitle: "Proceso Pack",
    comparisonRouteItems: [
      "Conversación natural en lugar de búsqueda con formularios",
      "Opciones moldeadas por tus preferencias y viajes pasados",
      "Un borrador organizado antes del checkout",
      "Detalles del viaje coordinados en una sola línea de tiempo",
      "Revisión antes de aprobar con mejor contexto",
      "Planificación más inteligente a medida que crece tu historial",
    ],
    ctaTitle: "Mira cómo Pack manejaría tu próximo viaje",
    ctaBody:
      "Únete a la lista de espera para acceso anticipado a un flujo de planificación que se siente más curado, más organizado y más fácil de aprobar.",
    disclaimer:
      "Las funciones descritas representan capacidades planificadas. Pack está actualmente en desarrollo. La tecnología de IA tiene limitaciones y los resultados pueden variar.",
  },
} as const;

const HowItWorks: React.FC = () => {
  const { locale } = useI18n();
  const localizedContent = howItWorksContent[locale];
  const steps = localizedContent.steps;
  const processSteps = localizedContent.processSteps;

  useMountEffect(() => {
    const generateHowToSchema = () => {
      const schema = {
        "@context": "https://schema.org",
        "@type": "HowTo",
        name: localizedContent.schemaName,
        description: localizedContent.schemaDescription,
        image: "https://trypackai.com/images/how-it-works.png",
        totalTime: "PT5M",
        estimatedCost: {
          "@type": "MonetaryAmount",
          currency: "USD",
          value: "0",
        },
        supply: localizedContent.schemaSupply.map((item) => ({
          "@type": "HowToSupply",
          name: item,
        })),
        tool: [
          {
            "@type": "HowToTool",
            name: localizedContent.schemaTool,
          },
        ],
        step: steps.map((step, index) => ({
          "@type": "HowToStep",
          position: index + 1,
          name: step.title,
          text: step.description,
          url: `https://trypackai.com/${locale === "en" ? "" : `${locale}/`}how-it-works#step-${index + 1}`,
        })),
      };

      const existingSchema = document.querySelector('script[data-schema="howto"]');
      if (existingSchema) {
        existingSchema.remove();
      }

      const script = document.createElement("script");
      script.type = "application/ld+json";
      script.setAttribute("data-schema", "howto");
      script.textContent = JSON.stringify(schema);
      document.head.appendChild(script);
    };

    generateHowToSchema();

    return () => {
      const schema = document.querySelector('script[data-schema="howto"]');
      if (schema) {
        schema.remove();
      }
    };
  });

  return (
    <HowItWorksContainer>
      <PageHeader>
        <Title>{localizedContent.pageTitle}</Title>
        <Subtitle>{localizedContent.pageSubtitle}</Subtitle>
      </PageHeader>

      <ProcessFlow>
        {processSteps.map((step) => (
          <ProcessStep key={step.title}>
            <ProcessHeader>
              <ProcessIcon>{step.icon}</ProcessIcon>
              <ProcessTitle>{step.title}</ProcessTitle>
            </ProcessHeader>
            <ProcessDescription>{step.description}</ProcessDescription>
          </ProcessStep>
        ))}
      </ProcessFlow>

      <div>
        <StepsContainer>
          {steps.map((step) => (
            <StepCard key={step.number} id={`step-${step.number}`}>
              <StepNumber>{step.number}</StepNumber>
              <StepContent>
                <StepTitle>{step.title}</StepTitle>
                <StepDescription>{step.description}</StepDescription>
                <StepFeatures>
                  {step.features.map((feature) => (
                    <StepFeature key={`${step.number}-${feature}`}>
                      <CheckCircle />
                      {feature}
                    </StepFeature>
                  ))}
                </StepFeatures>
              </StepContent>
            </StepCard>
          ))}
        </StepsContainer>
      </div>

      <ComparisonSection>
        <ComparisonTitle>{localizedContent.comparisonTitle}</ComparisonTitle>
        <ComparisonGrid>
          <ComparisonCard>
            <ComparisonCardTitle>{localizedContent.comparisonTraditionalTitle}</ComparisonCardTitle>
            <ComparisonList>
              {localizedContent.comparisonTraditionalItems.map((item) => (
                <ComparisonItem key={item} $isPositive={false}>
                  {item}
                </ComparisonItem>
              ))}
            </ComparisonList>
          </ComparisonCard>

          <ComparisonCard $isRoute>
            <ComparisonCardTitle>{localizedContent.comparisonRouteTitle}</ComparisonCardTitle>
            <ComparisonList>
              {localizedContent.comparisonRouteItems.map((item) => (
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
          {localizedContent.disclaimer}
        </p>
        <WaitlistForm />
      </div>
    </HowItWorksContainer>
  );
};

export default HowItWorks;
