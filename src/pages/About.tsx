import styled from "styled-components";
import PageSeo, {
  TEAM_MEMBER_PROFILES,
  createPersonSchema,
} from "@/seo/pageSeo";
import { useI18n } from "@/i18n/I18nProvider";

const Container = styled.div`
  max-width: 860px;
  margin: 0 auto;
  padding: 2rem 1.25rem;
  line-height: 1.7;

  h1 {
    font-size: 2rem;
    margin-bottom: 0.75rem;
  }

  h2 {
    font-size: 1.25rem;
    margin-top: 1.75rem;
    margin-bottom: 0.45rem;
  }

  p {
    color: var(--color-text-secondary);
    margin-bottom: 0.75rem;
  }

  a {
    color: var(--color-accent);
  }
`;

const TeamGrid = styled.div`
  display: grid;
  gap: 1.5rem;
  margin-top: 1.25rem;
`;

const TeamCard = styled.section`
  border-radius: 1.35rem;
  border: 1px solid rgba(243, 210, 122, 0.14);
  background: rgba(255, 248, 236, 0.04);
  padding: 1.2rem;
`;

const Role = styled.p`
  margin: 0 0 0.6rem;
  color: rgba(243, 210, 122, 0.82);
  font-size: 0.8rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
`;

const AboutPage = () => {
  const { locale } = useI18n();
  const localizedContent =
    locale === "es"
      ? {
          title: "Acerca de Pack",
          intro:
            "Pack es una empresa de producto enfocada en usar IA para convertir correos, calendarios y contexto de viaje en planes organizados y accionables.",
          teamTitle: "Equipo",
          companyBody:
            "Construimos Pack para reducir el trabajo manual alrededor de la planificación, la reserva y la coordinación de viajes. El objetivo es que un viajero pueda entender y actuar sobre su viaje completo sin rearmarlo desde cero cada vez.",
          matthewBody:
            "Matthew Glein cofundó Pack después de trabajar en producto en Ring. En Pack ayuda a convertir flujos de viaje complejos en una experiencia más clara y operable.",
        }
      : {
          title: "About Pack",
          intro:
            "Pack is a product company focused on using AI to turn emails, calendars, and travel context into organized, actionable trip plans.",
          teamTitle: "Team",
          companyBody:
            "We built Pack to reduce the manual work around travel planning, booking, and coordination. The goal is for a traveler to understand and act on the full trip without rebuilding context from scratch every time.",
          matthewBody:
            "Matthew Glein co-founded Pack after working in product at Ring. At Pack he helps turn complex travel workflows into a clearer, more operational product experience.",
        };

  const noah = TEAM_MEMBER_PROFILES[0];
  const matthew = TEAM_MEMBER_PROFILES[1];

  return (
    <Container>
      <PageSeo
        title="About Pack | Founders, product direction, and company background"
        description="Learn about Pack, the people building it, and the product direction behind Pack's AI-native travel workflows."
        path="/about"
        schema={TEAM_MEMBER_PROFILES.map((member) => createPersonSchema(member))}
      />
      <h1>{localizedContent.title}</h1>
      <p>{localizedContent.intro}</p>
      <p>{localizedContent.companyBody}</p>

      <h2>{localizedContent.teamTitle}</h2>
      <TeamGrid>
        <TeamCard>
          <Role>{noah.jobTitle}</Role>
          <h2>{noah.name}</h2>
          <p>{noah.description}</p>
          <p>
            <a href={noah.sameAs[0]} target="_blank" rel="noopener noreferrer">
              LinkedIn
            </a>
          </p>
        </TeamCard>

        <TeamCard>
          <Role>{matthew.jobTitle}</Role>
          <h2>{matthew.name}</h2>
          <p>{localizedContent.matthewBody}</p>
          <p>
            <a href={matthew.sameAs[0]} target="_blank" rel="noopener noreferrer">
              LinkedIn
            </a>
          </p>
        </TeamCard>
      </TeamGrid>
    </Container>
  );
};

export default AboutPage;
