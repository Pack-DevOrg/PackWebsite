import React, { useLayoutEffect, useState } from "react";
import styled from "styled-components";

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
  /* The soft-focus look (blur, crushed shadows, living grain) is BAKED into
     the mp4 by the encode pipeline. Do not add CSS filter/mix-blend layers on
     this element — any per-frame filter or blend breaks the browser's
     hardware video path and stutters at 60fps. */
`;

/* Frost veil — a faint milky warm-white haze over the blurred footage, so the
   treatment reads as frosted glass rather than an out-of-focus video. A plain
   translucent gradient: no backdrop-filter, no blend mode, so it composites
   for free above the hardware video layer. */
const Frost = styled.div`
  position: absolute;
  inset: 0;
  background:
    linear-gradient(180deg, rgba(255, 248, 236, 0.07) 0%, rgba(255, 248, 236, 0.035) 45%, rgba(255, 248, 236, 0.015) 100%);
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
      <Scrim />
    </Backdrop>
  );
};

export default AmbientVideoBackdrop;
