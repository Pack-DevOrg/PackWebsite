import React from "react";
import styled from "styled-components";
import { ArrowRight, CheckCircle, GitCompare, Search } from "lucide-react";
import PrefetchLink from "@/components/PrefetchLink";
import PageSeo, { buildAbsoluteUrl } from "@/seo/pageSeo";
import {
  isSeoGuideSlug,
  seoGuideDefinitionMap,
  type SeoGuideDefinition,
  type SeoGuideFaq,
} from "@/content/seoGuides";

const Page = styled.main`
  width: min(100%, 1120px);
  margin: 0 auto;
  padding: var(--space-4) var(--space-3) var(--space-6);

  @media (min-width: 768px) {
    padding: var(--space-5) var(--space-4) var(--space-7);
  }
`;

const Header = styled.header`
  display: grid;
  gap: var(--space-3);
  margin-bottom: var(--space-5);
`;

const Eyebrow = styled.p`
  margin: 0;
  color: var(--color-accent);
  font-size: var(--font-size-small);
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
`;

const Title = styled.h1`
  max-width: 920px;
  margin: 0;
  color: var(--color-text-primary);
  font-size: var(--font-size-3xl);
  line-height: 1.08;

  @media (min-width: 768px) {
    font-size: var(--font-size-4xl);
  }
`;

const Intro = styled.p`
  max-width: 860px;
  margin: 0;
  color: var(--color-text-secondary);
  font-size: var(--font-size-large);
  line-height: 1.7;
`;

const PillList = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
`;

const Pill = styled.span`
  border: 1px solid rgba(243, 210, 122, 0.16);
  border-radius: 999px;
  background: rgba(255, 248, 236, 0.045);
  color: var(--color-text-secondary);
  padding: 0.55rem 0.8rem;
  font-size: var(--font-size-small);
  line-height: 1.3;
`;

const Panel = styled.section`
  display: grid;
  gap: var(--space-3);
  margin-bottom: var(--space-5);
  border: 1px solid rgba(243, 210, 122, 0.14);
  border-radius: var(--border-radius);
  background: rgba(255, 248, 236, 0.04);
  padding: var(--space-4);
`;

const PanelHeader = styled.div`
  display: flex;
  gap: var(--space-2);
  align-items: center;

  svg {
    width: 22px;
    height: 22px;
    color: var(--color-accent);
    flex-shrink: 0;
  }

  h2 {
    margin: 0;
    color: var(--color-text-primary);
    font-size: var(--font-size-xl);
  }
`;

const BodyText = styled.p`
  margin: 0;
  color: var(--color-text-secondary);
  line-height: 1.7;
`;

const TopActions = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
  align-items: center;
`;

const CardGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--space-3);
  margin-bottom: var(--space-5);

  @media (min-width: 900px) {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
`;

const Card = styled.article`
  display: grid;
  gap: var(--space-2);
  align-content: start;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: var(--border-radius);
  background: rgba(255, 255, 255, 0.035);
  padding: var(--space-4);

  h2,
  h3 {
    margin: 0;
    color: var(--color-text-primary);
    font-size: var(--font-size-large);
  }

  p {
    margin: 0;
    color: var(--color-text-secondary);
    line-height: 1.65;
  }
`;

const SystemMap = styled.section`
  display: grid;
  gap: var(--space-4);
  margin-bottom: var(--space-5);
  border: 1px solid rgba(243, 210, 122, 0.14);
  border-radius: var(--border-radius);
  background:
    linear-gradient(135deg, rgba(243, 210, 122, 0.08), transparent 42%),
    rgba(255, 255, 255, 0.03);
  padding: var(--space-4);
`;

const VennWrap = styled.div`
  display: grid;
  gap: var(--space-3);

  @media (min-width: 860px) {
    grid-template-columns: minmax(22rem, 0.95fr) minmax(0, 1fr);
    align-items: center;
  }
`;

const VennDiagram = styled.div`
  position: relative;
  min-height: 21rem;
  isolation: isolate;

  @media (max-width: 520px) {
    min-height: 18rem;
  }
`;

const VennCircle = styled.div<{
  readonly $left: string;
  readonly $top: string;
  readonly $color: string;
}>`
  position: absolute;
  left: ${(props) => props.$left};
  top: ${(props) => props.$top};
  display: grid;
  place-items: center;
  width: min(46vw, 12.5rem);
  aspect-ratio: 1;
  border: 1px solid ${(props) => props.$color};
  border-radius: 50%;
  background: color-mix(in srgb, ${(props) => props.$color} 20%, transparent);
  color: var(--color-text-primary);
  font-size: var(--font-size-small);
  font-weight: 800;
  line-height: 1.25;
  padding: var(--space-3);
  text-align: center;
  transform: translate(-50%, -50%);
  z-index: 1;
`;

const VennCenter = styled.div`
  position: absolute;
  left: 50%;
  top: 50%;
  display: grid;
  place-items: center;
  width: min(38vw, 9.5rem);
  aspect-ratio: 1;
  border: 1px solid rgba(243, 210, 122, 0.42);
  border-radius: 50%;
  background: rgba(12, 12, 16, 0.86);
  box-shadow: 0 0 34px rgba(243, 210, 122, 0.14);
  color: var(--color-accent);
  font-size: var(--font-size-medium);
  font-weight: 900;
  line-height: 1.2;
  padding: var(--space-2);
  text-align: center;
  transform: translate(-50%, -50%);
  z-index: 2;
`;

const SystemMapHeader = styled.div`
  display: grid;
  gap: var(--space-1);

  h2 {
    margin: 0;
    color: var(--color-text-primary);
    font-size: var(--font-size-2xl);
  }

  p {
    max-width: 760px;
    margin: 0;
    color: var(--color-text-secondary);
    line-height: 1.6;
  }
`;

const SystemNodes = styled.div`
  display: grid;
  gap: var(--space-3);

  @media (min-width: 820px) {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
`;

const SystemNode = styled.article`
  display: grid;
  gap: var(--space-2);
  min-height: 100%;
  border: 1px solid rgba(255, 255, 255, 0.09);
  border-radius: var(--border-radius);
  background: rgba(0, 0, 0, 0.18);
  padding: var(--space-3);

  span {
    width: fit-content;
    border: 1px solid rgba(243, 210, 122, 0.18);
    border-radius: 999px;
    color: var(--color-accent);
    padding: 0.35rem 0.65rem;
    font-size: var(--font-size-small);
    font-weight: 700;
  }

  p {
    margin: 0;
    color: var(--color-text-secondary);
    line-height: 1.55;
  }
`;

const BulletList = styled.ul`
  display: grid;
  gap: var(--space-2);
  margin: var(--space-1) 0 0;
  padding: 0;
  list-style: none;
`;

const BulletItem = styled.li`
  display: flex;
  gap: var(--space-2);
  color: var(--color-text-secondary);
  font-size: var(--font-size-small);
  line-height: 1.6;

  svg {
    width: 16px;
    height: 16px;
    flex-shrink: 0;
    margin-top: 0.15rem;
    color: var(--color-accent);
  }
`;

const Section = styled.section`
  display: grid;
  gap: var(--space-3);
  margin-bottom: var(--space-5);
`;

const SectionTitle = styled.h2`
  margin: 0;
  color: var(--color-text-primary);
  font-size: var(--font-size-2xl);
`;

const BoundaryTable = styled.div`
  display: grid;
  gap: var(--space-2);
`;

const BoundaryRow = styled.article`
  display: grid;
  gap: var(--space-2);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: var(--border-radius);
  background: rgba(255, 255, 255, 0.03);
  padding: var(--space-3);

  @media (min-width: 860px) {
    grid-template-columns: minmax(0, 0.95fr) minmax(0, 1.25fr);
    align-items: stretch;
  }
`;

const BoundaryCell = styled.div`
  display: grid;
  gap: var(--space-1);
  align-content: start;

  h3 {
    margin: 0;
    color: var(--color-text-primary);
    font-size: var(--font-size-medium);
  }

  p {
    margin: 0;
    color: var(--color-text-secondary);
    line-height: 1.55;
  }
`;

const BoundaryLabel = styled.span`
  width: fit-content;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.06);
  color: var(--color-text-secondary);
  padding: 0.3rem 0.55rem;
  font-size: var(--font-size-small);
  font-weight: 700;
`;

const FaqGrid = styled.div`
  display: grid;
  gap: var(--space-3);
`;

const FaqItem = styled.article`
  display: grid;
  gap: var(--space-1);
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  padding-top: var(--space-3);

  h3 {
    margin: 0;
    color: var(--color-text-primary);
    font-size: var(--font-size-medium);
  }

  p {
    margin: 0;
    color: var(--color-text-secondary);
    line-height: 1.7;
  }
`;

const LinkList = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
`;

const RelatedLink = styled(PrefetchLink)`
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 999px;
  color: var(--color-text-primary);
  text-decoration: none;
  padding: 0.65rem 0.9rem;
  font-weight: 700;

  svg {
    width: 16px;
    height: 16px;
  }

  &:hover,
  &:focus-visible {
    border-color: rgba(243, 210, 122, 0.35);
    color: var(--color-accent);
  }
`;

const MAX_VISIBLE_TOPICS = 4;
const MAX_SYSTEM_NODES = 3;
const MAX_FEATURE_SECTIONS = 2;
const MAX_POINTS_PER_SECTION = 2;
const MAX_BOUNDARY_ROWS = 3;
const MAX_VISIBLE_FAQS = 3;

function createFaqSchema(faqs: readonly SeoGuideFaq[]): Record<string, unknown> {
  return {
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };
}

function createGuideSchema(guide: SeoGuideDefinition): Record<string, unknown> {
  return {
    "@type": "Article",
    headline: guide.title,
    description: guide.description,
    url: buildAbsoluteUrl(`/guides/${guide.slug}`),
    author: {
      "@type": "Organization",
      name: "Pack",
    },
    publisher: {
      "@type": "Organization",
      name: "Pack",
      url: "https://www.trypackai.com",
    },
    mainEntityOfPage: buildAbsoluteUrl(`/guides/${guide.slug}`),
    keywords: guide.primaryKeywords.join(", "),
  };
}

const SeoGuidePage: React.FC<{ readonly slug?: string }> = ({ slug }) => {
  if (!isSeoGuideSlug(slug)) {
    return null;
  }

  const guide = seoGuideDefinitionMap[slug];
  const path = `/guides/${guide.slug}`;
  const primaryFeatureLink = guide.relatedLinks[0];
  const visibleFaqs = guide.faqs.slice(0, MAX_VISIBLE_FAQS);
  const systemNodes = guide.proofPoints.slice(0, MAX_SYSTEM_NODES);
  const featureSections = guide.sections.slice(0, MAX_FEATURE_SECTIONS);
  const boundaryRows = [
    ...guide.comparisons,
    ...guide.sections.slice(MAX_FEATURE_SECTIONS),
  ].slice(0, MAX_BOUNDARY_ROWS);

  return (
    <Page>
      <PageSeo
        title={`${guide.title} | Pack`}
        description={guide.description}
        path={path}
        schema={[createGuideSchema(guide), createFaqSchema(visibleFaqs)]}
      />
      <Header>
        <Eyebrow>{guide.eyebrow}</Eyebrow>
        <Title>{guide.title}</Title>
        <Intro>{guide.intro}</Intro>
        <PillList aria-label="Primary guide topics">
          {guide.primaryKeywords.slice(0, MAX_VISIBLE_TOPICS).map((keyword) => (
            <Pill key={keyword}>{keyword}</Pill>
          ))}
        </PillList>
        <TopActions aria-label="Related Pack features">
          {primaryFeatureLink ? (
            <RelatedLink to={primaryFeatureLink.href}>
              Open {primaryFeatureLink.label}
              <ArrowRight aria-hidden="true" />
            </RelatedLink>
          ) : null}
          <RelatedLink to="/features">
            See all features
            <ArrowRight aria-hidden="true" />
          </RelatedLink>
        </TopActions>
      </Header>

      <SystemMap>
        <VennWrap>
          <VennDiagram aria-label="Pack combines planning, organization, context, and travel day tools">
            <VennCircle $left="50%" $top="27%" $color="rgba(243, 210, 122, 0.46)">
              AI planning
            </VennCircle>
            <VennCircle $left="31%" $top="58%" $color="rgba(249, 47, 96, 0.42)">
              Itinerary organization
            </VennCircle>
            <VennCircle $left="69%" $top="58%" $color="rgba(88, 166, 255, 0.42)">
              Real trip context
            </VennCircle>
            <VennCenter>Pack</VennCenter>
          </VennDiagram>
          <div>
            <SystemMapHeader>
              <h2>The overlap is the product</h2>
              <p>
                Pack is strongest when a trip needs more than one tool. The
                product keeps planning, organization, booking context, traveler
                context, and travel-day details in the same conversation.
              </p>
            </SystemMapHeader>
            <SystemNodes>
              {systemNodes.map((point, index) => (
                <SystemNode key={point}>
                  <span>Layer {index + 1}</span>
                  <p>{point}</p>
                </SystemNode>
              ))}
            </SystemNodes>
          </div>
        </VennWrap>
      </SystemMap>

      <CardGrid>
        {featureSections.map((section) => (
          <Card key={section.title}>
            <h2>{section.title}</h2>
            <p>{section.body}</p>
            <BulletList>
              {section.points.slice(0, MAX_POINTS_PER_SECTION).map((point) => (
                <BulletItem key={point}>
                  <CheckCircle aria-hidden="true" />
                  <span>{point}</span>
                </BulletItem>
              ))}
            </BulletList>
          </Card>
        ))}
      </CardGrid>

      <Section>
        <SectionTitle>Where other tools usually stop</SectionTitle>
        <BodyText>{guide.competitorFrame}</BodyText>
        <BoundaryTable>
          {boundaryRows.map((comparison) => (
            <BoundaryRow key={comparison.title}>
              <BoundaryCell>
                <BoundaryLabel>
                  <GitCompare aria-hidden="true" /> Comparison
                </BoundaryLabel>
                <h3>{comparison.title}</h3>
                <p>{comparison.body}</p>
              </BoundaryCell>
              <BoundaryCell>
                <BoundaryLabel>What Pack wraps around it</BoundaryLabel>
                <BulletList>
                  {comparison.points.slice(0, MAX_POINTS_PER_SECTION).map((point) => (
                    <BulletItem key={point}>
                      <CheckCircle aria-hidden="true" />
                      <span>{point}</span>
                    </BulletItem>
                  ))}
                </BulletList>
              </BoundaryCell>
            </BoundaryRow>
          ))}
        </BoundaryTable>
      </Section>

      <Panel>
        <PanelHeader>
          <Search aria-hidden="true" />
          <h2>Common questions</h2>
        </PanelHeader>
        <FaqGrid>
          {visibleFaqs.map((faq) => (
            <FaqItem key={faq.question}>
              <h3>{faq.question}</h3>
              <p>{faq.answer}</p>
            </FaqItem>
          ))}
        </FaqGrid>
      </Panel>

      <Section>
        <SectionTitle>Related Pack capabilities</SectionTitle>
        <LinkList>
          {guide.relatedLinks.map((link) => (
            <RelatedLink key={link.href} to={link.href}>
              {link.label}
              <ArrowRight aria-hidden="true" />
            </RelatedLink>
          ))}
        </LinkList>
      </Section>
    </Page>
  );
};

export default SeoGuidePage;
