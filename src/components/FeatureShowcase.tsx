import { useCallback, useEffect, useRef, useState } from "react";
import styled from "styled-components";

/**
 * The interactive features section, styled after the app's Upcoming day deck.
 * Desktop is a two-column stage: an editorial rail (big Fraunces feature
 * title, one-line caption, clickable feature index) beside the phone; mobile
 * keeps the stacked deck with the chip rail. Clips play as a guided tour —
 * each auto-advances to the next when it ends, with a progress hairline on
 * the phone. Visual-first: the video does the talking. All copy is real DOM
 * and prerenders; media is HEAD-gated so SEO never depends on assets.
 * Clips + posters come from the demo pipeline:
 *   PackApp: node scripts/produce-demo-clips.mjs --export \
 *     ../PackWebsite/public/videos/features
 */
const MEDIA_BASE = "/videos/features";
const RAIL_BREAKPOINT = 980;

type ShowcaseFeature = {
  id: string;
  label: string;
  caption: string;
};

const SHOWCASE_FEATURES: ShowcaseFeature[] = [
  { id: "plan", label: "Plan", caption: "One message becomes a full trip" },
  { id: "search", label: "Search", caption: "Real prices for the whole party" },
  { id: "book", label: "Book", caption: "One checkout for everything" },
  { id: "day-of", label: "Day-of", caption: "Your day live, down to the Lock Screen" },
  { id: "trips", label: "Trips", caption: "Every trip, past and future" },
  { id: "stats", label: "Stats", caption: "Your travel, measured" },
  { id: "packs", label: "Packs", caption: "The people you go places with" },
  { id: "preferences", label: "Prefs", caption: "Set once, used everywhere" },
  { id: "home", label: "Home", caption: "The surface that's already working" },
  { id: "onboarding", label: "Start", caption: "Ready in under a minute" },
];

const Section = styled.section`
  width: 100%;
  display: grid;
  gap: var(--space-2);
`;

const ShowcaseGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--space-2);

  @media (min-width: ${RAIL_BREAKPOINT}px) {
    grid-template-columns: minmax(17rem, 21rem) 1fr;
    gap: var(--space-4);
    align-items: center;
  }
`;

const Rail = styled.div`
  display: none;

  @media (min-width: ${RAIL_BREAKPOINT}px) {
    display: grid;
    align-content: center;
    gap: var(--space-3);
  }
`;

const RailHeading = styled.div`
  display: grid;
  gap: 0.45rem;
`;

const RailTitle = styled.h3`
  margin: 0;
  font-family: var(--font-display-serif);
  font-style: italic;
  font-weight: 420;
  font-variation-settings: "opsz" 144, "SOFT" 40;
  letter-spacing: -0.025em;
  font-size: clamp(2.2rem, 3.4vw, 3rem);
  line-height: 1.05;
  background: linear-gradient(135deg, #f3d27a 0%, #ebbe58 62%, #f8e6b3 100%);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  padding-bottom: 0.08em;
`;

const RailCaption = styled.p`
  margin: 0;
  color: #cfc9bd;
  font-size: 1.02rem;
  line-height: 1.5;
`;

const RailList = styled.nav`
  display: grid;
`;

const RailItem = styled.button<{ $active: boolean }>`
  display: flex;
  align-items: baseline;
  gap: 0.65rem;
  padding: 0.44rem 0.9rem;
  border: 0;
  border-left: 2px solid
    ${({ $active }) =>
      $active ? "var(--color-accent)" : "rgba(243, 210, 122, 0.14)"};
  background: ${({ $active }) =>
    $active
      ? "linear-gradient(90deg, rgba(243, 210, 122, 0.08), transparent 78%)"
      : "transparent"};
  color: inherit;
  font: inherit;
  text-align: left;
  cursor: pointer;
  transition: border-color 140ms ease, background 140ms ease;

  &:hover b {
    color: var(--color-accent);
  }

  b {
    flex-shrink: 0;
    width: 4.1rem;
    color: ${({ $active }) => ($active ? "var(--color-accent)" : "#e8e2d5")};
    font-size: 0.8rem;
    font-weight: 700;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    transition: color 140ms ease;
  }

  span {
    color: ${({ $active }) => ($active ? "#cfc9bd" : "#8f8a7e")};
    font-size: 0.86rem;
    line-height: 1.4;
    transition: color 140ms ease;
  }
`;

const Stage = styled.div`
  position: relative;
  display: grid;
  grid-template-columns: 2.5rem 1fr 2.5rem;
  align-items: center;
  gap: 0.4rem;

  @media (min-width: 900px) {
    grid-template-columns: 3rem 1fr 3rem;
    gap: 0.75rem;
  }

  /* The rail owns navigation on desktop — chevrons would float in the gap. */
  @media (min-width: ${RAIL_BREAKPOINT}px) {
    grid-template-columns: 1fr;
  }
`;

const DeckViewport = styled.div`
  position: relative;
  /* Third clamp: never taller than the phone aspect allows at the viewport's
     width, or object-fit: cover crops the clip's edges on narrow screens. */
  height: min(82vh, 46rem, calc((100vw - 6.3rem) * (2622 / 1206)));
  overflow: hidden;
`;

const DeckCard = styled.figure<{ $offset: number }>`
  position: absolute;
  inset: 0;
  margin: 0;
  display: grid;
  grid-template-rows: 1fr auto;
  justify-items: center;
  gap: 0.7rem;
  transition: transform 340ms cubic-bezier(0.25, 0.9, 0.3, 1), opacity 340ms ease;
  transform: ${({ $offset }) =>
    $offset === 0
      ? "translateY(0) scale(1)"
      : `translateY(${$offset > 0 ? "7%" : "-7%"}) scale(0.92)`};
  opacity: ${({ $offset }) =>
    $offset === 0 ? 1 : $offset === 1 || $offset === -1 ? 0.25 : 0};
  pointer-events: ${({ $offset }) => ($offset === 0 ? "auto" : "none")};
  z-index: ${({ $offset }) => 10 - Math.abs($offset)};
`;

const PhoneFrame = styled.div`
  height: 100%;
  aspect-ratio: 1206 / 2622;
  max-width: 100%;
  border-radius: 2.2rem;
  border: 1px solid rgba(243, 210, 122, 0.22);
  background: #000;
  overflow: hidden;
  position: relative;
  box-shadow:
    0 0 90px rgba(243, 210, 122, 0.1),
    0 24px 70px rgba(0, 0, 0, 0.55);

  video {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
`;

const ClipProgress = styled.div`
  position: absolute;
  left: 12%;
  right: 12%;
  bottom: 0.55rem;
  height: 3px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.12);
  overflow: hidden;
  z-index: 2;
  pointer-events: none;
`;

const ClipProgressFill = styled.div`
  height: 100%;
  width: 0%;
  border-radius: inherit;
  background: rgba(243, 210, 122, 0.85);
`;

const Caption = styled.figcaption<{ $active: boolean }>`
  visibility: ${({ $active }) => ($active ? "visible" : "hidden")};
  display: flex;
  align-items: baseline;
  gap: 0.6rem;
  color: #cfc9bd;
  font-size: 0.92rem;

  b {
    color: var(--color-accent);
    font-size: 0.8rem;
    font-weight: 700;
    letter-spacing: 0.14em;
    text-transform: uppercase;
  }

  @media (min-width: ${RAIL_BREAKPOINT}px) {
    display: none;
  }
`;

const AxisButton = styled.button`
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 50%;
  border: 1px solid rgba(243, 210, 122, 0.24);
  background: rgba(243, 210, 122, 0.06);
  color: var(--color-accent);
  font-size: 1.1rem;
  line-height: 1;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: border-color 140ms ease, background 140ms ease;

  &:hover {
    border-color: var(--color-accent);
    background: rgba(243, 210, 122, 0.12);
  }

  @media (min-width: ${RAIL_BREAKPOINT}px) {
    display: none;
  }
`;

const IndexRail = styled.nav`
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 0.35rem;

  @media (min-width: ${RAIL_BREAKPOINT}px) {
    display: none;
  }
`;

const IndexChip = styled.button<{ $active: boolean }>`
  border: 1px solid
    ${({ $active }) =>
      $active ? "var(--color-accent)" : "rgba(243, 210, 122, 0.16)"};
  color: ${({ $active }) => ($active ? "var(--color-accent)" : "#b9b3a6")};
  background: ${({ $active }) =>
    $active ? "rgba(243, 210, 122, 0.08)" : "transparent"};
  border-radius: 999px;
  padding: 0.28rem 0.68rem;
  font: inherit;
  font-size: 0.78rem;
  font-weight: 600;
  cursor: pointer;
  transition: border-color 140ms ease, color 140ms ease;

  &:hover {
    border-color: var(--color-accent);
    color: var(--color-accent);
  }
`;

export default function FeatureShowcase() {
  const [active, setActive] = useState(0);
  const [mediaAvailable, setMediaAvailable] = useState(false);
  const videoRefs = useRef<Record<string, HTMLVideoElement | null>>({});
  const progressRef = useRef<HTMLDivElement | null>(null);
  const sectionRef = useRef<HTMLElement | null>(null);
  const sectionInView = useRef(false);
  const touchStart = useRef<{ x: number; y: number } | null>(null);
  const count = SHOWCASE_FEATURES.length;
  const activeFeature = SHOWCASE_FEATURES[active];

  const go = useCallback(
    (delta: number) => setActive(prev => (prev + delta + count) % count),
    [count],
  );

  useEffect(() => {
    let cancelled = false;
    fetch(`${MEDIA_BASE}/features.json`, { method: "HEAD" })
      .then(response => {
        if (!cancelled && response.ok) setMediaAvailable(true);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  // Arrow keys drive the deck only while it is actually on screen — a
  // page-wide listener would hijack scrolling everywhere below the fold.
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
      if (event.key === "ArrowRight" || event.key === "ArrowDown") {
        event.preventDefault();
        go(1);
      } else if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
        event.preventDefault();
        go(-1);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [go]);

  useEffect(() => {
    SHOWCASE_FEATURES.forEach((feature, index) => {
      const video = videoRefs.current[feature.id];
      if (!video) return;
      if (index === active) {
        video.currentTime = 0;
        video.play().catch(() => {});
      } else {
        video.pause();
      }
    });
    if (progressRef.current) progressRef.current.style.width = "0%";
  }, [active, mediaAvailable]);

  // Browsers pause offscreen autoplay video; resume the tour when the
  // visitor returns to the tab so the deck never sits frozen.
  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState !== "visible") return;
      const video = videoRefs.current[SHOWCASE_FEATURES[active].id];
      video?.play().catch(() => {});
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [active]);

  const onTimeUpdate = useCallback((video: HTMLVideoElement) => {
    if (!progressRef.current || !video.duration) return;
    progressRef.current.style.width = `${(video.currentTime / video.duration) * 100}%`;
  }, []);

  const onTouchStart = useCallback((event: React.TouchEvent) => {
    const touch = event.touches[0];
    touchStart.current = { x: touch.clientX, y: touch.clientY };
  }, []);

  const onTouchEnd = useCallback(
    (event: React.TouchEvent) => {
      const start = touchStart.current;
      touchStart.current = null;
      if (!start) return;
      const touch = event.changedTouches[0];
      const dx = touch.clientX - start.x;
      const dy = touch.clientY - start.y;
      if (Math.max(Math.abs(dx), Math.abs(dy)) < 42) return;
      const dominant = Math.abs(dx) > Math.abs(dy) ? dx : dy;
      go(dominant < 0 ? 1 : -1);
    },
    [go],
  );

  return (
    <Section ref={sectionRef} aria-label="Pack features, shown in the real app">
      <ShowcaseGrid>
        <Rail>
          <RailHeading>
            <RailTitle>{activeFeature.label}</RailTitle>
            <RailCaption>{activeFeature.caption}</RailCaption>
          </RailHeading>
          <RailList aria-label="Jump to a feature">
            {SHOWCASE_FEATURES.map((feature, index) => (
              <RailItem
                key={feature.id}
                type="button"
                $active={index === active}
                aria-current={index === active}
                onClick={() => setActive(index)}
              >
                <b>{feature.label}</b>
                <span>{feature.caption}</span>
              </RailItem>
            ))}
          </RailList>
        </Rail>
        <Stage>
          <AxisButton type="button" aria-label="Previous feature" onClick={() => go(-1)}>
            ‹
          </AxisButton>
          <DeckViewport onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
            {SHOWCASE_FEATURES.map((feature, index) => {
              let offset = index - active;
              if (offset > count / 2) offset -= count;
              if (offset < -count / 2) offset += count;
              return (
                <DeckCard key={feature.id} $offset={offset} id={`feature-${feature.id}`}>
                  <PhoneFrame>
                    {mediaAvailable && Math.abs(offset) <= 1 && (
                      <video
                        ref={el => {
                          videoRefs.current[feature.id] = el;
                        }}
                        src={`${MEDIA_BASE}/feature-${feature.id}.mp4`}
                        poster={`${MEDIA_BASE}/feature-${feature.id}-poster.jpg`}
                        muted
                        playsInline
                        preload={offset === 0 ? "auto" : "metadata"}
                        onTimeUpdate={
                          offset === 0
                            ? event => onTimeUpdate(event.currentTarget)
                            : undefined
                        }
                        onEnded={offset === 0 ? () => go(1) : undefined}
                      />
                    )}
                    {offset === 0 && mediaAvailable && (
                      <ClipProgress aria-hidden="true">
                        <ClipProgressFill ref={progressRef} />
                      </ClipProgress>
                    )}
                  </PhoneFrame>
                  <Caption $active={offset === 0}>
                    <b>{feature.label}</b>
                    {feature.caption}
                  </Caption>
                </DeckCard>
              );
            })}
          </DeckViewport>
          <AxisButton type="button" aria-label="Next feature" onClick={() => go(1)}>
            ›
          </AxisButton>
        </Stage>
      </ShowcaseGrid>
      <IndexRail aria-label="Jump to a feature">
        {SHOWCASE_FEATURES.map((feature, index) => (
          <IndexChip
            key={feature.id}
            type="button"
            $active={index === active}
            onClick={() => setActive(index)}
          >
            {feature.label}
          </IndexChip>
        ))}
      </IndexRail>
    </Section>
  );
}
