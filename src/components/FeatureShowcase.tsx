import { useCallback, useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import styled from "styled-components";
import {
  ArrowRight,
  CalendarClock,
  CreditCard,
  Home,
  Luggage,
  Rocket,
  Search,
  SlidersHorizontal,
  Sparkles,
  TrendingUp,
  Users,
} from "lucide-react";
import PrefetchLink from "./PrefetchLink";
import { useI18n } from "@/i18n/I18nProvider";
import { FEATURE_SCREENS } from "@/content/featureScreens";
import CarouselTabBand from "./CarouselTabBand";
import FeaturePhone, { useFeatureMediaAvailable } from "./FeaturePhone";
import ScrollablePhone from "./featurescreens/ScrollablePhone";
import { FEATURE_CAPTURES } from "@/content/featureCaptures";

/**
 * The interactive features explorer. The shared CarouselTabBand on top walks
 * the app's screens in journey order (arrow keys and chevrons move along it);
 * below, the phone plays the screen's demo clip on the left — an interactive
 * recording you can drag to scrub and tap to pause — while the right panel
 * carries the screen's editorial copy plus the capability feature cards
 * tagged to that screen. Every panel is real DOM (inactive ones use
 * `hidden`) so all capability links prerender; media is HEAD-gated so SEO
 * never depends on assets.
 */
const RAIL_BREAKPOINT = 980;

export type ShowcasePanelItem = {
  href: string;
  title: string;
  description: string;
  icon: ReactNode;
};

type FeatureShowcaseProps = {
  /** Localized capability cards, keyed by screen id, in display order. */
  panels: Record<string, ShowcasePanelItem[]>;
};

const Section = styled.section`
  width: 100%;
  display: grid;
  gap: var(--space-3);
`;

const ShowcaseGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--space-3);
  justify-items: center;

  @media (min-width: ${RAIL_BREAKPOINT}px) {
    grid-template-columns: minmax(16rem, 21rem) 1fr;
    gap: var(--space-5);
    align-items: center;
    justify-items: stretch;
  }
`;

const DeckViewport = styled.div`
  position: relative;
  width: min(100%, calc(min(74vh, 42rem) * (1206 / 2622)));
  aspect-ratio: 1206 / 2622;
  justify-self: center;
`;

const DeckCard = styled.div<{ $offset: number }>`
  position: absolute;
  inset: 0;
  transition: transform 340ms cubic-bezier(0.25, 0.9, 0.3, 1), opacity 340ms ease;
  transform: ${({ $offset }) =>
    $offset === 0
      ? "translateX(0) scale(1)"
      : `translateX(${$offset > 0 ? "9%" : "-9%"}) scale(0.92)`};
  opacity: ${({ $offset }) =>
    $offset === 0 ? 1 : $offset === 1 || $offset === -1 ? 0.18 : 0};
  pointer-events: ${({ $offset }) => ($offset === 0 ? "auto" : "none")};
  z-index: ${({ $offset }) => 10 - Math.abs($offset)};
`;

const DetailColumn = styled.div`
  width: 100%;
  display: grid;
  align-content: center;
`;

const Panel = styled.div`
  display: grid;
  gap: var(--space-3);

  /* The styled display: grid outranks the UA's [hidden] rule. */
  &[hidden] {
    display: none;
  }
`;

const PanelHeading = styled.div`
  display: grid;
  gap: 0.45rem;
`;

const PanelTitle = styled.h3`
  margin: 0;
  font-family: var(--font-display-serif);
  font-style: italic;
  font-weight: 420;
  font-variation-settings: "opsz" 144, "SOFT" 40;
  letter-spacing: -0.025em;
  font-size: clamp(2.1rem, 3.2vw, 2.9rem);
  line-height: 1.05;
  background: linear-gradient(135deg, #f3d27a 0%, #ebbe58 62%, #f8e6b3 100%);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  padding-bottom: 0.08em;
`;

const PanelCaption = styled.p`
  margin: 0;
  color: #e8e2d5;
  font-size: 1.05rem;
  font-weight: 600;
  line-height: 1.4;
`;

const PanelBlurb = styled.p`
  margin: 0;
  max-width: 34rem;
  color: #b9b3a6;
  font-size: 0.95rem;
  line-height: 1.6;
`;

const PanelFeatureList = styled.div`
  display: grid;
  gap: 0.5rem;
`;

const PanelFeatureCard = styled(PrefetchLink)`
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  gap: var(--space-3);
  padding: 0.75rem 0.9rem;
  border: 1px solid rgba(255, 255, 255, 0.07);
  border-radius: var(--border-radius);
  background: rgba(255, 255, 255, 0.03);
  color: inherit;
  text-decoration: none;
  transition: border-color 160ms ease-out, background 160ms ease-out;

  svg.arrow {
    width: 16px;
    height: 16px;
    color: var(--color-text-secondary);
    transition: color 160ms ease-out, transform 160ms ease-out;
  }

  &:hover,
  &:focus-visible {
    border-color: rgba(243, 210, 122, 0.34);
    background: rgba(243, 210, 122, 0.05);

    svg.arrow {
      color: var(--color-accent);
      transform: translateX(2px);
    }
  }

  @media (prefers-reduced-motion: reduce) {
    transition: none;
  }
`;

const PanelFeatureIcon = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 38px;
  height: 38px;
  background: rgba(243, 210, 122, 0.1);
  border: 1px solid rgba(243, 210, 122, 0.18);
  border-radius: 50%;
  color: var(--color-accent);
  flex-shrink: 0;

  svg {
    width: 17px;
    height: 17px;
  }
`;

const PanelFeatureText = styled.span`
  display: grid;
  gap: 0.15rem;
  min-width: 0;
`;

const PanelFeatureTitle = styled.b`
  color: var(--color-text-primary);
  font-size: 0.92rem;
  font-weight: 600;
  line-height: 1.35;
`;

const PanelFeatureDescription = styled.span`
  color: var(--color-text-secondary);
  font-size: 0.84rem;
  line-height: 1.5;
`;

const SCREEN_ICONS: Record<string, ReactNode> = {
  plan: <Sparkles />,
  search: <Search />,
  book: <CreditCard />,
  "day-of": <CalendarClock />,
  trips: <Luggage />,
  stats: <TrendingUp />,
  packs: <Users />,
  preferences: <SlidersHorizontal />,
  home: <Home />,
  onboarding: <Rocket />,
};

export default function FeatureShowcase({ panels }: FeatureShowcaseProps) {
  const { pathFor } = useI18n();
  const [active, setActive] = useState(0);
  const mediaAvailable = useFeatureMediaAvailable();
  const sectionRef = useRef<HTMLElement | null>(null);
  const sectionInView = useRef(false);
  const count = FEATURE_SCREENS.length;

  const go = useCallback(
    (delta: number) => setActive(prev => (prev + delta + count) % count),
    [count],
  );

  // Arrow keys drive the pills only while the explorer is actually on
  // screen — a page-wide listener would hijack scrolling below the fold.
  useEffect(() => {
    const node = sectionRef.current;
    if (!node || typeof IntersectionObserver === "undefined") {
      sectionInView.current = true;
      return;
    }
    const observer = new IntersectionObserver(
      entries => {
        sectionInView.current = entries[0]?.isIntersecting ?? false;
      },
      { threshold: 0.35 },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (!sectionInView.current) return;
      if (event.key === "ArrowRight") {
        event.preventDefault();
        go(1);
      } else if (event.key === "ArrowLeft") {
        event.preventDefault();
        go(-1);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [go]);

  return (
    <Section ref={sectionRef} aria-label="Pack features, shown in the real app">
      <CarouselTabBand
        items={FEATURE_SCREENS.map(screen => ({
          id: screen.id,
          label: screen.label,
          icon: SCREEN_ICONS[screen.id],
        }))}
        activeId={FEATURE_SCREENS[active].id}
        ariaLabel="Jump to a screen"
        onSelect={setActive}
      />
      <ShowcaseGrid>
        <DeckViewport>
          {FEATURE_SCREENS.map((screen, index) => {
            let offset = index - active;
            if (offset > count / 2) offset -= count;
            if (offset < -count / 2) offset += count;
            const capture = FEATURE_CAPTURES[screen.id];
            return (
              <DeckCard key={screen.id} $offset={offset} id={`feature-${screen.id}`}>
                {capture ? (
                  // The real screen, scrollable — visitors explore it directly.
                  <ScrollablePhone
                    src={capture.src}
                    width={capture.width}
                    height={capture.height}
                    alt={capture.alt}
                    eager={offset === 0}
                  />
                ) : (
                  <FeaturePhone
                    screenId={screen.id}
                    active={offset === 0}
                    withVideo={mediaAvailable && Math.abs(offset) <= 1}
                    preload={offset === 0 ? "auto" : "metadata"}
                    onEnded={offset === 0 ? () => go(1) : undefined}
                  />
                )}
              </DeckCard>
            );
          })}
        </DeckViewport>
        <DetailColumn>
          {FEATURE_SCREENS.map((screen, index) => (
            <Panel key={screen.id} hidden={index !== active}>
              <PanelHeading>
                <PanelTitle>{screen.label}</PanelTitle>
                <PanelCaption>{screen.caption}</PanelCaption>
                <PanelBlurb>{screen.blurb}</PanelBlurb>
              </PanelHeading>
              {panels[screen.id]?.length ? (
                <PanelFeatureList>
                  {panels[screen.id].map(item => (
                    <PanelFeatureCard key={item.href} to={pathFor(`/${item.href}`)}>
                      <PanelFeatureIcon>{item.icon}</PanelFeatureIcon>
                      <PanelFeatureText>
                        <PanelFeatureTitle>{item.title}</PanelFeatureTitle>
                        <PanelFeatureDescription>
                          {item.description}
                        </PanelFeatureDescription>
                      </PanelFeatureText>
                      <ArrowRight className="arrow" aria-hidden="true" />
                    </PanelFeatureCard>
                  ))}
                </PanelFeatureList>
              ) : null}
            </Panel>
          ))}
        </DetailColumn>
      </ShowcaseGrid>
    </Section>
  );
}
