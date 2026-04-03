import styled, { keyframes } from "styled-components";
import { useI18n } from "@/i18n/I18nProvider";
import AccentWord from "./AccentWord";

const glow = keyframes`
  0%, 100% {
    opacity: 0.5;
    transform: scale(1);
  }
  50% {
    opacity: 1;
    transform: scale(1.15);
  }
`;

const Section = styled.section`
  display: grid;
  gap: 1.25rem;
  padding: 1.5rem;
  border-radius: 1.8rem;
  border: 1px solid rgba(243, 210, 122, 0.12);
  background:
    radial-gradient(circle at top left, rgba(231, 35, 64, 0.12), transparent 24%),
    linear-gradient(180deg, rgba(255, 248, 236, 0.05), rgba(255, 248, 236, 0.03));
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
  font-size: clamp(2rem, 4vw, 3.2rem);
  font-weight: 800;
`;

const CasaLink = styled.a`
  color: var(--color-accent);
  font-size: 0.82rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;

  &:hover,
  &:focus-visible {
    opacity: 1;
    text-decoration: underline;
  }
`;

const Metrics = styled.div`
  display: grid;
  gap: 0.75rem;

  @media (min-width: 760px) {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
`;

const Metric = styled.span`
  display: grid;
  gap: 0.4rem;
  padding: 0.95rem 1rem;
  border-radius: 1.15rem;
  border: 1px solid rgba(243, 210, 122, 0.14);
  background: rgba(10, 9, 8, 0.46);
  color: var(--color-text-primary);
  font-size: 0.78rem;
  letter-spacing: 0.1em;
  text-transform: uppercase;
`;

const MetricTop = styled.span`
  display: flex;
  align-items: center;
  gap: 0.55rem;
`;

const MetricPulse = styled.span`
  width: 0.5rem;
  height: 0.5rem;
  border-radius: 999px;
  background: #65b89f;
  box-shadow: 0 0 0 0.35rem rgba(101, 184, 159, 0.12);
  animation: ${glow} 1.9s ease-in-out infinite;

  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
`;

const MetricValue = styled.span`
  color: rgba(247, 240, 227, 0.96);
  font-size: 1.25rem;
  letter-spacing: -0.03em;
  text-transform: none;
`;

const Copy = styled.p`
  margin: 0;
  max-width: 32rem;
  color: rgba(247, 240, 227, 0.82);
  line-height: 1.55;
`;

const trustBannerContent = {
  en: {
    titlePrefix: "Travel data, handled ",
    accent: "discreetly",
    casaLabel: "View CASA Tier 2",
    metrics: [
      { label: "Profiles", value: "Encrypted" },
      { label: "Context", value: "Protected" },
      { label: "Review", value: "CASA Tier 2" },
    ],
    copy:
      "Email, calendar, and booking details stay encrypted, protected, and independently reviewed.",
  },
  es: {
    titlePrefix: "Datos de viaje tratados con ",
    accent: "discreción",
    casaLabel: "Ver CASA Tier 2",
    metrics: [
      { label: "Perfiles", value: "Cifrados" },
      { label: "Contexto", value: "Protegido" },
      { label: "Revisión", value: "CASA Tier 2" },
    ],
    copy:
      "Los detalles de correo, calendario y reservas permanecen cifrados, protegidos y revisados de forma independiente.",
  },
} as const;

const TrustBanner = () => {
  const { locale } = useI18n();
  const content = trustBannerContent[locale] ?? trustBannerContent.en;

  return (
    <Section>
      <Header>
        <Title>{content.titlePrefix}<AccentWord>{content.accent}</AccentWord>.</Title>
        <CasaLink
          href="https://support.google.com/cloud/answer/13465431?hl=en"
          target="_blank"
          rel="noopener noreferrer"
        >
          {content.casaLabel}
        </CasaLink>
      </Header>
      <Metrics>
        {content.metrics.map((metric) => (
          <Metric key={metric.label}>
            <MetricTop>
              <MetricPulse />
              <span>{metric.label}</span>
            </MetricTop>
            <MetricValue>{metric.value}</MetricValue>
          </Metric>
        ))}
      </Metrics>
      <Copy>{content.copy}</Copy>
    </Section>
  );
};

export default TrustBanner;
