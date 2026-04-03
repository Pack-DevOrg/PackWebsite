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
import { useMountEffect } from "../hooks/useMountEffect";
import { useI18n } from "@/i18n/I18nProvider";

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
  question: string;
  answer: string | JSX.Element;
  isOpen: boolean;
  onToggle: () => void;
}

const FAQItemComponent: React.FC<FAQItemProps> = ({
  question,
  answer,
  isOpen,
  onToggle,
}) => {
  return (
    <FAQItem>
      <QuestionButton onClick={onToggle}>
        {question}
        <ChevronIcon data-open={isOpen ? "true" : "false"}>
          <ChevronDown size={20} />
        </ChevronIcon>
      </QuestionButton>

      {isOpen ? (
        <AnswerContainer>
          <Answer>{typeof answer === "string" ? <p>{answer}</p> : answer}</Answer>
        </AnswerContainer>
      ) : null}
    </FAQItem>
  );
};

const faqContent = {
  en: {
    title: "Pack FAQ",
    subtitle:
      "What Pack does, how booking works, and how your travel data is handled.",
    ctaTitle: "Still have questions?",
    ctaBody:
      "Join the waitlist to get early access to a more organized and more personalized way to plan travel.",
    disclaimer:
      "Features described represent planned capabilities. Pack is currently in development. AI technology has limitations and results may vary. No warranties or guarantees are provided.",
    categories: [
      {
        id: "getting-started",
        title: "Getting Started",
        icon: <Smartphone />,
        items: [
          {
            id: "what-is-doneai",
            question: "What is Pack?",
            answer:
              "Pack is a travel planning app that turns conversation, confirmations, and calendar context into organized trip drafts. Instead of juggling tabs, emails, and booking sites, you get one clearer view of the trip before checkout.",
          },
          {
            id: "how-does-it-work",
            question: "How does Pack work?",
            answer:
              "You can describe a trip in natural language or connect your travel context so Pack can organize what is already in motion. From there, Pack learns your preferences, assembles a trip draft, and hands you off to provider checkout when you are ready to book.",
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
            id: "what-can-doneai-book",
            question: "What can Pack help me book?",
            answer:
              "Pack helps coordinate flights and hotels, then sends you into the airline or hotel checkout flow to complete the booking. The reservation and payment stay with the provider.",
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
              "Most travel apps give you search results. Pack is designed to give you a clearer answer. It learns how you travel, pulls in confirmations and calendar timing, builds a trip draft, and keeps checkout with the provider.",
          },
          {
            id: "technology-security",
            question: "How reliable and secure is Pack?",
            answer:
              "Pack is built to make travel details easier to verify before you book while handling travel data with care. Payment details stay on provider-hosted checkout pages rather than inside Pack.",
          },
          {
            id: "flight-disruptions",
            question: "What happens if my flight is delayed or cancelled?",
            answer:
              "Pack is designed to keep your trip context easier to follow when plans change. As travel details update, it can help surface the next useful information, like departure timing, arrival details, and what comes next in the trip.",
          },
          {
            id: "tech-reliability",
            question: "How reliable is Pack compared to other travel apps?",
            answer:
              "Pack is focused on clarity and continuity. Instead of making you piece together bookings across multiple apps, it organizes travel details into one place that is easier to review before and during a trip.",
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
              "Pack aims to automate as much of the travel process as possible. From understanding your preferences and finding the best options to guiding you through secure checkout directly with the airline or hotel and organizing your itinerary, we want to eliminate the tedious parts of travel planning so you can focus on enjoying your trip.",
          },
          {
            id: "last-minute-travel",
            question: "Does Pack work for last-minute travel?",
            answer:
              "Yes. Last-minute travel is exactly where a clearer planning flow helps. Pack can help you move faster from request to review by organizing options into a trip draft instead of making you search everything manually.",
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
                  before checkout.
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
              "Payment methods depend on the airline or hotel checkout page you use. Because Pack hands you off to the provider to complete the purchase, the available payment options are set by that provider.",
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
                    <strong>Minimal data collection:</strong> We only collect what&apos;s necessary
                    for bookings
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
              "Yes. Checkout happens on PCI-compliant pages hosted directly by the airline or hotel partner, so your payment details go straight to the merchant of record. Pack never sees or stores your card information, and your reservations include the standard policies from the airline or hotel you purchase from.",
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
    disclaimer:
      "Las funciones descritas representan capacidades planificadas. Pack está actualmente en desarrollo. La tecnología de IA tiene limitaciones y los resultados pueden variar. No se ofrecen garantías.",
    categories: [
      {
        id: "getting-started",
        title: "Primeros pasos",
        icon: <Smartphone />,
        items: [
          {
            id: "what-is-doneai",
            question: "¿Qué es Pack?",
            answer:
              "Pack es una app de planificación de viajes que convierte conversaciones, confirmaciones y contexto del calendario en borradores de viaje organizados. En lugar de saltar entre pestañas, correos y sitios de reserva, obtienes una vista más clara del viaje antes del checkout.",
          },
          {
            id: "how-does-it-work",
            question: "¿Cómo funciona Pack?",
            answer:
              "Puedes describir un viaje en lenguaje natural o conectar tu contexto de viaje para que Pack organice lo que ya está en marcha. A partir de ahí, Pack aprende tus preferencias, arma un borrador del viaje y te envía al checkout del proveedor cuando estás listo para reservar.",
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
            id: "what-can-doneai-book",
            question: "¿Qué puede ayudarme a reservar Pack?",
            answer:
              "Pack ayuda a coordinar vuelos y hoteles, y luego te envía al flujo de checkout de la aerolínea o del hotel para completar la reserva. La reservación y el pago permanecen con el proveedor.",
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
              "La mayoría de las apps de viaje te muestran resultados de búsqueda. Pack está diseñada para darte una respuesta más clara. Aprende cómo viajas, incorpora confirmaciones y tiempos del calendario, arma un borrador del viaje y mantiene el checkout con el proveedor.",
          },
          {
            id: "technology-security",
            question: "¿Qué tan confiable y seguro es Pack?",
            answer:
              "Pack está diseñado para que los detalles del viaje sean más fáciles de verificar antes de reservar, tratando la información con cuidado. Los datos de pago permanecen en páginas de checkout alojadas por el proveedor, no dentro de Pack.",
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
              "Pack busca automatizar la mayor parte posible del proceso de viaje. Desde entender tus preferencias y encontrar mejores opciones hasta guiarte al checkout seguro directamente con la aerolínea o el hotel y organizar tu itinerario, queremos eliminar la parte tediosa de planear para que te enfoques en disfrutar el viaje.",
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
                  del checkout.
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
              "Los métodos de pago dependen de la página de checkout de la aerolínea o del hotel que uses. Como Pack te envía al proveedor para completar la compra, las opciones disponibles las define ese proveedor.",
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
                    <strong>Recolección mínima:</strong> Solo recopilamos lo necesario para las
                    reservas
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
              "Sí. El checkout ocurre en páginas alojadas directamente por la aerolínea o el hotel asociado y compatibles con PCI, así que tus datos de pago van directo al merchant of record. Pack nunca ve ni almacena la información de tu tarjeta, y tus reservas incluyen las políticas estándar del proveedor al que compras.",
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

  useMountEffect(() => {
    const generateFAQSchema = () => {
      const faqItems = faqCategories.flatMap((category) =>
        category.items.map((item) => ({
          "@type": "Question",
          name: item.question,
          acceptedAnswer: {
            "@type": "Answer",
            text: extractTextFromJSX(item.answer),
          },
        }))
      );

      const schema = {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: faqItems,
      };

      const existingSchema = document.querySelector('script[data-schema="faq"]');
      if (existingSchema) {
        existingSchema.remove();
      }

      const script = document.createElement("script");
      script.type = "application/ld+json";
      script.setAttribute("data-schema", "faq");
      script.textContent = JSON.stringify(schema);
      document.head.appendChild(script);
    };

    generateFAQSchema();

    return () => {
      const schema = document.querySelector('script[data-schema="faq"]');
      if (schema) {
        schema.remove();
      }
    };
  });

  return (
    <FAQContainer>
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
    </FAQContainer>
  );
};

export default FAQ;
