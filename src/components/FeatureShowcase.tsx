import { useCallback, useEffect, useRef, useState } from "react";
import styled from "styled-components";

/**
 * The interactive features section, styled after the app's Upcoming day deck:
 * ONE stage, the real-app capture as the hero, stacked cards peeking above
 * and below, chevrons + arrow keys + swipe on both axes, and a compact index
 * rail. Visual-first: one short label and a one-line caption per feature —
 * the video does the talking. Clips + posters come from the demo pipeline:
 *   PackApp: node scripts/produce-demo-clips.mjs --export \
 *     ../PackWebsite/public/videos/features
 */
const MEDIA_BASE = "/videos/features";

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
`;

const DeckViewport = styled.div`
  position: relative;
  height: min(82vh, 46rem);
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

  video {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
`;

const Caption = styled.figcaption`
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
`;

const IndexRail = styled.nav`
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 0.35rem;
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
  const touchStart = useRef<{ x: number; y: number } | null>(null);
  const count = SHOWCASE_FEATURES.length;

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

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
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
        video.play().catch(() => {});
      } else {
        video.pause();
      }
    });
  }, [active, mediaAvailable]);

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
    <Section aria-label="Pack features, shown in the real app">
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
                      loop
                      playsInline
                      preload={offset === 0 ? "auto" : "metadata"}
                    />
                  )}
                </PhoneFrame>
                <Caption>
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
