import React from "react";
import styled from "styled-components";
import { Briefcase, Sparkles, Users } from "lucide-react";

const Section = styled.section`
  display: grid;
  gap: 2rem;
`;

const Header = styled.div`
  display: grid;
  gap: 0.75rem;
  max-width: 44rem;
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
  font-size: clamp(2.5rem, 5vw, 4.2rem);
`;

const Copy = styled.p`
  margin: 0;
  font-size: 1rem;
  line-height: 1.7;
`;

const Grid = styled.div`
  display: grid;
  gap: 1rem;

  @media (min-width: 900px) {
    grid-template-columns: 1.1fr 1fr 1fr;
  }
`;

const Card = styled.article`
  position: relative;
  display: grid;
  gap: 1rem;
  min-height: 20rem;
  padding: 1.5rem;
  border-radius: 1.8rem;
  border: 1px solid rgba(243, 210, 122, 0.12);
  background:
    radial-gradient(circle at top right, rgba(196, 108, 77, 0.16), transparent 28%),
    linear-gradient(180deg, rgba(255, 248, 236, 0.08), rgba(255, 248, 236, 0.02));
  overflow: hidden;

  &:first-child {
    @media (min-width: 900px) {
      min-height: 22rem;
    }
  }
`;

const IconWrap = styled.div`
  width: 3rem;
  height: 3rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 1rem;
  background: rgba(243, 210, 122, 0.1);
  color: var(--color-accent);
`;

const CardTitle = styled.h3`
  margin: 0;
  font-size: 2rem;
  line-height: 0.95;
`;

const CardCopy = styled.p`
  margin: 0;
  line-height: 1.7;
`;

const Highlight = styled.span`
  margin-top: auto;
  display: inline-flex;
  align-items: center;
  align-self: start;
  padding: 0.55rem 0.8rem;
  border-radius: 999px;
  background: rgba(255, 248, 236, 0.06);
  border: 1px solid rgba(243, 210, 122, 0.12);
  color: var(--color-text-primary);
  font-size: 0.8rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
`;

const personas = [
  {
    icon: <Briefcase size={22} />,
    title: "Leaders with no travel admin time",
    copy: "Founders, chiefs of staff, and executive operators use Pack to collapse a messy approval chain into one finished recommendation.",
    highlight: "Approve once, move on",
  },
  {
    icon: <Users size={22} />,
    title: "Families and groups with real preferences",
    copy: "Seat choices, room setups, loyalty programs, and special handling stay attached to every itinerary instead of getting re-explained every trip.",
    highlight: "Preferences kept intact",
  },
  {
    icon: <Sparkles size={22} />,
    title: "Travel teams running high-touch service",
    copy: "Concierges and travel managers get a system that can keep pace with premium expectations without drowning in inbox cleanup.",
    highlight: "High-touch at scale",
  },
];

const PersonaShowcaseComponent: React.FC = () => (
  <Section>
    <Header>
      <Eyebrow>Who it fits</Eyebrow>
      <Title>Designed for people who move fast and travel often.</Title>
      <Copy>
        The product is not trying to be generic trip software. It is built for travelers and teams who
        expect everything to feel organized before they have time to ask for it.
      </Copy>
    </Header>

    <Grid>
      {personas.map((persona) => (
        <Card key={persona.title}>
          <IconWrap>{persona.icon}</IconWrap>
          <CardTitle>{persona.title}</CardTitle>
          <CardCopy>{persona.copy}</CardCopy>
          <Highlight>{persona.highlight}</Highlight>
        </Card>
      ))}
    </Grid>
  </Section>
);

export const PersonaShowcase = React.memo(PersonaShowcaseComponent);

export default PersonaShowcase;
