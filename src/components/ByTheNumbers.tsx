import React from "react";
import styled from "styled-components";

const Section = styled.section`
  display: grid;
  gap: 2rem;
`;

const Intro = styled.div`
  display: grid;
  gap: 0.75rem;
  max-width: 42rem;
`;

const Eyebrow = styled.p`
  margin: 0;
  color: var(--color-accent);
  font-size: 0.78rem;
  letter-spacing: 0.16em;
  text-transform: uppercase;
`;

const Title = styled.h2`
  margin: 0;
  font-size: clamp(2.6rem, 5vw, 4.5rem);
  line-height: 0.95;
`;

const Copy = styled.p`
  margin: 0;
  max-width: 36rem;
  font-size: 1rem;
  line-height: 1.7;
`;

const Grid = styled.div`
  display: grid;
  gap: 1rem;

  @media (min-width: 768px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
`;

const Card = styled.article`
  display: grid;
  gap: 1rem;
  min-height: 16rem;
  padding: 1.5rem;
  border-radius: 1.6rem;
  border: 1px solid rgba(243, 210, 122, 0.12);
  background: linear-gradient(180deg, rgba(255, 248, 236, 0.08), rgba(255, 248, 236, 0.03));
  box-shadow: var(--shadow-soft);
`;

const Stat = styled.p`
  margin: 0;
  color: var(--color-text-primary);
  font-size: clamp(2rem, 4vw, 3rem);
  line-height: 1;
  letter-spacing: -0.04em;
  font-family: var(--font-heading);
`;

const Description = styled.p`
  margin: 0;
  color: var(--color-text-secondary);
  line-height: 1.65;
`;

const SourceLink = styled.a`
  margin-top: auto;
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

interface StatItem {
  readonly value: string;
  readonly description: React.ReactNode;
  readonly sourceLabel: string;
  readonly sourceUrl: string;
}

const stats: readonly StatItem[] = [
  {
    value: "29 hours lost",
    description: "Traditional planning workflows consume an average of 29 hours per trip before anyone even leaves for the airport.",
    sourceLabel: "Expedia Vacation Deprivation Report 2023",
    sourceUrl: "https://viewfinder.expedia.com/news/expedia-vacation-deprivation-report-2023/",
  },
  {
    value: "59% airfare spike",
    description: "Booking inside the final few days can push fares up to 59% versus better-timed purchase windows.",
    sourceLabel: "CheapAir 2024 Airfare Study",
    sourceUrl: "https://www.cheapair.com/blog/the-best-time-to-buy-flights/",
  },
  {
    value: "30% hotel premium",
    description: "Week-of hotel bookings can cost 20 to 30 percent more once flexible inventory tightens.",
    sourceLabel: "Travel + Leisure Hotel Timing Study",
    sourceUrl: "https://www.travelandleisure.com/best-time-to-book-hotels-7107450",
  },
  {
    value: "27% rebooking tax",
    description: "Disruption-driven rebooking frequently raises flight, hotel, and ground costs by up to 27%.",
    sourceLabel: "TravelPerk Disruption Survey 2025",
    sourceUrl: "https://www.travelperk.com/blog/business-travel-chaos-survey/",
  },
];

const ByTheNumbers: React.FC = () => (
  <Section aria-labelledby="by-the-numbers-title">
    <Intro>
      <Eyebrow>Why automate it</Eyebrow>
      <Title id="by-the-numbers-title">Manual travel planning gets expensive fast.</Title>
      <Copy>
        Pack is built for the ugly middle of travel operations: late bookings, fragmented confirmations,
        and rebooking chaos that compounds every time someone says, &quot;I&apos;ll handle it later.&quot;
      </Copy>
    </Intro>

    <Grid>
      {stats.map((item) => (
        <Card key={item.sourceUrl}>
          <Stat>{item.value}</Stat>
          <Description>{item.description}</Description>
          <SourceLink href={item.sourceUrl} target="_blank" rel="noopener noreferrer">
            {item.sourceLabel}
          </SourceLink>
        </Card>
      ))}
    </Grid>
  </Section>
);

export default ByTheNumbers;
