import React from "react";
import styled, { keyframes } from "styled-components";
import { useI18n } from "@/i18n/I18nProvider";
import AccentWord from "./AccentWord";

const pulse = keyframes`
  0%, 100% {
    transform: scale(1);
    opacity: 0.7;
  }
  50% {
    transform: scale(1.18);
    opacity: 1;
  }
`;

const scan = keyframes`
  0% {
    transform: translateX(-10%);
  }
  100% {
    transform: translateX(110%);
  }
`;

const Section = styled.section`
  display: grid;
  gap: 1.5rem;
`;

const Header = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  align-items: end;
  justify-content: space-between;
`;

const Title = styled.h2`
  margin: 0;
  max-width: 10ch;
  font-size: clamp(2.4rem, 5vw, 4.4rem);
  font-weight: 800;
`;

const Microcopy = styled.p`
  margin: 0;
  max-width: 20rem;
  font-size: 0.95rem;
  color: rgba(247, 240, 227, 0.8);
  line-height: 1.5;
`;

const Flow = styled.div`
  position: relative;
  display: grid;
  gap: 1rem;
  padding: 1rem;
  border-radius: 2rem;
  border: 1px solid rgba(243, 210, 122, 0.12);
  background:
    linear-gradient(180deg, rgba(255, 248, 236, 0.04), rgba(255, 248, 236, 0.02)),
    radial-gradient(circle at top right, rgba(231, 35, 64, 0.14), transparent 28%);
  overflow: hidden;

  &::before {
    content: "";
    position: absolute;
    inset: 0 auto 0 0;
    width: 30%;
    background: linear-gradient(90deg, rgba(243, 210, 122, 0), rgba(243, 210, 122, 0.16), rgba(243, 210, 122, 0));
    filter: blur(8px);
    animation: ${scan} 5.5s linear infinite;
    pointer-events: none;
  }

  @media (min-width: 900px) {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  @media (prefers-reduced-motion: reduce) {
    &::before {
      animation: none;
    }
  }
`;

const Step = styled.article`
  position: relative;
  display: grid;
  gap: 0.9rem;
  padding: 1.35rem;
  border-radius: 1.6rem;
  border: 1px solid rgba(243, 210, 122, 0.12);
  background:
    radial-gradient(circle at top right, rgba(196, 108, 77, 0.16), transparent 28%),
    rgba(10, 9, 8, 0.74);
  overflow: hidden;

  &::after {
    content: "";
    position: absolute;
    inset: auto 1.35rem 0.95rem 1.35rem;
    height: 1px;
    background: linear-gradient(90deg, rgba(243, 210, 122, 0.2), rgba(243, 210, 122, 0), rgba(243, 210, 122, 0.2));
  }
`;

const Number = styled.span`
  display: inline-flex;
  width: 2.6rem;
  height: 2.6rem;
  align-items: center;
  justify-content: center;
  border-radius: 999px;
  border: 1px solid rgba(243, 210, 122, 0.16);
  color: var(--color-accent);
  font-size: 0.85rem;
  letter-spacing: 0.12em;
  text-transform: uppercase;
`;

const SignalRow = styled.div`
  display: flex;
  align-items: center;
  gap: 0.55rem;
`;

const SignalDot = styled.span`
  width: 0.55rem;
  height: 0.55rem;
  border-radius: 999px;
  background: #f3d27a;
  box-shadow: 0 0 0 0.35rem rgba(243, 210, 122, 0.12);
  animation: ${pulse} 1.8s ease-in-out infinite;

  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
`;

const SignalLabel = styled.span`
  color: rgba(247, 240, 227, 0.68);
  font-size: 0.72rem;
  letter-spacing: 0.12em;
  text-transform: uppercase;
`;

const StepTitle = styled.h3`
  margin: 0;
  font-size: 1.65rem;
`;

const StepText = styled.p`
  margin: 0;
  line-height: 1.6;
`;

const FooterNote = styled.p`
  margin: 0;
  color: rgba(247, 240, 227, 0.68);
  font-size: 0.85rem;
  letter-spacing: 0.1em;
  text-transform: uppercase;
`;

const bookingTimelineContent = {
  en: {
    titlePrefix: "How Pack gets you ",
    titleAccent: "there",
    microcopy:
      "We gather the inputs, build the trip, and hand you something ready to review.",
    footerNote: "Provider pricing before booking.",
    steps: [
      {
        number: "01",
        title: "Collect",
        text: "Pack pulls in confirmations, calendar timing, and traveler preferences automatically.",
        status: "Inputs live",
      },
      {
        number: "02",
        title: "Compose",
        text: "Flights, hotels, and loyalty context turn into one trip draft instead of a pile of tabs.",
        status: "Routes syncing",
      },
      {
        number: "03",
        title: "Approve",
        text: "You review one finished option with the pricing and timing already lined up.",
        status: "Ready to send",
      },
    ],
  },
  es: {
    titlePrefix: "Cómo Pack te lleva ",
    titleAccent: "allí",
    microcopy:
      "Reunimos las señales, armamos el viaje y te entregamos algo listo para revisar.",
    footerNote: "Precios del proveedor antes de reservar.",
    steps: [
      {
        number: "01",
        title: "Reunir",
        text: "Pack incorpora confirmaciones, horarios del calendario y preferencias del viajero automáticamente.",
        status: "Señales activas",
      },
      {
        number: "02",
        title: "Componer",
        text: "Vuelos, hoteles y contexto de lealtad se convierten en un solo borrador de viaje en vez de una pila de pestañas.",
        status: "Rutas sincronizando",
      },
      {
        number: "03",
        title: "Aprobar",
        text: "Revisas una opción terminada con el precio y el horario ya alineados.",
        status: "Listo para enviar",
      },
    ],
  },
} as const;

const BookingTimelineHighlightComponent: React.FC = () => {
  const { locale } = useI18n();
  const localizedContent = bookingTimelineContent[locale];

  return (
    <Section id="booking-preview">
      <Header>
        <Title>
          {localizedContent.titlePrefix}
          <AccentWord>{localizedContent.titleAccent}</AccentWord>
        </Title>
        <Microcopy>{localizedContent.microcopy}</Microcopy>
      </Header>

      <Flow>
        {localizedContent.steps.map((step) => (
          <Step key={step.number}>
            <SignalRow>
              <SignalDot />
              <SignalLabel>{step.status}</SignalLabel>
            </SignalRow>
            <Number>{step.number}</Number>
            <StepTitle>{step.title}</StepTitle>
            <StepText>{step.text}</StepText>
          </Step>
        ))}
      </Flow>

      <FooterNote>{localizedContent.footerNote}</FooterNote>
    </Section>
  );
};

export const BookingTimelineHighlight = React.memo(BookingTimelineHighlightComponent);

export default BookingTimelineHighlight;
