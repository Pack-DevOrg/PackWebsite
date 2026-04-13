import React, { useState } from "react";
import styled from "styled-components";
import {
  ChevronDown,
  PlaneTakeoff,
  Calendar,
  CreditCard,
  Shield,
  Smartphone,
} from "lucide-react";
import WaitlistForm from "../components/WaitlistForm";
import { useI18n } from "@/i18n/I18nProvider";
import PageSeo from "@/seo/pageSeo";

const FAQContainer = styled.section`
  max-width: 800px;
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
  text-align: center;
`;

const FAQGrid = styled.div`
  display: grid;
  gap: var(--space-3);
`;

const CategorySection = styled.div`
  margin-bottom: var(--space-4);
`;

const CategoryTitle = styled.h2`
  font-size: var(--font-size-xl);
  color: var(--color-accent);
  margin-bottom: var(--space-3);
  display: flex;
  align-items: center;
  gap: var(--space-2);

  svg {
    width: 24px;
    height: 24px;
  }
`;

const FAQItem = styled.div`
  background: rgba(255, 255, 255, 0.03);
  border-radius: var(--border-radius);
  border: 1px solid rgba(255, 255, 255, 0.05);
  overflow: hidden;
  margin-bottom: var(--space-2);
`;

const QuestionButton = styled.button`
  width: 100%;
  padding: var(--space-3) var(--space-4);
  background: none;
  border: none;
  color: var(--color-text-primary);
  font-size: var(--font-size-medium);
  font-weight: 600;
  text-align: left;
  cursor: pointer;
  display: flex;
  justify-content: space-between;
  align-items: center;
  transition: background-color 0.2s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.05);
  }
`;

const ChevronIcon = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-accent);
  transform: rotate(0deg);
  transition: transform 160ms ease-out;

  &[data-open="true"] {
    transform: rotate(180deg);
  }

  @media (prefers-reduced-motion: reduce) {
    transition: none;
  }
`;

const AnswerContainer = styled.div`
  overflow: hidden;
`;

const Answer = styled.div`
  padding: 0 var(--space-4) var(--space-3);
  color: var(--color-text-secondary);
  line-height: 1.6;

  p {
    margin-bottom: var(--space-2);
  }

  ul {
    margin: var(--space-2) 0;
    padding-left: var(--space-4);
  }

  li {
    margin-bottom: var(--space-1);
  }

  strong {
    color: var(--color-text-primary);
  }
`;

interface FAQItemProps {
  id: string;
  question: string;
  answer: string | JSX.Element;
  isOpen: boolean;
  onToggle: () => void;
}

const FAQItemComponent: React.FC<FAQItemProps> = ({
  id,
  question,
  answer,
  isOpen,
  onToggle,
}) => {
  const answerId = `faq-answer-${id}`;

  return (
    <FAQItem>
      <QuestionButton
        onClick={onToggle}
        aria-expanded={isOpen}
        aria-controls={answerId}
      >
        {question}
        <ChevronIcon data-open={isOpen ? "true" : "false"}>
          <ChevronDown size={20} />
        </ChevronIcon>
      </QuestionButton>

      <AnswerContainer id={answerId} hidden={!isOpen}>
        <Answer aria-hidden={!isOpen}>
          {typeof answer === "string" ? <p>{answer}</p> : answer}
        </Answer>
      </AnswerContainer>
    </FAQItem>
  );
};

const faqContent = {
  en: {
    title: "Pack FAQ",
    subtitle:
      "How Pack helps when confirmations are scattered, planning feels overwhelming, and booking details keep slipping across too many tools.",
    ctaTitle: "Still have questions?",
    ctaBody:
      "Join the waitlist to get early access to a more organized and more personalized way to plan travel.",
    categories: [
      {
        id: "getting-started",
        title: "Getting Started",
        icon: <Smartphone />,
        items: [
          {
            id: "what-is-pack",
            question: "What is Pack?",
            answer:
              "Pack is an AI travel app built for a common travel problem: the trip lives in too many places at once. Pack pulls together prompts, confirmations, timing, and traveler preferences so you can review one connected trip instead of piecing it together yourself.",
          },
          {
            id: "is-pack-ai-travel-planner",
            question: "Is Pack an AI travel planner?",
            answer:
              "Yes. Pack is designed as an AI travel planner that uses natural language, past trips, confirmation emails, and travel preferences to help assemble a trip draft before you book. The point is to reduce research sprawl and make the trip easier to verify before money is on the line.",
          },
          {
            id: "how-does-it-work",
            question: "How does Pack work?",
            answer:
              "You can describe a trip in natural language or let Pack organize trips you have already started elsewhere. Pack uses your preferences and travel context to build a trip draft, then keeps planning, booking, and trip details closer together so you spend less time translating between tools.",
          },
          {
            id: "when-available",
            question: "When will Pack be available?",
            answer:
              "Pack is in active development, and early access is coming soon. Join the waitlist to hear when the product opens up.",
          },
        ],
      },
      {
        id: "features-capabilities",
        title: "Features & Capabilities",
        icon: <PlaneTakeoff />,
        items: [
          {
            id: "what-can-pack-book",
            question: "What can Pack help me book?",
            answer:
              "Pack helps coordinate flights and hotels, then lets you complete the booking flow inside Pack. That matters because booking details, payment, and itinerary context stay connected in one place instead of splitting apart across confirmation emails and separate provider pages.",
          },
          {
            id: "supports-destinations",
            question: "Which destinations does Pack support?",
            answer:
              "Pack supports travel planning worldwide with access to global flight networks and international hotel chains. From weekend getaways to month-long adventures.",
          },
          {
            id: "travel-planning",
            question: "What makes Pack different from other travel apps?",
            answer:
              "Most travel apps give you search results and leave the organizing to you. Pack is designed to give you a clearer trip answer by combining how you travel, confirmation details, and calendar timing into one draft you can review before checkout.",
          },
          {
            id: "past-travel-history",
            question: "Can Pack extract and display my past travel history?",
            answer:
              "Yes. Pack is designed to reconstruct past flights, hotel stays, rental cars, and related trip records so old trips stop disappearing into inbox clutter. That makes repeat travel easier to plan because prior trip context is easier to find and reuse.",
          },
          {
            id: "travel-stats-maps",
            question: "Can Pack show travel stats and maps across flights, hotels, and rental cars?",
            answer:
              "Yes. Pack is designed to show travel stats, route context, and maps so scattered trip records become easier to understand at a glance. Instead of isolated bookings, you get a clearer picture of where you went, how often, and how trips connect.",
          },
          {
            id: "loyalty-programs",
            question: "Can Pack extract loyalty numbers and program details?",
            answer:
              "Yes. Pack is designed to organize loyalty numbers and program details for flights, hotels, and rental cars so those details stop getting lost across emails, apps, and old bookings.",
          },
          {
            id: "technology-security",
            question: "How reliable and secure is Pack?",
            answer:
              "Pack is built to make travel details easier to verify before you book while handling travel data and checkout details with care inside Pack. The goal is fewer avoidable booking mistakes and less uncertainty about what you are actually approving.",
          },
          {
            id: "flight-disruptions",
            question: "What happens if my flight is delayed or cancelled?",
            answer:
              "Pack is designed to keep your trip context readable when plans change. If a flight is delayed or cancelled, the goal is to make the next useful details easier to see quickly, like updated timing, what part of the trip is affected, and what comes next.",
          },
          {
            id: "tech-reliability",
            question: "How reliable is Pack compared to other travel apps?",
            answer:
              "Pack is focused on clarity and continuity. Instead of making you reconstruct the trip across multiple apps, Pack keeps more of the itinerary, updates, and traveler context in one place that is easier to trust before and during the trip.",
          },
        ],
      },
      {
        id: "planning-booking",
        title: "Planning & Booking",
        icon: <Calendar />,
        items: [
          {
            id: "how-personalized",
            question: "How personalized are Pack's recommendations?",
            answer: (
              <div>
                <p>Pack creates highly personalized recommendations by understanding:</p>
                <ul>
                  <li>
                    <strong>Budget range:</strong> What feels reasonable for the trip
                  </li>
                  <li>
                    <strong>Trip style:</strong> Business, leisure, quick getaway, or longer stay
                  </li>
                  <li>
                    <strong>Flight patterns:</strong> Preferred airports, airlines, and routing habits
                  </li>
                  <li>
                    <strong>Stay preferences:</strong> Hotel style, location, and pace
                  </li>
                  <li>
                    <strong>Past travel behavior:</strong> Learning from your booking history and timing patterns
                  </li>
                </ul>
                <p>The more you use Pack, the better it understands your unique travel preferences.</p>
              </div>
            ),
          },
          {
            id: "automation-goal",
            question: "What is Pack's goal for travel planning?",
            answer:
              "Pack aims to automate the parts of travel planning that feel repetitive, fragmented, and easy to get wrong. From understanding your preferences and narrowing options to guiding secure checkout inside Pack and organizing the itinerary afterward, the goal is less admin work and more confidence in the trip you are approving.",
          },
          {
            id: "last-minute-travel",
            question: "Does Pack work for last-minute travel?",
            answer:
              "Yes. Last-minute travel is exactly where a clearer planning flow helps most. Pack can help you move faster from request to review by organizing options into one trip draft instead of forcing you to search, compare, and verify everything manually under time pressure.",
          },
          {
            id: "email-confirmations",
            question: "What if I lose my booking confirmation emails?",
            answer: (
              <div>
                <p>This is a common problem Pack is designed to solve:</p>
                <ul>
                  <li>
                    <strong>Automatic Discovery:</strong> Pack finds all travel confirmations in your email inbox
                  </li>
                  <li>
                    <strong>Secure Backup:</strong> All confirmation codes and booking references are stored safely in one place
                  </li>
                  <li>
                    <strong>Easy Access:</strong> Find any booking detail instantly, even if the original email is deleted
                  </li>
                  <li>
                    <strong>Never Lose Details:</strong> No more hunting through cluttered inboxes for booking information
                  </li>
                </ul>
                <p>The goal is simple: make key booking details easier to find when you need them.</p>
              </div>
            ),
          },
          {
            id: "past-trips-from-connected-data",
            question: "Can Pack rebuild past trips from connected travel data?",
            answer:
              "Yes. Connected emails, calendars, photos, and related travel signals can help Pack reconstruct trip history when older bookings are hard to track down. That makes reservation details easier to recover and reuse later.",
          },
          {
            id: "proactive-trip-planning",
            question: "Can Pack proactively plan trips from events or prompts?",
            answer:
              "Yes. Pack is designed to proactively plan trips from public events, private email or calendar events, and plain-language prompts. That helps when the reason for travel already exists but the itinerary has not been translated into bookings yet.",
          },
          {
            id: "edit-trips-from-inputs",
            question: "Can I edit or update trips from chat, voice, photos, email, or calendar?",
            answer:
              "Yes. Pack is designed to let trips be edited and reactively updated from chat, voice, photos, email, calendar inputs, and photo metadata. That matters because real trip changes rarely happen in one clean workflow.",
          },
          {
            id: "travel-photo-albums",
            question: "Can Pack create a travel photo album, trip map, or travel journal?",
            answer:
              "That is a natural direction for Pack. When trip confirmations, dates, places, and photos are connected, Pack can present a trip as something closer to a travel album, mapped timeline, or journal instead of a pile of disconnected records.",
          },
          {
            id: "trip-utility-details",
            question: "What trip details can Pack show before and during travel?",
            answer:
              "Pack can show upcoming trip details such as weather, timing, airport security wait times, trip events, drive times, and transportation actions so the trip stays useful as departure gets closer. The goal is fewer last-minute context switches on travel day.",
          },
          {
            id: "calendar-sync",
            question: "Can Pack sync trip events to my device calendar?",
            answer:
              "Yes. Pack is designed to sync trip events into device calendars so key travel moments stay visible inside the schedule you already trust instead of only inside a separate travel app.",
          },
          {
            id: "connected-accounts",
            question: "Can Pack connect external accounts and travel providers?",
            answer:
              "Yes. Pack is designed to connect external accounts and providers so email, calendar, and travel context can be pulled into one more useful trip view. This reduces manual forwarding, re-entry, and setup work.",
          },
          {
            id: "profiles-accessibility",
            question: "Can Pack manage traveler profiles, accessibility needs, and loyalty information?",
            answer:
              "Yes. Pack is designed to manage traveler profiles, preferences, trusted traveler details, accessibility needs, and loyalty information as part of the trip planning experience so repeated traveler context does not have to be rebuilt every time.",
          },
          {
            id: "sharing-group-travel",
            question: "Can I share trips and collaborate with other travelers?",
            answer:
              "Yes. Pack is designed to support trip links, invitations, linked trips, imports, copies, and group travel workflows so group travel does not fall apart across screenshots, forwarded emails, and side threads.",
          },
          {
            id: "live-trip-views",
            question: "Does Pack support live upcoming-trip views?",
            answer:
              "Yes. Pack is designed to support live upcoming-trip views with status details and trip actions so the next leg of travel stays easy to access when time is tight and reopening the full itinerary is too slow.",
          },
          {
            id: "trip-expenses",
            question: "Can Pack organize trip expenses?",
            answer:
              "Yes. Organizing trip expenses is part of the Pack product direction so travel costs stay attached to the broader trip record instead of living in separate spreadsheets, notes, and reimbursements later.",
          },
          {
            id: "booking-mistakes",
            question: "How does Pack help prevent booking mistakes?",
            answer: (
              <div>
                <p>
                  Pack helps reduce common travel booking mistakes by making the trip easier to
                  review before you approve it:
                </p>
                <ul>
                  <li>
                    <strong>Date awareness:</strong> Travel timing can be checked against the rest
                    of your trip context
                  </li>
                  <li>
                    <strong>Airport clarity:</strong> Routes and airport choices are easier to
                    verify in one place
                  </li>
                  <li>
                    <strong>Time context:</strong> Departures, arrivals, and stays are visible
                    together instead of across multiple tabs
                  </li>
                  <li>
                    <strong>Fewer blind spots:</strong> You review a connected itinerary rather
                    than isolated booking screens
                  </li>
                </ul>
                <p>
                  The goal is simple: fewer avoidable mistakes, less stress, and more confidence
                  before booking.
                </p>
              </div>
            ),
          },
          {
            id: "planning-stress",
            question: "I find travel planning overwhelming. How can Pack help?",
            answer: (
              <div>
                <p>Pack is designed to lower the mental load of planning by:</p>
                <ul>
                  <li>
                    <strong>Reducing information overload:</strong> Travel details are organized
                    into one clearer trip view
                  </li>
                  <li>
                    <strong>Reducing decision fatigue:</strong> Options are curated around your
                    preferences
                  </li>
                  <li>
                    <strong>Cutting down research:</strong> Less manual comparison across multiple
                    sites
                  </li>
                  <li>
                    <strong>Keeping it organized:</strong> Confirmations and timing stay easier to
                    find when you need them
                  </li>
                </ul>
                <p>
                  The result is a planning experience that feels more curated, more manageable, and
                  easier to approve.
                </p>
              </div>
            ),
          },
        ],
      },
      {
        id: "pricing-payments",
        title: "Pricing & Payments",
        icon: <CreditCard />,
        items: [
          {
            id: "cost-to-use",
            question: "How much does Pack cost?",
            answer:
              "Pricing details for Pack will be announced closer to launch. We're designing a pricing structure that provides excellent value for travelers while supporting the development of new features.",
          },
          {
            id: "booking-fees",
            question: "Are there additional booking fees?",
            answer:
              "Pack aims to offer transparent pricing. We surface the total cost provided by the airline or hotel and clearly label any applicable service fees before you authorize payment. Pack itself does not add or collect separate booking fees.",
          },
          {
            id: "payment-methods",
            question: "What payment methods does Pack accept?",
            answer:
              "Pack supports the payment methods made available through its in-app checkout flow. The exact options may vary by booking, but payment happens inside Pack rather than through a separate provider checkout page.",
          },
        ],
      },
      {
        id: "privacy-security",
        title: "Privacy & Security",
        icon: <Shield />,
        items: [
          {
            id: "data-privacy",
            question: "How does Pack protect my personal information?",
            answer: (
              <div>
                <p>Your privacy and security are our top priorities:</p>
                <ul>
                  <li>
                    <strong>Encryption:</strong> All data is encrypted in transit and at rest
                  </li>
                  <li>
                    <strong>No selling data:</strong> We never sell your personal information to
                    third parties
                  </li>
                  <li>
                    <strong>Secure payments:</strong> All transactions use industry-standard
                    security
                  </li>
                  <li>
                    <strong>Privacy-focused:</strong> Designed to meet GDPR requirements and
                    international privacy standards
                  </li>
                </ul>
              </div>
            ),
          },
          {
            id: "data-usage",
            question: "What data does Pack collect?",
            answer:
              "Pack uses the travel information needed to organize trips, personalize recommendations, and improve future planning. That can include booking details, connected travel context, preferences, and limited product usage data. For the complete policy, see our Privacy Policy.",
          },
          {
            id: "booking-security",
            question: "Is it safe to book travel through Pack?",
            answer:
              "Yes. Pack is designed to support secure in-app checkout with industry-standard protections for payment and traveler information. Booking still follows the applicable airline or hotel reservation terms, while the full checkout flow stays inside Pack.",
          },
        ],
      },
    ],
  },
  es: {
    title: "Preguntas frecuentes de Pack",
    subtitle:
      "Qué hace Pack, cómo funciona la reserva y cómo se maneja tu información de viaje.",
    ctaTitle: "¿Todavía tienes preguntas?",
    ctaBody:
      "Únete a la lista de espera para obtener acceso anticipado a una forma más organizada y personalizada de planear viajes.",
    categories: [
      {
        id: "getting-started",
        title: "Primeros pasos",
        icon: <Smartphone />,
        items: [
          {
            id: "what-is-pack",
            question: "¿Qué es Pack?",
            answer:
              "Pack es una app de planificación de viajes con IA que convierte conversaciones, confirmaciones, contexto del calendario y señales de viajes pasados en borradores de viaje organizados. En lugar de saltar entre pestañas, correos y sitios de reserva, obtienes una vista más clara del viaje antes de reservar.",
          },
          {
            id: "is-pack-ai-travel-planner",
            question: "¿Pack es un planificador de viajes con IA?",
            answer:
              "Sí. Pack está diseñado como un planificador de viajes con IA que usa lenguaje natural, viajes pasados, correos de confirmación y preferencias para ayudarte a armar un borrador de viaje antes de reservar.",
          },
          {
            id: "how-does-it-work",
            question: "¿Cómo funciona Pack?",
            answer:
              "Puedes describir un viaje en lenguaje natural o conectar tu contexto de viaje para que Pack organice lo que ya está en marcha. A partir de ahí, Pack aprende tus preferencias, arma un borrador del viaje y te permite completar la reserva dentro de Pack cuando estás listo.",
          },
          {
            id: "when-available",
            question: "¿Cuándo estará disponible Pack?",
            answer:
              "Pack está en desarrollo activo y el acceso anticipado llegará pronto. Únete a la lista de espera para enterarte cuando el producto se abra.",
          },
        ],
      },
      {
        id: "features-capabilities",
        title: "Funciones y capacidades",
        icon: <PlaneTakeoff />,
        items: [
          {
            id: "what-can-pack-book",
            question: "¿Qué puede ayudarme a reservar Pack?",
            answer:
              "Pack ayuda a coordinar vuelos y hoteles, y te permite completar todo el flujo de reserva dentro de Pack. La reservación, el pago y los detalles del viaje permanecen conectados en un solo lugar.",
          },
          {
            id: "supports-destinations",
            question: "¿Qué destinos admite Pack?",
            answer:
              "Pack admite planificación de viajes en todo el mundo con acceso a redes globales de vuelos y cadenas hoteleras internacionales. Desde escapadas de fin de semana hasta aventuras de un mes.",
          },
          {
            id: "travel-planning",
            question: "¿Qué hace diferente a Pack de otras apps de viaje?",
            answer:
              "La mayoría de las apps de viaje te muestran resultados de búsqueda. Pack está diseñada para darte una respuesta más clara. Aprende cómo viajas, incorpora confirmaciones y tiempos del calendario, arma un borrador del viaje y te permite completar el checkout dentro de la app de Pack.",
          },
          {
            id: "past-travel-history",
            question: "¿Pack puede extraer y mostrar mi historial de viajes pasados?",
            answer:
              "Sí. Pack está diseñado para extraer y mostrar historial de viajes pasados para que vuelos, hoteles, autos y otros registros queden más fáciles de revisar y reutilizar.",
          },
          {
            id: "travel-stats-maps",
            question: "¿Pack puede mostrar stats y mapas entre vuelos, hoteles y autos?",
            answer:
              "Sí. Pack está diseñado para mostrar stats de viaje, contexto de rutas y mapas para que tu huella de viaje sea más fácil de entender entre distintos componentes del viaje.",
          },
          {
            id: "loyalty-programs",
            question: "¿Pack puede extraer números de lealtad y detalles de programas?",
            answer:
              "Sí. Pack está diseñado para organizar números de lealtad y detalles de programas de vuelos, hoteles y autos para que la información del viajero sea más fácil de encontrar.",
          },
          {
            id: "technology-security",
            question: "¿Qué tan confiable y seguro es Pack?",
            answer:
              "Pack está diseñado para que los detalles del viaje sean más fáciles de verificar antes de reservar, tratando la información de viaje y checkout con seguridad y cuidado dentro de Pack.",
          },
          {
            id: "flight-disruptions",
            question: "¿Qué pasa si mi vuelo se retrasa o se cancela?",
            answer:
              "Pack está diseñado para que el contexto del viaje sea más fácil de seguir cuando cambian los planes. A medida que se actualizan los detalles del viaje, puede ayudarte a mostrar la siguiente información útil, como la hora de salida, los detalles de llegada y lo que sigue en el itinerario.",
          },
          {
            id: "tech-reliability",
            question: "¿Qué tan confiable es Pack frente a otras apps de viaje?",
            answer:
              "Pack se enfoca en claridad y continuidad. En vez de obligarte a reconstruir reservas entre varias apps, organiza los detalles del viaje en un solo lugar que es más fácil de revisar antes y durante el viaje.",
          },
        ],
      },
      {
        id: "planning-booking",
        title: "Planificación y reserva",
        icon: <Calendar />,
        items: [
          {
            id: "how-personalized",
            question: "¿Qué tan personalizadas son las recomendaciones de Pack?",
            answer: (
              <div>
                <p>Pack crea recomendaciones muy personalizadas al entender:</p>
                <ul>
                  <li>
                    <strong>Rango de presupuesto:</strong> Qué se siente razonable para el viaje
                  </li>
                  <li>
                    <strong>Estilo de viaje:</strong> Negocios, placer, escapada rápida o estancia
                    larga
                  </li>
                  <li>
                    <strong>Patrones de vuelo:</strong> Aeropuertos, aerolíneas y rutas preferidas
                  </li>
                  <li>
                    <strong>Preferencias de estancia:</strong> Estilo de hotel, ubicación y ritmo
                  </li>
                  <li>
                    <strong>Comportamiento pasado:</strong> Aprender de tu historial de reservas y
                    patrones de tiempo
                  </li>
                </ul>
                <p>Cuanto más uses Pack, mejor entenderá tus preferencias de viaje.</p>
              </div>
            ),
          },
          {
            id: "automation-goal",
            question: "¿Cuál es el objetivo de Pack para la planificación de viajes?",
            answer:
              "Pack busca automatizar la mayor parte posible del proceso de viaje. Desde entender tus preferencias y encontrar mejores opciones hasta guiarte por un checkout seguro dentro de Pack y organizar tu itinerario, queremos eliminar la parte tediosa de planear para que te enfoques en disfrutar el viaje.",
          },
          {
            id: "last-minute-travel",
            question: "¿Pack funciona para viajes de último minuto?",
            answer:
              "Sí. Los viajes de último minuto son precisamente donde un flujo más claro ayuda. Pack puede ayudarte a pasar más rápido de la solicitud a la revisión organizando opciones en un borrador de viaje en lugar de hacerte buscar todo manualmente.",
          },
          {
            id: "email-confirmations",
            question: "¿Qué pasa si pierdo mis correos de confirmación?",
            answer: (
              <div>
                <p>Es un problema común que Pack está diseñado para resolver:</p>
                <ul>
                  <li>
                    <strong>Descubrimiento automático:</strong> Pack encuentra confirmaciones de
                    viaje en tu bandeja de entrada
                  </li>
                  <li>
                    <strong>Respaldo seguro:</strong> Los códigos y referencias quedan guardados de
                    forma segura en un solo lugar
                  </li>
                  <li>
                    <strong>Acceso fácil:</strong> Encuentra cualquier detalle al instante, incluso
                    si el correo original desaparece
                  </li>
                  <li>
                    <strong>No pierdes detalles:</strong> Ya no tienes que buscar entre una bandeja
                    saturada
                  </li>
                </ul>
                <p>
                  La meta es simple: que los datos clave de la reserva sean fáciles de encontrar
                  cuando los necesites.
                </p>
              </div>
            ),
          },
          {
            id: "past-trips-from-connected-data",
            question:
              "¿Pack puede reconstruir viajes pasados desde datos de viaje conectados?",
            answer:
              "Sí. Correos, calendarios, fotos y otras señales conectadas pueden ayudar a Pack a reconstruir el historial del viaje y mantener los detalles de reserva más fáciles de encontrar.",
          },
          {
            id: "proactive-trip-planning",
            question: "¿Pack puede planear viajes de forma proactiva desde eventos o prompts?",
            answer:
              "Sí. Pack está diseñado para planear viajes de forma proactiva desde eventos públicos, eventos privados de correo o calendario y prompts en lenguaje natural.",
          },
          {
            id: "edit-trips-from-inputs",
            question:
              "¿Puedo editar o actualizar viajes desde chat, voz, fotos, email o calendario?",
            answer:
              "Sí. Pack está diseñado para que los viajes se puedan editar, organizar y actualizar de forma reactiva desde chat, voz, fotos, email, calendario y metadatos de fotos.",
          },
          {
            id: "travel-photo-albums",
            question:
              "¿Pack puede crear un álbum de viaje, mapa del viaje o diario de viaje?",
            answer:
              "Esa es una dirección natural para Pack. Cuando confirmaciones, fechas, lugares y fotos están conectados, Pack puede presentar un viaje como algo más cercano a un álbum, una cronología en mapa o un diario en lugar de un conjunto de registros desconectados.",
          },
          {
            id: "trip-utility-details",
            question: "¿Qué detalles puede mostrar Pack antes y durante el viaje?",
            answer:
              "Pack puede mostrar detalles del próximo viaje como clima, tiempos, esperas de seguridad aeroportuaria, eventos, tiempos de manejo y acciones de transporte para que el viaje siga siendo útil cuando se acerca la salida.",
          },
          {
            id: "calendar-sync",
            question: "¿Pack puede sincronizar eventos del viaje con mi calendario del dispositivo?",
            answer:
              "Sí. Pack está diseñado para sincronizar eventos del viaje con calendarios del dispositivo para que los momentos clave del viaje se mantengan visibles junto con el resto de tu agenda.",
          },
          {
            id: "connected-accounts",
            question: "¿Pack puede conectar cuentas externas y proveedores de viaje?",
            answer:
              "Sí. Pack está diseñado para conectar cuentas y proveedores externos para que el contexto de correo, calendario y viaje se reúna en una vista más útil del viaje.",
          },
          {
            id: "profiles-accessibility",
            question:
              "¿Pack puede gestionar perfiles del viajero, necesidades de accesibilidad y lealtad?",
            answer:
              "Sí. Pack está diseñado para gestionar perfiles del viajero, preferencias, detalles de viajero confiable, necesidades de accesibilidad e información de lealtad como parte de la experiencia de planificación.",
          },
          {
            id: "sharing-group-travel",
            question: "¿Puedo compartir viajes y colaborar con otros viajeros?",
            answer:
              "Sí. Pack está diseñado para soportar enlaces de viaje, invitaciones, viajes vinculados, importaciones, copias y flujos de viaje grupal para que la planificación se pueda compartir entre personas.",
          },
          {
            id: "live-trip-views",
            question: "¿Pack soporta vistas en vivo del próximo viaje?",
            answer:
              "Sí. Pack está diseñado para soportar vistas en vivo del próximo viaje con estados y acciones útiles para que el siguiente tramo sea fácil de consultar.",
          },
          {
            id: "trip-expenses",
            question: "¿Pack puede organizar gastos del viaje?",
            answer:
              "Sí. Organizar gastos del viaje forma parte de la dirección del producto para que los costos sean más fáciles de revisar dentro del registro completo del viaje.",
          },
          {
            id: "booking-mistakes",
            question: "¿Cómo ayuda Pack a evitar errores de reserva?",
            answer: (
              <div>
                <p>
                  Pack ayuda a reducir errores comunes haciendo que el viaje sea más fácil de
                  revisar antes de aprobarlo:
                </p>
                <ul>
                  <li>
                    <strong>Conciencia de fechas:</strong> El horario se puede revisar contra el
                    resto del contexto del viaje
                  </li>
                  <li>
                    <strong>Claridad de aeropuertos:</strong> Las rutas y los aeropuertos son más
                    fáciles de verificar en un solo lugar
                  </li>
                  <li>
                    <strong>Contexto de tiempo:</strong> Salidas, llegadas y estancias se ven
                    juntas y no en múltiples pestañas
                  </li>
                  <li>
                    <strong>Menos puntos ciegos:</strong> Revisas un itinerario conectado en lugar
                    de pantallas aisladas
                  </li>
                </ul>
                <p>
                  La meta es simple: menos errores evitables, menos estrés y más confianza antes
                  de reservar.
                </p>
              </div>
            ),
          },
          {
            id: "planning-stress",
            question: "La planificación de viajes me abruma. ¿Cómo puede ayudar Pack?",
            answer: (
              <div>
                <p>Pack está diseñado para reducir la carga mental de planear al:</p>
                <ul>
                  <li>
                    <strong>Reducir la sobrecarga:</strong> Los detalles se organizan en una vista
                    más clara del viaje
                  </li>
                  <li>
                    <strong>Reducir la fatiga de decisión:</strong> Las opciones se curan según tus
                    preferencias
                  </li>
                  <li>
                    <strong>Recortar investigación:</strong> Menos comparación manual entre sitios
                  </li>
                  <li>
                    <strong>Mantener orden:</strong> Confirmaciones y horarios siguen siendo fáciles
                    de encontrar
                  </li>
                </ul>
                <p>
                  El resultado es una experiencia que se siente más curada, manejable y fácil de
                  aprobar.
                </p>
              </div>
            ),
          },
        ],
      },
      {
        id: "pricing-payments",
        title: "Precios y pagos",
        icon: <CreditCard />,
        items: [
          {
            id: "cost-to-use",
            question: "¿Cuánto cuesta Pack?",
            answer:
              "Los detalles de precio se anunciarán más cerca del lanzamiento. Estamos diseñando una estructura que ofrezca valor a los viajeros mientras apoya el desarrollo de nuevas funciones.",
          },
          {
            id: "booking-fees",
            question: "¿Hay tarifas adicionales de reserva?",
            answer:
              "Pack busca ofrecer precios transparentes. Mostramos el costo total proporcionado por la aerolínea o el hotel y etiquetamos claramente cualquier cargo aplicable antes de autorizar el pago. Pack no agrega ni cobra tarifas de reserva separadas.",
          },
          {
            id: "payment-methods",
            question: "¿Qué métodos de pago acepta Pack?",
            answer:
              "Pack admite los métodos de pago disponibles dentro de su flujo de checkout en la app. Las opciones exactas pueden variar según la reserva, pero el pago ocurre dentro de Pack y no en una página separada del proveedor.",
          },
        ],
      },
      {
        id: "privacy-security",
        title: "Privacidad y seguridad",
        icon: <Shield />,
        items: [
          {
            id: "data-privacy",
            question: "¿Cómo protege Pack mi información personal?",
            answer: (
              <div>
                <p>Tu privacidad y seguridad son nuestras principales prioridades:</p>
                <ul>
                  <li>
                    <strong>Cifrado:</strong> Todos los datos están cifrados en tránsito y en
                    reposo
                  </li>
                  <li>
                    <strong>No vendemos datos:</strong> Nunca vendemos tu información personal a
                    terceros
                  </li>
                  <li>
                    <strong>Pagos seguros:</strong> Todas las transacciones usan seguridad estándar
                    de la industria
                  </li>
                  <li>
                    <strong>Enfoque en privacidad:</strong> Diseñado para alinearse con GDPR y
                    normas internacionales
                  </li>
                </ul>
              </div>
            ),
          },
          {
            id: "data-usage",
            question: "¿Qué datos recopila Pack?",
            answer:
              "Pack usa la información de viaje necesaria para organizar viajes, personalizar recomendaciones y mejorar la planificación futura. Esto puede incluir detalles de reserva, contexto conectado, preferencias y datos limitados de uso del producto. Para la política completa, consulta nuestra Política de Privacidad.",
          },
          {
            id: "booking-security",
            question: "¿Es seguro reservar viajes a través de Pack?",
            answer:
              "Sí. Pack está diseñado para admitir un checkout seguro dentro de la app con protecciones estándar de la industria para la información de pago y del viajero. La reserva sigue las políticas aplicables de la aerolínea o del hotel, mientras todo el flujo de checkout ocurre dentro de Pack.",
          },
        ],
      },
    ],
  },
} as const;

const FAQ: React.FC = () => {
  const { locale } = useI18n();
  const [openItems, setOpenItems] = useState<Set<string>>(new Set());
  const localizedContent = faqContent[locale];
  const faqCategories = localizedContent.categories;

  const toggleItem = (id: string) => {
    const newOpenItems = new Set(openItems);
    if (newOpenItems.has(id)) {
      newOpenItems.delete(id);
    } else {
      newOpenItems.add(id);
    }
    setOpenItems(newOpenItems);
  };

  const extractTextFromJSX = (element: string | JSX.Element): string => {
    if (typeof element === "string") {
      return element;
    }

    if (React.isValidElement(element) && element.props.children) {
      return extractTextFromChildren(element.props.children);
    }

    return "";
  };

  const extractTextFromChildren = (children: any): string => {
    if (typeof children === "string") {
      return children;
    }
    if (Array.isArray(children)) {
      return children.map((child) => extractTextFromChildren(child)).join(" ");
    }
    if (React.isValidElement(children)) {
      return extractTextFromChildren(children.props.children);
    }
    return "";
  };

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqCategories.flatMap((category) =>
      category.items.map((item) => ({
        "@type": "Question",
        name: item.question,
        acceptedAnswer: {
          "@type": "Answer",
          text: extractTextFromJSX(item.answer),
        },
      }))
    ),
  };

  return (
    <FAQContainer>
      <PageSeo
        title="Pack FAQ | AI travel planning, booking, privacy, and support"
        description="Answers to common questions about Pack, including trip planning, booking flows, privacy, security, and travel-day support."
        path="/faq"
        schema={[faqSchema]}
      />
      <PageHeader>
        <Title>{localizedContent.title}</Title>
        <Subtitle>{localizedContent.subtitle}</Subtitle>
      </PageHeader>

      <div>
        {faqCategories.map((category) => (
          <CategorySection key={category.id}>
            <CategoryTitle>
              {category.icon}
              {category.title}
            </CategoryTitle>
            <FAQGrid>
              {category.items.map((item) => (
                <FAQItemComponent
                  key={item.id}
                  id={item.id}
                  question={item.question}
                  answer={item.answer}
                  isOpen={openItems.has(item.id)}
                  onToggle={() => toggleItem(item.id)}
                />
              ))}
            </FAQGrid>
          </CategorySection>
        ))}
      </div>

      <div
        style={{
          textAlign: "center",
          marginTop: "var(--space-5)",
          padding: "var(--space-4)",
          background: "rgba(249, 47, 96, 0.1)",
          borderRadius: "var(--border-radius)",
          border: "1px solid rgba(249, 47, 96, 0.2)",
        }}
      >
        <h3
          style={{
            marginBottom: "var(--space-2)",
            color: "var(--color-text-primary)",
          }}
        >
          {localizedContent.ctaTitle}
        </h3>
        <p
          style={{
            color: "var(--color-text-secondary)",
            marginBottom: "var(--space-4)",
          }}
        >
          {localizedContent.ctaBody}
        </p>
        <WaitlistForm />
      </div>
    </FAQContainer>
  );
};

export default FAQ;
