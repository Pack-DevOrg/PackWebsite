import { useLayoutEffect, useRef, useState } from "react";
import styled from "styled-components";
import { useI18n } from "@/i18n/I18nProvider";
import AccentWord from "./AccentWord";

/**
 * Plays a short film of the real app planning a trip.
 *
 * The section renders nothing until the film exists, so it is safe to ship
 * ahead of the asset. To light it up, drop two files into `public/videos/`:
 *   - `product-film.mp4`         (H.264, ~15-30s, screen capture of the real app)
 *   - `product-film-poster.webp` (first-frame poster, same aspect ratio)
 * Capture path: QuickTime/simulator recording of PackApp with seeded trip
 * data, trimmed and exported at 2x device resolution.
 */
const FILM_SRC = "/videos/product-film.mp4";
const FILM_POSTER = "/videos/product-film-poster.webp";

const Section = styled.section`
  width: 100%;
  display: flex;
  justify-content: center;
  padding: clamp(1.75rem, 4.5vw, 3.75rem) 0;
  position: relative;

  &::before {
    content: "";
    position: absolute;
    inset: 0;
    border-top: 1px solid rgba(243, 210, 122, 0.08);
    opacity: 0.7;
    pointer-events: none;
  }
`;

const SectionContent = styled.div`
  width: 100%;
  max-width: min(1100px, 100%);
  display: grid;
  gap: 1.5rem;
  justify-items: center;
  text-align: center;
`;

const Eyebrow = styled.p`
  margin: 0;
  color: var(--color-accent);
  font-size: 0.78rem;
  font-weight: 600;
  letter-spacing: 0.16em;
  text-transform: uppercase;
`;

const Title = styled.h2`
  margin: 0;
  font-size: clamp(2rem, 4vw, 3.2rem);
  font-weight: 800;
`;

const FilmFrame = styled.div`
  width: min(100%, 60rem);
  border-radius: 1.8rem;
  border: 1px solid rgba(243, 210, 122, 0.14);
  background: rgba(10, 9, 8, 0.6);
  box-shadow: var(--shadow-elevated);
  overflow: hidden;

  video {
    display: block;
    width: 100%;
    height: auto;
  }
`;

const filmContent = {
  en: {
    eyebrow: "See it in action",
    titlePrefix: "Watch Pack plan a ",
    accent: "real trip",
    ariaLabel: "Short film of Pack planning a trip",
  },
  es: {
    eyebrow: "Míralo en acción",
    titlePrefix: "Mira a Pack planear un ",
    accent: "viaje real",
    ariaLabel: "Video corto de Pack planeando un viaje",
  },
} as const;

const ProductFilmSection = () => {
  const { locale } = useI18n();
  const [filmAvailable, setFilmAvailable] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const content = filmContent[locale === "es" ? "es" : "en"];

  useLayoutEffect(() => {
    let cancelled = false;
    fetch(FILM_SRC, { method: "GET", headers: { Range: "bytes=0-0" } })
      .then((response) => {
        const contentType = response.headers.get("content-type") ?? "";
        void response.body?.cancel();
        // SPA hosting returns index.html (200) for missing files; require a
        // real video content type before showing the section.
        if (!cancelled && response.ok && contentType.startsWith("video/")) {
          setFilmAvailable(true);
        }
      })
      .catch(() => {
        // Missing film: section stays hidden.
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useLayoutEffect(() => {
    if (!filmAvailable) {
      return;
    }
    const video = videoRef.current;
    if (!video) {
      return;
    }
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (!reduceMotion.matches) {
      video.play().catch(() => {
        // Autoplay blocked: controls remain available.
      });
    }
  }, [filmAvailable]);

  if (!filmAvailable) {
    return null;
  }

  return (
    <Section>
      <SectionContent>
        <div>
          <Eyebrow>{content.eyebrow}</Eyebrow>
          <Title>
            {content.titlePrefix}
            <AccentWord>{content.accent}</AccentWord>.
          </Title>
        </div>
        <FilmFrame>
          <video
            ref={videoRef}
            src={FILM_SRC}
            poster={FILM_POSTER}
            muted
            loop
            playsInline
            controls
            preload="metadata"
            aria-label={content.ariaLabel}
          />
        </FilmFrame>
      </SectionContent>
    </Section>
  );
};

export default ProductFilmSection;
