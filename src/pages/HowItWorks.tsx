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
import { useI18n } from "@/i18n/I18nProvider";
import PageSeo, { buildAbsoluteUrl } from "@/seo/pageSeo";

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
      "Pack turns conversation and travel context into a trip you can review, approve, and book with confidence.",
    schemaName: "How to Plan and Book Travel with Pack",
    schemaDescription:
      "Learn how Pack helps you rebuild travel history, plan trips proactively, update itineraries from real-world inputs, and stay ahead of travel-day details.",
    schemaSupply: ["Internet connection", "Travel preferences and budget"],
    schemaTool: "Pack Chat Interface",
    processSteps: [
      { icon: <MessageSquareText />, title: "Chat", description: "Tell Pack what you need, in plain language" },
      { icon: <Brain />, title: "Learn", description: "Pack understands your preferences and patterns, and continues to improve the more you use it" },
      { icon: <Search />, title: "Curate", description: "Flights and stays become one organized draft" },
      { icon: <CheckCircle />, title: "Review", description: "See one clear travel plan and timeline before approval" },
      { icon: <PlaneTakeoff />, title: "Book", description: "Finish checkout through Pack, with your frequent flyer and personal details pre-filled" },
      { icon: <Bell />, title: "Travel", description: "Keep the trip up to date as plans change" },
    ],
    steps: [
      {
        number: 1,
        title: "Start from real travel inputs",
        description:
          "Pack is built around the travel inputs people already create: email confirmations, calendar events, public events, voice notes, photos, photo metadata, and plain-language prompts.",
        features: [
          "Past and upcoming trip details can be pulled from email and calendar context",
          "Trips can begin from synthetic prompts like “a week in Spain”",
          "Public and private events can become planning inputs instead of afterthoughts",
          "Planning starts from real context rather than a blank booking form",
        ],
      },
      {
        number: 2,
        title: "Pack rebuilds your travel footprint",
        description:
          "Instead of only storing the next itinerary, Pack extracts and displays past travel history across flights, hotels, and rental cars, then uses that history to understand how you actually travel.",
        features: [
          "Travel stats and maps turn old bookings into useful context",
          "Loyalty numbers and program details can be extracted across travel categories",
          "Traveler profiles can include preferences, trusted traveler details, and accessibility needs",
          "Future planning gets a much stronger starting point than one-off search history",
        ],
      },
      {
        number: 3,
        title: "Trips can be planned proactively",
        description:
          "Pack does not need to wait for you to manually hunt and gather every leg. It can proactively assemble a trip from meetings, events, timing constraints, or a high-level request and turn that into a workable travel draft.",
        features: [
          "Flights, hotels, and rental cars can be searched as one connected trip problem",
          "Calendar timing and trip events help shape the draft before booking starts",
          "The result is an organized trip view instead of disconnected search tabs",
          "Trip planning becomes proactive instead of purely reactive",
        ],
      },
      {
        number: 4,
        title: "Trips stay editable from the way travel really changes",
        description:
          "Travel plans change through chat, voice, inbox updates, new calendar events, and travel-day surprises. Pack keeps the trip editable from those same channels instead of forcing every change back through manual itinerary cleanup.",
        features: [
          "Trips can be edited and reorganized from chat or voice",
          "Email, calendar, photos, and photo metadata can feed trip updates",
          "Sharing, linked trips, copies, imports, and group workflows keep collaboration intact",
          "Trip changes stay attached to one organized record instead of scattered threads",
        ],
      },
      {
        number: 5,
        title: "Checkout happens in Pack",
        description:
          "Once you are ready, you can complete booking inside Pack so payment, traveler details, and reservation flow stay in one place.",
        features: [
          "In-app checkout for flights and stays",
          "Frequent flyer and personal details can be pre-filled",
          "Less copying and re-entering trip data",
          "Booked details stay connected to your organized trip view",
        ],
      },
      {
        number: 6,
        title: "Travel-day utility stays live",
        description:
          "Pack is meant to stay useful once the trip is real. Upcoming trip views can surface weather, drive times, airport security waits, trip events, transport actions, and other timing details when you are actually moving.",
        features: [
          "Upcoming trip details can include weather, timing, and transportation actions",
          "Airport security wait times can show up in both app and web experiences",
          "Trip events can sync back to device calendars and live trip surfaces",
          "The same system that remembers past travel stays useful on the day of travel too",
        ],
      },
    ],
    comparisonTitle: "Generic trip tools vs. Pack",
    comparisonTraditionalTitle: "Traditional Method",
    comparisonTraditionalItems: [
      "Mostly focused on a single booking session instead of your travel system",
      "Past trips, loyalty details, and travel stats are hard to recover later",
      "Trip changes usually mean manual inbox and calendar cleanup",
      "Travel-day signals like airport waits and timing live in separate tools",
      "Group travel, sharing, and live updates fragment quickly",
      "Each trip starts over with limited memory from the last one",
    ],
    comparisonRouteTitle: "Pack Process",
    comparisonRouteItems: [
      "Travel history, stats, maps, loyalty details, and bookings in one system",
      "Proactive planning from prompts, events, inbox context, and calendar timing",
      "Reactive trip editing from chat, voice, photos, email, and calendar changes",
      "Connected search and booking across flights, hotels, and rental cars",
      "Live upcoming-trip views with weather, airport waits, timing, and actions",
      "A trip record that keeps improving as your travel footprint grows",
    ],
    ctaTitle: "See how Pack would handle your next trip",
    ctaBody:
      "Join the waitlist for early access to a travel system that can remember the trips you have taken, plan the ones ahead, and stay useful on travel day.",
  },
  es: {
    pageTitle: "Cómo funciona Pack",
    pageSubtitle:
      "Pack convierte conversación y contexto de viaje en un trayecto que puedes revisar, aprobar y reservar con confianza.",
    schemaName: "Cómo planear y reservar un viaje con Pack",
    schemaDescription:
      "Descubre cómo Pack te ayuda a reconstruir historial de viajes, planear trayectos de forma proactiva, actualizar itinerarios desde entradas reales y adelantarte a los detalles del día de viaje.",
    schemaSupply: ["Conexión a internet", "Preferencias de viaje y presupuesto"],
    schemaTool: "Interfaz de chat de Pack",
    processSteps: [
      { icon: <MessageSquareText />, title: "Habla", description: "Dile a Pack lo que necesitas, en lenguaje natural" },
      { icon: <Brain />, title: "Aprende", description: "Pack entiende tus preferencias y patrones, y sigue mejorando cuanto más lo usas" },
      { icon: <Search />, title: "Curar", description: "Vuelos y estancias se convierten en un borrador organizado" },
      { icon: <CheckCircle />, title: "Revisa", description: "Ve un plan y una cronología claros antes de aprobar" },
      { icon: <PlaneTakeoff />, title: "Reserva", description: "Termina el checkout dentro de Pack, con tus datos personales y de viajero frecuente prellenados" },
      { icon: <Bell />, title: "Viaja", description: "Mantén el viaje al día a medida que cambian los planes" },
    ],
    steps: [
      {
        number: 1,
        title: "Empieza desde entradas reales de viaje",
        description:
          "Pack está diseñado alrededor de las entradas que los viajeros ya generan: correos de confirmación, eventos del calendario, eventos públicos, notas de voz, fotos, metadatos de fotos y prompts en lenguaje natural.",
        features: [
          "Los detalles de viajes pasados y futuros pueden llegar desde correo y calendario",
          "Los viajes pueden empezar desde prompts sintéticos como “una semana en España”",
          "Eventos públicos y privados pueden convertirse en entradas de planificación",
          "La planificación parte del contexto real y no de un formulario vacío",
        ],
      },
      {
        number: 2,
        title: "Pack reconstruye tu huella de viaje",
        description:
          "En lugar de guardar solo el siguiente itinerario, Pack extrae y muestra historial de viajes pasados entre vuelos, hoteles y autos, y usa ese historial para entender cómo viajas en realidad.",
        features: [
          "Estadísticas y mapas convierten reservas antiguas en contexto útil",
          "Se pueden extraer números de lealtad y detalles de programas en distintas categorías",
          "Los perfiles del viajero pueden incluir preferencias, trusted traveler y accesibilidad",
          "La planificación futura obtiene un mejor punto de partida que un historial de búsqueda aislado",
        ],
      },
      {
        number: 3,
        title: "Los viajes pueden planearse de forma proactiva",
        description:
          "Pack no necesita esperar a que busques manualmente cada tramo. Puede armar un viaje desde reuniones, eventos, restricciones de tiempo o una petición general y convertirlo en un borrador útil.",
        features: [
          "Vuelos, hoteles y autos pueden buscarse como un problema de viaje conectado",
          "Los tiempos del calendario y los eventos ayudan a moldear el borrador antes de reservar",
          "El resultado es una vista organizada del viaje en vez de pestañas sueltas",
          "La planificación se vuelve proactiva y no solo reactiva",
        ],
      },
      {
        number: 4,
        title: "Los viajes siguen editables como cambian en la vida real",
        description:
          "Los planes cambian por chat, voz, correos nuevos, eventos del calendario y sorpresas del día de viaje. Pack mantiene el viaje editable desde esos mismos canales en lugar de obligarte a limpiar el itinerario a mano.",
        features: [
          "Los viajes pueden editarse y reorganizarse desde chat o voz",
          "Correo, calendario, fotos y metadatos de fotos pueden alimentar actualizaciones",
          "Compartir, viajes vinculados, copias, importaciones y grupos mantienen la colaboración",
          "Los cambios quedan unidos a un solo registro organizado en vez de hilos dispersos",
        ],
      },
      {
        number: 5,
        title: "El checkout ocurre dentro de Pack",
        description:
          "Cuando estás listo, puedes completar la reserva dentro de Pack para que el pago, los datos del viajero y el flujo de reservación permanezcan en un solo lugar.",
        features: [
          "Checkout dentro de la app para vuelos y estancias",
          "Los datos personales y de viajero frecuente pueden venir prellenados",
          "Menos copiar y volver a ingresar información",
          "Los detalles reservados permanecen conectados a tu vista organizada del viaje",
        ],
      },
      {
        number: 6,
        title: "La utilidad del día de viaje sigue viva",
        description:
          "Pack está pensado para seguir siendo útil cuando el viaje ya es real. Las vistas próximas del viaje pueden mostrar clima, tiempos de traslado, esperas de seguridad, eventos, acciones de transporte y otros detalles cuando realmente te estás moviendo.",
        features: [
          "Los detalles próximos del viaje pueden incluir clima, tiempos y acciones de transporte",
          "Los tiempos de espera de seguridad pueden aparecer tanto en la app como en la web",
          "Los eventos del viaje pueden sincronizarse con calendarios del dispositivo y superficies en vivo",
          "El mismo sistema que recuerda viajes pasados sigue sirviendo el día del viaje",
        ],
      },
    ],
    comparisonTitle: "Herramientas genéricas de viaje vs. Pack",
    comparisonTraditionalTitle: "Método tradicional",
    comparisonTraditionalItems: [
      "Suelen enfocarse en una sola reserva y no en tu sistema completo de viaje",
      "Es difícil recuperar luego viajes pasados, datos de lealtad y estadísticas",
      "Los cambios del viaje suelen implicar limpiar correo y calendario a mano",
      "Señales del día de viaje como esperas de aeropuerto viven en herramientas aparte",
      "Compartir, viajar en grupo y actualizar en vivo se fragmenta rápido",
      "Cada viaje nuevo empieza casi desde cero",
    ],
    comparisonRouteTitle: "Proceso Pack",
    comparisonRouteItems: [
      "Historial, estadísticas, mapas, lealtad y reservas dentro de un mismo sistema",
      "Planificación proactiva desde prompts, eventos, correo y calendario",
      "Edición reactiva desde chat, voz, fotos, correos y cambios del calendario",
      "Búsqueda y reserva conectadas entre vuelos, hoteles y autos",
      "Vistas próximas con clima, esperas de aeropuerto, tiempos y acciones",
      "Un registro de viaje que mejora a medida que crece tu huella de viaje",
    ],
    ctaTitle: "Mira cómo Pack manejaría tu próximo viaje",
    ctaBody:
      "Únete a la lista de espera para acceder antes a un sistema de viaje que puede recordar los viajes que hiciste, planear los siguientes y seguir siendo útil el día de viaje.",
  },
} as const;

const HowItWorks: React.FC = () => {
  const { locale } = useI18n();
  const localizedContent = howItWorksContent[locale];
  const steps = localizedContent.steps;
  const processSteps = localizedContent.processSteps;
  const localizedHowItWorksPath = locale === "en" ? "/how-it-works" : `/${locale}/how-it-works`;
  const howItWorksSchema = {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name: localizedContent.schemaName,
    description: localizedContent.schemaDescription,
    image: buildAbsoluteUrl("/images/og-image.png"),
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
      url: buildAbsoluteUrl(`${localizedHowItWorksPath}#step-${index + 1}`),
    })),
  };

  return (
    <HowItWorksContainer>
      <PageSeo
        title="How Pack Works | AI travel planning from prompt to booking"
        description="See how Pack turns travel prompts, confirmations, calendars, and preferences into organized trips you can review, update, and book."
        path="/how-it-works"
        schema={[howItWorksSchema]}
      />
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
        <WaitlistForm />
      </div>
    </HowItWorksContainer>
  );
};

export default HowItWorks;
