import React, { useLayoutEffect, useState } from "react";
import styled, { keyframes } from "styled-components";

const Backdrop = styled.div`
  position: absolute;
  inset: 0;
  z-index: -1;
  border-radius: inherit;
  overflow: hidden;
  pointer-events: none;
`;

const Video = styled.video`
  width: 100%;
  height: 100%;
  object-fit: cover;
  /* Bias the cover crop toward the lower band — the subject sits low in the
     hero-ambient footage; the sky band is expendable. */
  object-position: 50% 72%;
  opacity: 0.78;
  /* Soft-focus treatment: the gentle blur (with a scale to hide its edge
     halo) and crushed shadows make upscaling softness read as intentional
     depth-of-field instead of low bitrate. */
  transform: scale(1.06);
  filter: saturate(1.05) brightness(0.84) contrast(1.07) blur(2.2px);
`;

/* Frost veil — a faint milky warm-white haze over the blurred footage, so the
   treatment reads as frosted glass rather than an out-of-focus video. */
const Frost = styled.div`
  position: absolute;
  inset: 0;
  background:
    linear-gradient(180deg, rgba(255, 248, 236, 0.07) 0%, rgba(255, 248, 236, 0.035) 45%, rgba(255, 248, 236, 0.015) 100%);
`;

/* Animated film grain over the footage — moving grain masks banding and
   compression softness far better than a static texture (a still grain pane
   reads as dirt). Same feTurbulence tile as Layout's GrainOverlay. */
const grainShift = keyframes`
  0% { transform: translate(0, 0); }
  25% { transform: translate(-4%, 3%); }
  50% { transform: translate(3%, -4%); }
  75% { transform: translate(-3%, -2%); }
  100% { transform: translate(4%, 2%); }
`;

const Grain = styled.div`
  position: absolute;
  inset: -6%;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='180' height='180'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='180' height='180' filter='url(%23n)'/%3E%3C/svg%3E");
  opacity: 0.11;
  mix-blend-mode: overlay;
  animation: ${grainShift} 0.9s steps(5) infinite;

  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
`;

/* Light legibility wash — the footage carries the emotion; only the frame
   edges melt into the page bg. */
const Scrim = styled.div`
  position: absolute;
  inset: 0;
  background:
    radial-gradient(120% 95% at 50% 42%, transparent 52%, rgba(8, 7, 6, 0.6) 100%),
    linear-gradient(90deg, rgba(8, 7, 6, 0.64) 0%, rgba(8, 7, 6, 0.36) 42%, rgba(8, 7, 6, 0.16) 100%),
    linear-gradient(180deg, rgba(8, 7, 6, 0.2) 0%, transparent 26%, rgba(8, 7, 6, 0.34) 64%, rgba(8, 7, 6, 0.9) 100%);
`;

interface AmbientVideoBackdropProps {
  readonly src?: string;
  readonly poster?: string;
}

/**
 * Zero-footprint ambient background video. Renders nothing until the asset
 * exists at `src` (HEAD probe — the SPA fallback returns index.html with a
 * 200, so the content-type must actually be video/*). Honors reduced motion.
 */
const AmbientVideoBackdrop: React.FC<AmbientVideoBackdropProps> = ({
  src = "/videos/hero-ambient.mp4",
  poster = "/videos/hero-ambient-poster.webp",
}) => {
  const [isAvailable, setIsAvailable] = useState(false);
  const [allowsMotion, setAllowsMotion] = useState(true);

  useLayoutEffect(() => {
    if (typeof window === "undefined" || typeof fetch !== "function") {
      return undefined;
    }

    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    setAllowsMotion(!motionQuery.matches);
    const onMotionChange = (event: MediaQueryListEvent) => {
      setAllowsMotion(!event.matches);
    };
    motionQuery.addEventListener("change", onMotionChange);

    let isCancelled = false;
    // Ranged GET, not HEAD: vite's dev middleware lets HEAD fall through to
    // the SPA fallback, which would mask the asset behind text/html.
    fetch(src, { method: "GET", headers: { Range: "bytes=0-0" } })
      .then((response) => {
        const contentType = response.headers.get("content-type") ?? "";
        void response.body?.cancel();
        if (!isCancelled && response.ok && contentType.startsWith("video/")) {
          setIsAvailable(true);
        }
      })
      .catch(() => {
        /* asset absent — render nothing */
      });

    return () => {
      isCancelled = true;
      motionQuery.removeEventListener("change", onMotionChange);
    };
  }, [src]);

  if (!isAvailable || !allowsMotion) {
    return null;
  }

  return (
    <Backdrop aria-hidden="true">
      <Video autoPlay muted loop playsInline preload="metadata" poster={poster}>
        <source src={src} type="video/mp4" />
      </Video>
      <Frost />
      <Grain />
      <Scrim />
    </Backdrop>
  );
};

export default AmbientVideoBackdrop;
