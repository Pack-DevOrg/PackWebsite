import { useEffect, useRef } from "react";
import type { ReactNode } from "react";
import styled, { css } from "styled-components";
import { ChevronLeft, ChevronRight } from "lucide-react";
import PrefetchLink from "./PrefetchLink";

/**
 * The app's CarouselTabs, translated for the web: an underline tab track
 * flush inside a hairline header band, flanked by the day-pager's bare
 * chevrons. Flat surfaces, no fills, no borders on the segments themselves —
 * the sliding saffron underline is the only accent, exactly like the app.
 *
 * One band, two modes with the identical look:
 * - state mode (pass `onSelect`): tabs are buttons driving in-page state —
 *   the features showcase deck.
 * - link mode (items carry `href`): tabs are real links — capability and
 *   guide pages share the band as their header, so every sibling page is one
 *   crawlable click away and the chevrons step through the family in order.
 */
export type CarouselTabItem = {
  readonly id: string;
  readonly label: string;
  readonly icon?: ReactNode;
  /** Link-mode destination; ignored when `onSelect` is provided. */
  readonly href?: string;
};

type CarouselTabBandProps = {
  readonly items: readonly CarouselTabItem[];
  readonly activeId: string;
  readonly ariaLabel: string;
  /** State mode: called with the tapped item's index instead of navigating. */
  readonly onSelect?: (index: number) => void;
};

const Band = styled.div`
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: stretch;
  gap: 0.25rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
`;

const Track = styled.nav`
  position: relative;
  display: flex;
  align-items: stretch;
  height: 42px;
  overflow-x: auto;
  scrollbar-width: none;
  -webkit-overflow-scrolling: touch;

  &::-webkit-scrollbar {
    display: none;
  }
`;

const segmentStyles = css<{ $active: boolean }>`
  flex: 1 0 auto;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 0 0.85rem;
  border: 0;
  background: transparent;
  color: ${({ $active }) =>
    $active ? "var(--color-text-primary)" : "var(--color-text-secondary)"};
  font: inherit;
  font-size: 0.86rem;
  font-weight: 600;
  white-space: nowrap;
  text-decoration: none;
  cursor: pointer;
  transition: color 160ms ease;

  svg {
    width: 14px;
    height: 14px;
  }

  &:hover {
    color: var(--color-text-primary);
  }
`;

const ButtonSegment = styled.button<{ $active: boolean }>`
  ${segmentStyles}
`;

const LinkSegment = styled(PrefetchLink)<{ $active: boolean }>`
  ${segmentStyles}
`;

const Underline = styled.span`
  position: absolute;
  left: 0;
  bottom: 0;
  height: 3px;
  border-radius: 1.5px;
  background: var(--color-accent);
  transition: transform 180ms ease, width 180ms ease;
  will-change: transform, width;
`;

const arrowStyles = css`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0 0.55rem;
  border: 0;
  background: transparent;
  color: var(--color-text-secondary);
  cursor: pointer;
  transition: color 160ms ease;

  svg {
    width: 18px;
    height: 18px;
  }

  &:hover {
    color: var(--color-accent);
  }
`;

const ArrowButton = styled.button`
  ${arrowStyles}
`;

const ArrowLink = styled(PrefetchLink)`
  ${arrowStyles}
`;

/* The underline stops short of the segment edges, like the app's 18px inset —
   scaled down when a segment is narrow so it never collapses to nothing. */
const underlineInset = (segmentWidth: number) => Math.min(18, segmentWidth * 0.18);

export default function CarouselTabBand({
  items,
  activeId,
  ariaLabel,
  onSelect,
}: CarouselTabBandProps) {
  const trackRef = useRef<HTMLElement | null>(null);
  const segmentRefs = useRef<Record<string, HTMLElement | null>>({});
  const underlineRef = useRef<HTMLSpanElement | null>(null);
  const settled = useRef(false);
  const count = items.length;
  const activeIndex = Math.max(
    0,
    items.findIndex((item) => item.id === activeId),
  );
  const linkMode = !onSelect;
  const prevItem = items[(activeIndex - 1 + count) % count];
  const nextItem = items[(activeIndex + 1) % count];

  // Slide the underline beneath the active segment and center it in the
  // scrollable track (measured, so it works for both the equal-width desktop
  // track and the scrolled mobile track). The first placement is instant —
  // a page just loaded — and every later change animates.
  useEffect(() => {
    const place = (animate: boolean) => {
      const segment = segmentRefs.current[activeId];
      const underline = underlineRef.current;
      const track = trackRef.current;
      if (!segment || !underline || !track) return;
      const inset = underlineInset(segment.offsetWidth);
      if (!animate) underline.style.transition = "none";
      underline.style.width = `${Math.max(0, segment.offsetWidth - inset * 2)}px`;
      underline.style.transform = `translateX(${segment.offsetLeft + inset}px)`;
      if (!animate) {
        void underline.offsetWidth; // flush so the next change animates
        underline.style.transition = "";
      }
      // Center the active segment without ever moving the page itself.
      const target = segment.offsetLeft - (track.clientWidth - segment.offsetWidth) / 2;
      track.scrollTo({ left: Math.max(0, target), behavior: animate ? "smooth" : "auto" });
    };
    place(settled.current);
    settled.current = true;
    const remeasure = () => place(false);
    window.addEventListener("resize", remeasure);
    // Web fonts land after first paint and shift segment widths; re-measure.
    document.fonts?.ready.then(remeasure).catch(() => {});
    return () => window.removeEventListener("resize", remeasure);
  }, [activeId]);

  return (
    <Band>
      {linkMode && prevItem?.href ? (
        <ArrowLink to={prevItem.href} aria-label={`Previous: ${prevItem.label}`}>
          <ChevronLeft aria-hidden="true" />
        </ArrowLink>
      ) : (
        <ArrowButton
          type="button"
          aria-label="Previous"
          onClick={() => onSelect?.((activeIndex - 1 + count) % count)}
        >
          <ChevronLeft aria-hidden="true" />
        </ArrowButton>
      )}
      <Track
        ref={trackRef}
        aria-label={ariaLabel}
        role={linkMode ? undefined : "tablist"}
      >
        {items.map((item, index) => {
          const active = item.id === activeId;
          const setRef = (el: HTMLElement | null) => {
            segmentRefs.current[item.id] = el;
          };
          return linkMode && item.href ? (
            <LinkSegment
              key={item.id}
              ref={setRef}
              to={item.href}
              $active={active}
              aria-current={active ? "page" : undefined}
            >
              {item.icon}
              {item.label}
            </LinkSegment>
          ) : (
            <ButtonSegment
              key={item.id}
              ref={setRef}
              type="button"
              role="tab"
              $active={active}
              aria-selected={active}
              onClick={() => onSelect?.(index)}
            >
              {item.icon}
              {item.label}
            </ButtonSegment>
          );
        })}
        <Underline ref={underlineRef} aria-hidden="true" />
      </Track>
      {linkMode && nextItem?.href ? (
        <ArrowLink to={nextItem.href} aria-label={`Next: ${nextItem.label}`}>
          <ChevronRight aria-hidden="true" />
        </ArrowLink>
      ) : (
        <ArrowButton
          type="button"
          aria-label="Next"
          onClick={() => onSelect?.((activeIndex + 1) % count)}
        >
          <ChevronRight aria-hidden="true" />
        </ArrowButton>
      )}
    </Band>
  );
}
