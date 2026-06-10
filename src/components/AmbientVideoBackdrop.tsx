import React, { useEffect, useState } from "react";
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
  opacity: 0.42;
  filter: saturate(0.82) brightness(0.82);
`;

/* Melts the footage into the page bg so copy stays the hero. */
const Scrim = styled.div`
  position: absolute;
  inset: 0;
  background:
    linear-gradient(90deg, rgba(8, 7, 6, 0.92) 0%, rgba(8, 7, 6, 0.55) 48%, rgba(8, 7, 6, 0.28) 100%),
    linear-gradient(180deg, rgba(8, 7, 6, 0.25) 0%, transparent 30%, rgba(8, 7, 6, 0.85) 100%);
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

  useEffect(() => {
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
      <Scrim />
    </Backdrop>
  );
};

export default AmbientVideoBackdrop;
