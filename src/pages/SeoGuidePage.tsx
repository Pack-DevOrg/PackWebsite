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
    min-height: 15.75rem;
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
    width: min(39vw, 9.6rem);
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
    max-width: 6.9rem;
    padding: 0.34rem 0.46rem;
    font-size: 0.66rem;
    white-space: normal;
  }
`;

const VennCenter = styled.button<{ readonly $active?: boolean }>`
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
  box-shadow: ${(props) =>
    props.$active
      ? "0 0 0 1px rgba(243, 210, 122, 0.5), 0 0 42px rgba(243, 210, 122, 0.22)"
      : "0 0 34px rgba(243, 210, 122, 0.14)"};
  color: var(--color-accent);
  font-size: var(--font-size-medium);
  font-weight: 900;
  font-family: inherit;
  line-height: 1.2;
  padding: var(--space-2);
  text-align: center;
  transform: translate(-50%, -50%);
  z-index: 2;
  cursor: pointer;
  transition: box-shadow 160ms ease-out, transform 160ms ease-out;

  &:hover,
  &:focus-visible {
    outline: none;
    transform: translate(-50%, -50%) scale(1.03);
  }

  @media (max-width: 520px) {
    width: min(28vw, 6.8rem);
  }
`;

const MarketChipButton = styled.button<{
  readonly $left: string;
  readonly $top: string;
  readonly $active?: boolean;
}>`
  position: absolute;
  left: ${(props) => props.$left};
  top: ${(props) => props.$top};
  display: grid;
  gap: 0.15rem;
  width: min(15rem, 26vw);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 0.85rem;
  background: ${(props) =>
    props.$active ? "rgba(243, 210, 122, 0.18)" : "rgba(8, 8, 12, 0.78)"};
  box-shadow: ${(props) =>
    props.$active
      ? "0 0 0 1px rgba(243, 210, 122, 0.36), 0 14px 34px rgba(0, 0, 0, 0.28)"
      : "0 10px 28px rgba(0, 0, 0, 0.18)"};
  color: var(--color-text-secondary);
  font-family: inherit;
  padding: 0.55rem 0.7rem;
  font-size: var(--font-size-small);
  line-height: 1.25;
  transform: translate(-50%, -50%);
  z-index: 4;
  cursor: pointer;
  appearance: none;
  text-align: left;
  transition: background 160ms ease-out, border-color 160ms ease-out,
    box-shadow 160ms ease-out, transform 160ms ease-out;

  &:hover,
  &:focus-visible {
    border-color: rgba(243, 210, 122, 0.42);
    transform: translate(-50%, -50%) scale(1.03);
    outline: none;
  }

  strong {
    color: var(--color-text-primary);
    font-size: var(--font-size-small);
    line-height: 1.15;
  }

  span {
    display: block;
  }

  @media (max-width: 520px) {
    width: 5.85rem;
    padding: 0.34rem 0.42rem;
    font-size: 0.64rem;

    strong {
      font-size: 0.65rem;
    }

    span {
      display: none;
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

const MarketDetail = styled.article`
  display: grid;
  gap: var(--space-2);
  width: min(100%, 54rem);
  border: 1px solid rgba(243, 210, 122, 0.18);
  border-radius: var(--border-radius);
  background:
    linear-gradient(135deg, rgba(243, 210, 122, 0.08), transparent 55%),
    rgba(255, 255, 255, 0.035);
  padding: var(--space-3);

  h3 {
    margin: 0;
    color: var(--color-text-primary);
    font-size: var(--font-size-large);
  }

  p {
    margin: 0;
    color: var(--color-text-secondary);
    line-height: 1.55;
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

const marketMapNodes = [
  {
    id: "planner-apps",
    label: "Planner apps",
    examples: "Layla, Mindtrip, Wanderlog",
    left: "25%",
    top: "59%",
    title: "Planner apps are strongest before the trip is real.",
    body:
      "They are useful for inspiration and itinerary drafts. Pack should extend that by remembering traveler context, asking follow-up questions, and carrying the plan toward booking and travel day.",
  },
  {
    id: "booking-sites",
    label: "Booking sites",
    examples: "Expedia, Booking.com, KAYAK",
    left: "75%",
    top: "59%",
    title: "Booking sites are strongest when the traveler already knows what to buy.",
    body:
      "They are built around inventory, price comparison, and checkout. Pack should wrap that with the planning conversation and the personal context that decides which booking actually fits.",
  },
  {
    id: "itinerary-memory",
    label: "Itinerary memory",
    examples: "TripIt, KAYAK Trips",
    left: "50%",
    top: "40%",
    title: "Itinerary tools remember the trip after choices are made.",
    body:
      "They are useful for storing confirmations and trip details. Pack should connect that memory back into planning, traveler preferences, booking decisions, and future trips.",
  },
  {
    id: "managed-travel",
    label: "Managed travel",
    examples: "Navan, TravelPerk",
    left: "50%",
    top: "74%",
    title: "Managed travel handles operational control.",
    body:
      "These tools are strong for business travel policy, control, and coordination. Pack should bring that operational usefulness to broader traveler and group contexts.",
  },
  {
    id: "pack",
    label: "Pack",
    examples: "The overlap",
    left: "50%",
    top: "50%",
    title: "Pack belongs in the overlap.",
    body:
      "The opportunity is not another isolated planner or booking site. Pack combines the assistant who knows you, the travel agent who asks the right questions, and the workflow that turns the plan into a real trip.",
  },
] as const;

type MarketMapNodeId = (typeof marketMapNodes)[number]["id"];

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
  const [selectedMarketNodeId, setSelectedMarketNodeId] =
    React.useState<MarketMapNodeId>("pack");

  if (!isSeoGuideSlug(slug)) {
    return null;
  }

  const guide = seoGuideDefinitionMap[slug];
  const path = `/guides/${guide.slug}`;
  const primaryFeatureLink = guide.relatedLinks[0];
  const shortIntro = getShortIntro(guide.intro);
  const visibleFaqs = guide.faqs.slice(0, MAX_VISIBLE_FAQS);
  const selectedMarketNode =
    marketMapNodes.find((node) => node.id === selectedMarketNodeId) ??
    marketMapNodes[marketMapNodes.length - 1];

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
            <VennLabel $left="50%" $top="20%">Knows you well</VennLabel>
            <VennLabel $left="28%" $top="83%">Plans the trip</VennLabel>
            <VennLabel $left="72%" $top="83%">Books and operates</VennLabel>
            {marketMapNodes
              .filter((node) => node.id !== "pack")
              .map((node) => (
                <MarketChipButton
                  key={node.id}
                  type="button"
                  $active={selectedMarketNodeId === node.id}
                  $left={node.left}
                  $top={node.top}
                  aria-pressed={selectedMarketNodeId === node.id}
                  aria-label={`${node.label}: ${node.examples}`}
                  onClick={() => setSelectedMarketNodeId(node.id)}
                >
                  <strong>{node.label}</strong>
                  <span>{node.examples}</span>
                </MarketChipButton>
              ))}
            <VennCenter
              type="button"
              $active={selectedMarketNodeId === "pack"}
              aria-pressed={selectedMarketNodeId === "pack"}
              onClick={() => setSelectedMarketNodeId("pack")}
            >
              Pack
            </VennCenter>
          </VennDiagram>
          <SystemMapHeader>
            <h2>Where travel apps stop</h2>
            <p>
              Most tools live mostly in one circle. Pack is built for the
              overlap: it should know the traveler, ask planning questions, and
              help the trip become bookable and operational.
            </p>
          </SystemMapHeader>
          <MarketDetail aria-live="polite">
            <h3>{selectedMarketNode.title}</h3>
            <p>{selectedMarketNode.body}</p>
          </MarketDetail>
        </VennWrap>
      </SystemMap>

      <MarketLegend aria-label="Venn diagram explanation">
        <MarketLegendItem>
          <h3>Planner apps</h3>
          <p>
            Layla, Mindtrip, and Wanderlog are strong at inspiration and
            itinerary drafts, but they usually stop before the plan uses deep
            traveler context or becomes operational.
          </p>
        </MarketLegendItem>
        <MarketLegendItem>
          <h3>Booking and managed travel</h3>
          <p>
            Expedia, Booking.com, KAYAK, Navan, and TravelPerk are strong at
            inventory, checkout, policy, and control, but they often start after
            the planning conversation has happened.
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
