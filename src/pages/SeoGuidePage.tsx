import React from "react";
import styled from "styled-components";
import { ArrowRight, Search } from "lucide-react";
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
  justify-items: center;
`;

const VennDiagram = styled.div`
  position: relative;
  width: min(100%, 46rem);
  min-height: clamp(28rem, 48vw, 38rem);
  isolation: isolate;

  @media (max-width: 520px) {
    min-height: 23rem;
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
  width: min(44vw, 21rem);
  aspect-ratio: 1;
  border: 1.5px solid ${(props) => props.$color};
  border-radius: 50%;
  background: color-mix(in srgb, ${(props) => props.$color} 24%, transparent);
  transform: translate(-50%, -50%);
  z-index: 1;

  @media (max-width: 520px) {
    width: min(58vw, 13.5rem);
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
    max-width: 8.2rem;
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
  width: min(28vw, 12rem);
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
    width: min(36vw, 8.4rem);
  }
`;

const MarketChip = styled.div<{
  readonly $left: string;
  readonly $top: string;
}>`
  position: absolute;
  left: ${(props) => props.$left};
  top: ${(props) => props.$top};
  display: grid;
  gap: 0.15rem;
  width: min(15rem, 26vw);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 0.85rem;
  background: rgba(8, 8, 12, 0.78);
  box-shadow: 0 10px 28px rgba(0, 0, 0, 0.18);
  color: var(--color-text-secondary);
  padding: 0.55rem 0.7rem;
  font-size: var(--font-size-small);
  line-height: 1.25;
  transform: translate(-50%, -50%);
  z-index: 4;

  strong {
    color: var(--color-text-primary);
    font-size: var(--font-size-small);
    line-height: 1.15;
  }

  span {
    display: block;
  }

  @media (max-width: 520px) {
    width: 7.3rem;
    padding: 0.42rem 0.48rem;
    font-size: 0.68rem;

    strong {
      font-size: 0.69rem;
    }
  }
`;

const SystemMapHeader = styled.div`
  display: grid;
  gap: var(--space-1);
  justify-items: center;
  max-width: 760px;
  text-align: center;

  h2 {
    margin: 0;
    color: var(--color-text-primary);
    font-size: var(--font-size-xl);
  }

  p {
    margin: 0;
    color: var(--color-text-secondary);
    line-height: 1.6;
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

const MarketLegend = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--space-3);
  margin-bottom: var(--space-5);

  @media (min-width: 780px) {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
`;

const MarketLegendItem = styled.article`
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: var(--border-radius);
  background: rgba(255, 255, 255, 0.035);
  padding: var(--space-3);

  h3 {
    margin: 0 0 var(--space-1);
    color: var(--color-text-primary);
    font-size: var(--font-size-medium);
  }

  p {
    margin: 0;
    color: var(--color-text-secondary);
    font-size: var(--font-size-small);
    line-height: 1.5;
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

const MAX_VISIBLE_FAQS = 3;

function getShortIntro(intro: string): string {
  const [firstSentence] = intro.split(/(?<=\.)\s+/);
  return firstSentence ?? intro;
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
          <VennDiagram aria-label="Pack combines a personal assistant, trip planner, and booking agent">
            <VennCircle
              aria-hidden="true"
              $left="50%"
              $top="34%"
              $color="rgba(243, 210, 122, 0.5)"
            />
            <VennCircle
              aria-hidden="true"
              $left="35%"
              $top="62%"
              $color="rgba(249, 47, 96, 0.48)"
            />
            <VennCircle
              aria-hidden="true"
              $left="65%"
              $top="62%"
              $color="rgba(88, 166, 255, 0.48)"
            />
            <VennLabel $left="50%" $top="22%">Knows you well</VennLabel>
            <VennLabel $left="32%" $top="75%">Plans the trip</VennLabel>
            <VennLabel $left="68%" $top="75%">Books and operates</VennLabel>
            <MarketChip $left="30%" $top="53%">
              <strong>Planner apps</strong>
              <span>Layla, Mindtrip, Wanderlog</span>
            </MarketChip>
            <MarketChip $left="73%" $top="56%">
              <strong>Booking sites</strong>
              <span>Expedia, Booking.com, KAYAK</span>
            </MarketChip>
            <MarketChip $left="50%" $top="37%">
              <strong>Itinerary memory</strong>
              <span>TripIt, KAYAK Trips</span>
            </MarketChip>
            <MarketChip $left="62%" $top="68%">
              <strong>Managed travel</strong>
              <span>Navan, TravelPerk</span>
            </MarketChip>
            <VennCenter>Pack</VennCenter>
          </VennDiagram>
          <SystemMapHeader>
            <h2>Where travel apps stop</h2>
            <p>
              Most tools live mostly in one circle. Pack is built for the
              overlap: it should know the traveler, ask planning questions, and
              help the trip become bookable and operational.
            </p>
          </SystemMapHeader>
        </VennWrap>
      </SystemMap>

      <MarketLegend aria-label="Venn diagram explanation">
        <MarketLegendItem>
          <h3>Planner apps</h3>
          <p>
            Strong at inspiration and itinerary drafts, but they usually stop
            before the plan uses deep traveler context or becomes operational.
          </p>
        </MarketLegendItem>
        <MarketLegendItem>
          <h3>Booking and managed travel</h3>
          <p>
            Strong at inventory, checkout, policy, and business travel control,
            but they often start after the planning conversation has happened.
          </p>
        </MarketLegendItem>
        <MarketLegendItem>
          <h3>Pack</h3>
          <p>
            Pack aims to sit in the overlap: context-aware like an assistant,
            questioning like a travel agent, and practical enough to move toward
            booking and travel-day execution.
          </p>
        </MarketLegendItem>
      </MarketLegend>

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
