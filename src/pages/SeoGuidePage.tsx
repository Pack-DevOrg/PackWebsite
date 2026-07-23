import React from "react";
import styled from "styled-components";
import type { ReactNode } from "react";
import {
  ArrowRight,
  Brain,
  Calendar,
  CreditCard,
  Layers,
  LayoutGrid,
  Map as MapIcon,
  Search,
  ShieldCheck,
  Sparkles,
  Users,
  Zap,
} from "lucide-react";
import PrefetchLink from "@/components/PrefetchLink";
import CarouselTabBand from "@/components/CarouselTabBand";
import PageSeo, {
  buildAbsoluteUrl,
  DEFAULT_SHARE_IMAGE_URL,
  ORGANIZATION_ID,
} from "@/seo/pageSeo";
import {
  isSeoGuideSlug,
  orderedSeoGuideSlugs,
  seoGuideDefinitionMap,
  type SeoGuideDefinition,
  type SeoGuideFaq,
  type SeoGuideSlug,
} from "@/content/seoGuides";

const Page = styled.main`
  width: min(100%, 1120px);
  margin: 0 auto;
  padding: var(--space-4) var(--space-3) var(--space-6);

  @media (min-width: 768px) {
    padding: var(--space-5) var(--space-4) var(--space-7);
  }
`;

/* The features family's shared header, guides edition: each guide is a
   sibling tab in reading order, chevrons step through them, and the leading
   Overview tab returns to the features showcase. */
const BandWrap = styled.div`
  margin-bottom: var(--space-4);
`;

const GUIDE_ICONS: Record<SeoGuideSlug, ReactNode> = {
  "event-trip-planning": <Calendar />,
  "travel-context-engine": <Brain />,
  "trip-organization": <Layers />,
  "booking-context": <CreditCard />,
  "group-trip-planning": <Users />,
  "travel-stats-and-maps": <MapIcon />,
  "travel-day-intelligence": <Zap />,
  "reliable-ai-travel-planning": <ShieldCheck />,
  "ai-travel-planning": <Sparkles />,
};

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
  align-items: center;

  @media (min-width: 900px) {
    grid-template-columns: minmax(0, 1.15fr) minmax(0, 1fr);
    gap: var(--space-5);
  }
`;

/* The market Venn is real geometry: one SVG viewBox draws the circles, and
   every chip is anchored at coordinates verified to sit inside the region it
   claims (single/double/triple overlap). The container keeps the viewBox
   aspect, so the same percentages hold at every width — no per-breakpoint
   position fudging. */
const VENN_W = 800;
const VENN_H = 640;
const VENN_R = 200;
const VENN_CIRCLES = {
  knows: { cx: 400, cy: 235, color: "rgba(243, 210, 122, 0.55)" },
  plans: { cx: 305, cy: 395, color: "rgba(249, 47, 96, 0.5)" },
  books: { cx: 495, cy: 395, color: "rgba(88, 166, 255, 0.5)" },
} as const;

const pct = (x: number, axis: "x" | "y") =>
  `${((x / (axis === "x" ? VENN_W : VENN_H)) * 100).toFixed(2)}%`;

const VennCanvas = styled.div`
  position: relative;
  width: min(100%, 34rem);
  aspect-ratio: ${VENN_W} / ${VENN_H};
  justify-self: center;

  svg {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
  }
`;

const RegionLabel = styled.span<{ readonly $x: number; readonly $y: number }>`
  position: absolute;
  left: ${(props) => pct(props.$x, "x")};
  top: ${(props) => pct(props.$y, "y")};
  transform: translate(-50%, -50%);
  color: var(--color-text-secondary);
  font-size: clamp(0.58rem, 1.7vw, 0.76rem);
  font-weight: 700;
  letter-spacing: 0.09em;
  text-transform: uppercase;
  white-space: nowrap;
  pointer-events: none;
`;

const MarketChipButton = styled.button<{
  readonly $x: number;
  readonly $y: number;
  readonly $active?: boolean;
}>`
  position: absolute;
  left: ${(props) => pct(props.$x, "x")};
  top: ${(props) => pct(props.$y, "y")};
  transform: translate(-50%, -50%);
  display: grid;
  gap: 0.1rem;
  max-width: 34%;
  border: 1px solid
    ${(props) =>
      props.$active ? "var(--color-accent)" : "rgba(255, 255, 255, 0.14)"};
  border-radius: 0.75rem;
  background: rgba(8, 8, 12, 0.82);
  color: var(--color-text-secondary);
  font-family: inherit;
  padding: clamp(0.28rem, 1vw, 0.5rem) clamp(0.4rem, 1.4vw, 0.65rem);
  font-size: clamp(0.56rem, 1.6vw, 0.78rem);
  line-height: 1.25;
  text-align: center;
  cursor: pointer;
  appearance: none;
  z-index: 2;
  transition: border-color 160ms ease-out, color 160ms ease-out;

  &:hover,
  &:focus-visible {
    border-color: var(--color-accent);
    outline: none;
  }

  strong {
    color: ${(props) =>
      props.$active ? "var(--color-accent)" : "var(--color-text-primary)"};
    font-size: inherit;
    line-height: 1.15;
    transition: color 160ms ease-out;
  }

  span {
    display: block;
    font-size: 0.85em;

    @media (max-width: 560px) {
      display: none;
    }
  }
`;

const VennCenterButton = styled.button<{ readonly $active?: boolean }>`
  position: absolute;
  left: ${pct(400, "x")};
  top: ${pct(330, "y")};
  transform: translate(-50%, -50%);
  border: 1px solid
    ${(props) =>
      props.$active ? "var(--color-accent)" : "rgba(243, 210, 122, 0.4)"};
  border-radius: 999px;
  background: rgba(12, 12, 16, 0.88);
  font-family: var(--font-display-serif);
  font-style: italic;
  font-weight: 500;
  font-size: clamp(1rem, 3.2vw, 1.6rem);
  line-height: 1;
  color: var(--color-accent);
  padding: clamp(0.4rem, 1.4vw, 0.7rem) clamp(0.8rem, 2.6vw, 1.3rem);
  cursor: pointer;
  z-index: 2;
  transition: border-color 160ms ease-out, box-shadow 160ms ease-out;
  box-shadow: ${(props) =>
    props.$active ? "0 0 38px rgba(243, 210, 122, 0.28)" : "none"};

  &:hover,
  &:focus-visible {
    border-color: var(--color-accent);
    outline: none;
  }
`;

const SystemMapAside = styled.div`
  display: grid;
  gap: var(--space-3);
  align-content: center;
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

const MarketDetail = styled.article`
  display: grid;
  gap: var(--space-2);
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

/* Coordinates live in the SVG viewBox space and are checked against the
   circle geometry: each node sits inside exactly the region it names. */
const marketMapNodes = [
  {
    id: "itinerary-memory",
    label: "Itinerary memory",
    examples: "TripIt, KAYAK Trips",
    x: 400,
    y: 145,
    circles: ["knows"],
    title: "Itinerary tools remember the trip after choices are made.",
    body:
      "They are useful for storing confirmations and trip details. Pack should connect that memory back into planning, traveler preferences, booking decisions, and future trips.",
  },
  {
    id: "planner-apps",
    label: "Planner apps",
    examples: "Layla, Mindtrip, Wanderlog",
    x: 190,
    y: 470,
    circles: ["plans"],
    title: "Planner apps are strongest before the trip is real.",
    body:
      "They are useful for inspiration and itinerary drafts. Pack should extend that by remembering traveler context, asking follow-up questions, and carrying the plan toward booking and travel day.",
  },
  {
    id: "booking-sites",
    label: "Booking sites",
    examples: "Expedia, Booking.com, KAYAK",
    x: 610,
    y: 470,
    circles: ["books"],
    title: "Booking sites are strongest when the traveler already knows what to buy.",
    body:
      "They are built around inventory, price comparison, and checkout. Pack should wrap that with the planning conversation and the personal context that decides which booking actually fits.",
  },
  {
    id: "managed-travel",
    label: "Managed travel",
    examples: "Navan, TravelPerk",
    x: 400,
    y: 516,
    circles: ["plans", "books"],
    title: "Managed travel handles operational control.",
    body:
      "These tools are strong for business travel policy, control, and coordination. Pack should bring that operational usefulness to broader traveler and group contexts.",
  },
  {
    id: "pack",
    label: "Pack",
    examples: "The overlap",
    x: 400,
    y: 330,
    circles: ["knows", "plans", "books"],
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
    image: DEFAULT_SHARE_IMAGE_URL,
    datePublished: guide.datePublished,
    dateModified: guide.dateModified,
    author: {
      "@id": ORGANIZATION_ID,
    },
    publisher: {
      "@id": ORGANIZATION_ID,
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
        title={`${guide.seoTitle ?? guide.title} | Pack`}
        description={guide.seoDescription ?? guide.description}
        path={path}
        schema={[createGuideSchema(guide), createFaqSchema(visibleFaqs)]}
      />
      <BandWrap>
        <CarouselTabBand
          ariaLabel="Pack travel guides"
          activeId={guide.slug}
          items={[
            {
              id: "features-overview",
              label: "Overview",
              icon: <LayoutGrid />,
              href: "/features",
            },
            ...orderedSeoGuideSlugs.map((guideSlug) => ({
              id: guideSlug,
              label: seoGuideDefinitionMap[guideSlug].navLabel,
              icon: GUIDE_ICONS[guideSlug],
              href: `/guides/${guideSlug}`,
            })),
          ]}
        />
      </BandWrap>
      <Header>
        <Eyebrow>{guide.eyebrow}</Eyebrow>
        <Title>{guide.title}</Title>
        <Intro>{shortIntro}</Intro>
        {primaryFeatureLink ? (
          <TopActions aria-label="Related Pack features">
            <RelatedLink to={primaryFeatureLink.href}>
              Open {primaryFeatureLink.label}
              <ArrowRight aria-hidden="true" />
            </RelatedLink>
          </TopActions>
        ) : null}
      </Header>

      <SystemMap>
        <VennCanvas>
          <svg
            viewBox={`0 0 ${VENN_W} ${VENN_H}`}
            role="img"
            aria-label="Pack combines a personal assistant, trip planner, and booking agent"
          >
            {(Object.keys(VENN_CIRCLES) as (keyof typeof VENN_CIRCLES)[]).map(
              (key) => {
                const circle = VENN_CIRCLES[key];
                const active = (
                  selectedMarketNode.circles as readonly string[]
                ).includes(key);
                return (
                  <circle
                    key={key}
                    cx={circle.cx}
                    cy={circle.cy}
                    r={VENN_R}
                    fill={`color-mix(in srgb, ${circle.color} ${active ? 30 : 16}%, transparent)`}
                    stroke={circle.color}
                    strokeWidth={active ? 3 : 1.5}
                    vectorEffect="non-scaling-stroke"
                  />
                );
              },
            )}
          </svg>
          <RegionLabel $x={400} $y={20}>Knows you well</RegionLabel>
          <RegionLabel $x={170} $y={618}>Plans the trip</RegionLabel>
          <RegionLabel $x={630} $y={618}>Books and operates</RegionLabel>
          {marketMapNodes
            .filter((node) => node.id !== "pack")
            .map((node) => (
              <MarketChipButton
                key={node.id}
                type="button"
                $active={selectedMarketNodeId === node.id}
                $x={node.x}
                $y={node.y}
                aria-pressed={selectedMarketNodeId === node.id}
                aria-label={`${node.label}: ${node.examples}`}
                onClick={() => setSelectedMarketNodeId(node.id)}
              >
                <strong>{node.label}</strong>
                <span>{node.examples}</span>
              </MarketChipButton>
            ))}
          <VennCenterButton
            type="button"
            $active={selectedMarketNodeId === "pack"}
            aria-pressed={selectedMarketNodeId === "pack"}
            onClick={() => setSelectedMarketNodeId("pack")}
          >
            Pack.
          </VennCenterButton>
        </VennCanvas>
        <SystemMapAside>
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
        </SystemMapAside>
      </SystemMap>

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
