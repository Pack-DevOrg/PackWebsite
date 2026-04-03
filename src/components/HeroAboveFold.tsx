import React, { ReactNode } from "react";
import styled, { keyframes } from "styled-components";
import { useI18n } from "@/i18n/I18nProvider";

const marquee = keyframes`
  from {
    transform: translateX(-33.333%);
  }
  to {
    transform: translateX(-66.666%);
  }
`;

const marqueeReverse = keyframes`
  from {
    transform: translateX(-66.666%);
  }
  to {
    transform: translateX(-33.333%);
  }
`;

const heroAboveFoldContent = {
  en: {
    featureMarqueeItems: [
      "Flight departure",
      "Hotel check-in",
      "Live actions",
      "Rebooking",
      "Approval queue",
      "Calendar aware",
      "Protected arrival",
      "Group trip planning",
    ],
    promptMarqueeItems: [
      "Book Japan",
      "Barcelona in May",
      "Jazz festival",
      "Birthday weekend",
      "Wedding weekend",
      "Beach escape",
      "National parks",
      "Team offsite",
    ],
    mobileHighlightItems: [
      "Flight + hotel",
      "Live actions",
      "Calendar aware",
      "Protected arrival",
    ],
    railPrefix: "We plan, you",
    railAccent: "pack.",
    headlineLine1: "Past, present",
    headlineLine2Prefix: "and the ",
    headlineLine2Accent: "future of",
    headlineLine3Accent: "agentic travel",
    supportingCopy:
      "One prompt to get the flights, hotel, and schedule you'd pick yourself.",
  },
  es: {
    featureMarqueeItems: [
      "Salida de vuelo",
      "Check-in del hotel",
      "Acciones en vivo",
      "Reubicación",
      "Cola de aprobación",
      "Con calendario",
      "Llegada protegida",
      "Viaje en grupo",
    ],
    promptMarqueeItems: [
      "Reserva Japón",
      "Barcelona en mayo",
      "Festival de jazz",
      "Fin de semana de cumpleaños",
      "Fin de semana de boda",
      "Escapada de playa",
      "Parques nacionales",
      "Retiro del equipo",
    ],
    mobileHighlightItems: [
      "Vuelo + hotel",
      "Acciones en vivo",
      "Con calendario",
      "Llegada protegida",
    ],
    railPrefix: "Nosotros planeamos, tú",
    railAccent: "empacas.",
    headlineLine1: "Pasado, presente",
    headlineLine2Prefix: "y el ",
    headlineLine2Accent: "futuro de",
    headlineLine3Accent: "los viajes agentivos",
    supportingCopy:
      "Un solo prompt para llegar al vuelo, hotel y plan que elegirías tú mismo.",
  },
} as const;

const HeroSection = styled.section`
  position: relative;
  overflow: visible;
  padding: 1rem 0 clamp(2.4rem, 5vw, 4rem);

  @media (max-width: 739px) {
    padding: 0.95rem 0 1.4rem;
  }
`;

const Frame = styled.div`
  position: relative;
  isolation: isolate;
  border-radius: 2rem;
  border: 1px solid rgba(243, 210, 122, 0.12);
  background:
    radial-gradient(circle at 0% 0%, rgba(231, 35, 64, 0.16), transparent 28%),
    radial-gradient(circle at 100% 0%, rgba(198, 165, 88, 0.16), transparent 46%),
    linear-gradient(135deg, rgba(15, 11, 8, 0.98) 0%, rgba(19, 15, 11, 0.98) 44%, rgba(25, 20, 14, 0.94) 76%, rgba(22, 17, 11, 0.98) 100%),
    linear-gradient(180deg, rgba(14, 10, 8, 0.98), rgba(8, 7, 6, 1));
  box-shadow: var(--shadow-elevated);
  overflow: hidden;

  @media (max-width: 739px) {
    border-radius: 1.65rem;
    background:
      linear-gradient(135deg, rgba(15, 11, 8, 0.98) 0%, rgba(18, 14, 10, 0.98) 100%),
      linear-gradient(180deg, rgba(14, 10, 8, 0.98), rgba(8, 7, 6, 1));
    box-shadow: 0 14px 32px rgba(0, 0, 0, 0.28);
  }
`;

const CopyScrim = styled.div`
  position: absolute;
  inset: 0;
  background:
    radial-gradient(circle at 50% 0%, rgba(243, 210, 122, 0.1), transparent 42%),
    linear-gradient(180deg, rgba(8, 7, 6, 0.18), rgba(8, 7, 6, 0));
  pointer-events: none;

  @media (max-width: 739px) {
    background: linear-gradient(180deg, rgba(8, 7, 6, 0.08), rgba(8, 7, 6, 0));
  }
`;

const HeroGrid = styled.div`
  position: relative;
  z-index: 1;
  display: grid;
  gap: 1.25rem;
  justify-items: center;
  padding: clamp(1rem, 2.5vw, 1.35rem) clamp(1.2rem, 4vw, 3rem) clamp(2rem, 5vw, 3.25rem);

  @media (max-width: 739px) {
    gap: 1rem;
    padding: 0.95rem 0.95rem 1.25rem;
  }
`;

const CopyColumn = styled.div`
  display: grid;
  gap: 1rem;
  width: min(100%, 48rem);
  justify-items: center;
  text-align: center;
`;

const RailStatement = styled.div`
  display: grid;
  gap: 0.08rem;
  justify-items: center;
  width: min(100%, 46rem);
  min-height: 2.2rem;
  color: rgba(255, 248, 236, 0.98);
  font-size: 1rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
`;

const RailStatementAccent = styled.span`
  display: block;
  background: linear-gradient(135deg, #f3d27a 0%, #ebbe58 62%, #e72340 100%);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  font-size: 1.5em;
  line-height: 0.94;
`;

const MarqueeViewport = styled.div`
  width: 100%;
  overflow: hidden;
  mask-image: linear-gradient(90deg, transparent 0%, black 8%, black 92%, transparent 100%);
  -webkit-mask-image: linear-gradient(90deg, transparent 0%, black 8%, black 92%, transparent 100%);

  @media (max-width: 739px) {
    display: none;
  }
`;

const MarqueeTrack = styled.div<{ $reverse?: boolean }>`
  display: flex;
  width: max-content;
  animation: ${({ $reverse }) => ($reverse ? marqueeReverse : marquee)} 28s linear infinite;

  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
`;

const MarqueeGroup = styled.div`
  display: flex;
  flex-shrink: 0;
  gap: 0.65rem;
  padding-right: 0.65rem;
`;

const MarqueeItem = styled.span`
  display: inline-flex;
  align-items: center;
  padding: 0.6rem 0.92rem;
  border-radius: 999px;
  border: 1px solid rgba(243, 210, 122, 0.18);
  background: rgba(243, 210, 122, 0.09);
  color: rgba(255, 244, 214, 0.94);
  font-size: 0.66rem;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  white-space: nowrap;

  &::before {
    content: "•";
    margin-right: 0.5rem;
    color: #f3d27a;
  }
`;

const MobileHighlightGrid = styled.div`
  display: none;

  @media (max-width: 739px) {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 0.55rem;
    width: 100%;
  }
`;

const MobileHighlightChip = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.5rem 0.78rem;
  border-radius: 999px;
  border: 1px solid rgba(243, 210, 122, 0.16);
  background: rgba(243, 210, 122, 0.07);
  color: rgba(255, 244, 214, 0.9);
  font-size: 0.63rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  white-space: nowrap;
`;

const Headline = styled.h1`
  margin: 0;
  width: min(100%, 11.75ch);
  font-size: clamp(2.9rem, 7.2vw, 5.6rem);
  line-height: 0.9;
  letter-spacing: -0.055em;
  color: rgba(255, 248, 236, 0.98);
  text-shadow: 0 8px 30px rgba(0, 0, 0, 0.22);

  @media (max-width: 739px) {
    width: min(100%, 9ch);
    font-size: clamp(2.6rem, 12vw, 4rem);
  }
`;

const HeadlineLine = styled.span`
  display: block;
`;

const HeadlineAccent = styled.span`
  color: #f3d27a;
`;

const SupportingCopy = styled.p`
  margin: 0;
  max-width: 34rem;
  color: rgba(247, 240, 227, 0.74);
  font-size: clamp(0.98rem, 1.35vw, 1.1rem);
  line-height: 1.5;
  text-wrap: pretty;
`;

const ActionSlot = styled.div`
  width: min(100%, 40rem);

  @media (max-width: 739px) {
    width: min(100%, 24rem);
  }
`;

interface HeroAboveFoldProps {
  readonly waitlistSlot: ReactNode;
}

const renderMarqueeRow = (items: readonly string[], prefix: string, reverse = false) => (
  <MarqueeViewport>
    <MarqueeTrack $reverse={reverse}>
      {Array.from({ length: 3 }, (_, groupIndex) => (
        <MarqueeGroup key={`${prefix}-${groupIndex}`}>
          {items.map((item) => (
            <MarqueeItem key={`${prefix}-${groupIndex}-${item}`}>{item}</MarqueeItem>
          ))}
        </MarqueeGroup>
      ))}
    </MarqueeTrack>
  </MarqueeViewport>
);

const renderMobileHighlightGrid = (items: readonly string[]) => (
  <MobileHighlightGrid>
    {items.map((item) => (
      <MobileHighlightChip key={item}>{item}</MobileHighlightChip>
    ))}
  </MobileHighlightGrid>
);

const HeroAboveFold: React.FC<HeroAboveFoldProps> = ({ waitlistSlot }) => {
  const { locale } = useI18n();
  const content = heroAboveFoldContent[locale] ?? heroAboveFoldContent.en;

  return (
    <HeroSection>
      <Frame>
        <CopyScrim aria-hidden="true" />
        <HeroGrid>
          <CopyColumn>
            <RailStatement>
              <span>{content.railPrefix}</span>
              <RailStatementAccent>{content.railAccent}</RailStatementAccent>
            </RailStatement>
            {renderMarqueeRow(content.featureMarqueeItems, "feature")}
            {renderMarqueeRow(content.promptMarqueeItems, "prompt", true)}
            {renderMobileHighlightGrid(content.mobileHighlightItems)}
            <Headline>
              <HeadlineLine>{content.headlineLine1}</HeadlineLine>
              <HeadlineLine>
                {content.headlineLine2Prefix}
                <HeadlineAccent>{content.headlineLine2Accent}</HeadlineAccent>
              </HeadlineLine>
              <HeadlineLine>
                <HeadlineAccent>{content.headlineLine3Accent}</HeadlineAccent>
              </HeadlineLine>
            </Headline>
            <SupportingCopy>{content.supportingCopy}</SupportingCopy>
            <ActionSlot>{waitlistSlot}</ActionSlot>
          </CopyColumn>
        </HeroGrid>
      </Frame>
    </HeroSection>
  );
};

export default HeroAboveFold;
