import React from "react";
import styled from "styled-components";
import { ArrowRight, CheckCircle, Search } from "lucide-react";
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
  gap: var(--space-2);
  margin-bottom: var(--space-4);
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
  max-width: 720px;
  margin: 0;
  color: var(--color-text-secondary);
  font-size: var(--font-size-large);
  line-height: 1.55;
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
  gap: var(--space-4);

  @media (min-width: 860px) {
    grid-template-columns: minmax(26rem, 1fr) minmax(0, 0.9fr);
    align-items: center;
  }
`;

const VennDiagram = styled.div`
  position: relative;
  min-height: 23rem;
  isolation: isolate;

  @media (max-width: 520px) {
    min-height: 16rem;
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
  width: min(52vw, 15rem);
  aspect-ratio: 1;
  border: 1.5px solid ${(props) => props.$color};
  border-radius: 50%;
  background: color-mix(in srgb, ${(props) => props.$color} 24%, transparent);
  transform: translate(-50%, -50%);
  z-index: 1;

  @media (max-width: 520px) {
    width: min(42vw, 10.25rem);
  }
`;

const VennLabel = styled.div<{
  readonly $left: string;
  readonly $top: string;
}>`
  position: absolute;
  left: ${(props) => props.$left};
  top: ${(props) => props.$top};
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 999px;
  background: rgba(8, 8, 12, 0.78);
  color: var(--color-text-primary);
  padding: 0.45rem 0.7rem;
  font-size: var(--font-size-small);
  font-weight: 850;
  line-height: 1.1;
  text-align: center;
  transform: translate(-50%, -50%);
  white-space: nowrap;
  z-index: 3;

  @media (max-width: 520px) {
    max-width: 7.4rem;
    padding: 0.4rem 0.55rem;
    font-size: 0.72rem;
    white-space: normal;
  }
`;

const VennCenter = styled.div`
  position: absolute;
  left: 50%;
  top: 50%;
  display: grid;
  place-items: center;
  width: min(38vw, 10.5rem);
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

  @media (max-width: 520px) {
    width: min(32vw, 7.5rem);
  }
`;

const SystemMapHeader = styled.div`
  display: grid;
  gap: var(--space-1);

  h2 {
    margin: 0;
    color: var(--color-text-primary);
    font-size: var(--font-size-xl);
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
  gap: var(--space-2);
  margin-top: var(--space-3);

  @media (min-width: 600px) {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
`;

const SystemNode = styled.article`
  display: grid;
  gap: var(--space-1);
  min-height: 100%;
  border: 1px solid rgba(255, 255, 255, 0.09);
  border-radius: var(--border-radius);
  background: rgba(0, 0, 0, 0.18);
  padding: var(--space-2);

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
    font-size: var(--font-size-small);
    line-height: 1.35;
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
  gap: 1px;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: var(--border-radius);
  background: rgba(255, 255, 255, 0.08);
`;

const BoundaryRow = styled.article`
  display: grid;
  gap: 1px;
  background: rgba(0, 0, 0, 0.16);

  @media (min-width: 760px) {
    grid-template-columns: 0.9fr 1.1fr 1.1fr;
  }
`;

const BoundaryHeaderRow = styled(BoundaryRow)`
  display: none;

  @media (min-width: 760px) {
    display: grid;
  }
`;

const BoundaryHead = styled.div`
  background: rgba(255, 255, 255, 0.045);
  color: var(--color-accent);
  padding: var(--space-3);
  font-size: var(--font-size-small);
  font-weight: 850;
  text-transform: uppercase;
`;

const BoundaryCell = styled.div`
  display: grid;
  gap: 0.35rem;
  align-content: start;
  background: rgba(255, 255, 255, 0.03);
  padding: var(--space-3);
`;

const MobileBoundaryLabel = styled.span`
  color: var(--color-accent);
  font-size: var(--font-size-small);
  font-weight: 850;
  text-transform: uppercase;

  @media (min-width: 760px) {
    display: none;
  }
`;

const BoundaryTitle = styled.h3`
  margin: 0;
  color: var(--color-text-primary);
  font-size: var(--font-size-medium);
`;

const BoundaryText = styled.p`
  display: -webkit-box;
  margin: 0;
  overflow: hidden;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  color: var(--color-text-secondary);
  font-size: var(--font-size-small);
  line-height: 1.45;
`;

const BoundaryPoint = styled.div`
  display: grid;
  grid-template-columns: auto 1fr;
  gap: var(--space-2);
  align-items: start;
  font-size: var(--font-size-small);
  line-height: 1.45;
  color: var(--color-text-secondary);

  svg {
    width: 15px;
    height: 15px;
    margin-top: 0.15rem;
    color: var(--color-accent);
  }
`;

const FaqGrid = styled.div`
  display: grid;
  gap: var(--space-2);
`;

const FaqItem = styled.details`
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  padding-top: var(--space-2);

  summary {
    cursor: pointer;
    list-style: none;
    margin: 0;
    color: var(--color-text-primary);
    font-size: var(--font-size-medium);
    font-weight: 700;
  }

  summary::-webkit-details-marker {
    display: none;
  }

  p {
    margin: var(--space-1) 0 0;
    color: var(--color-text-secondary);
    line-height: 1.55;
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

const MAX_SYSTEM_NODES = 3;
const MAX_POINTS_PER_SECTION = 2;
const MAX_BOUNDARY_ROWS = 3;
const MAX_VISIBLE_FAQS = 3;

function getShortIntro(intro: string): string {
  const [firstSentence] = intro.split(/(?<=\.)\s+/);
  return firstSentence ?? intro;
}

function getComparisonName(title: string): string {
  return title.replace(/^Pack vs\.\s*/i, "");
}

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
  const shortIntro = getShortIntro(guide.intro);
  const visibleFaqs = guide.faqs.slice(0, MAX_VISIBLE_FAQS);
  const systemNodes = guide.sections.slice(0, MAX_SYSTEM_NODES);
  const boundaryRows = guide.comparisons.slice(0, MAX_BOUNDARY_ROWS);

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
        <Intro>{shortIntro}</Intro>
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
            <VennCircle
              aria-hidden="true"
              $left="50%"
              $top="34%"
              $color="rgba(243, 210, 122, 0.5)"
            />
            <VennCircle
              aria-hidden="true"
              $left="34%"
              $top="62%"
              $color="rgba(249, 47, 96, 0.48)"
            />
            <VennCircle
              aria-hidden="true"
              $left="66%"
              $top="62%"
              $color="rgba(88, 166, 255, 0.48)"
            />
            <VennLabel $left="50%" $top="24%">AI planning</VennLabel>
            <VennLabel $left="31%" $top="74%">Itinerary organization</VennLabel>
            <VennLabel $left="69%" $top="74%">Real trip context</VennLabel>
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
              {systemNodes.map((section, index) => (
                <SystemNode key={section.title}>
                  <span>Layer {index + 1}</span>
                  <p>{section.title}</p>
                </SystemNode>
              ))}
            </SystemNodes>
          </div>
        </VennWrap>
      </SystemMap>

      <Section>
        <SectionTitle>Where other tools usually stop</SectionTitle>
        <BoundaryTable>
          <BoundaryHeaderRow aria-hidden="true">
            <BoundaryHead>Lane</BoundaryHead>
            <BoundaryHead>Usually stops at</BoundaryHead>
            <BoundaryHead>Pack wraps around it</BoundaryHead>
          </BoundaryHeaderRow>
          {boundaryRows.map((comparison) => (
            <BoundaryRow key={comparison.title}>
              <BoundaryCell>
                <MobileBoundaryLabel>Lane</MobileBoundaryLabel>
                <BoundaryTitle>{getComparisonName(comparison.title)}</BoundaryTitle>
              </BoundaryCell>
              <BoundaryCell>
                <MobileBoundaryLabel>Usually stops at</MobileBoundaryLabel>
                <BoundaryText>{comparison.body}</BoundaryText>
              </BoundaryCell>
              <BoundaryCell>
                <MobileBoundaryLabel>Pack wraps around it</MobileBoundaryLabel>
                {comparison.points.slice(0, MAX_POINTS_PER_SECTION).map((point) => (
                  <BoundaryPoint key={point}>
                    <CheckCircle aria-hidden="true" />
                    <span>{point}</span>
                  </BoundaryPoint>
                ))}
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
              <summary>{faq.question}</summary>
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
