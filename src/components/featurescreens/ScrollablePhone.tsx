import { useCallback, useRef } from "react";
import styled from "styled-components";

/**
 * The interactive feature phone: a REAL app capture — a tall stitched
 * screenshot from the simulator (see the tall-scroll stitching recipe in the
 * capture pipeline) — inside a phone shell whose content actually scrolls.
 * Desktop scrolls with the wheel or a drag; mobile scrolls natively. The
 * captures are content-band only (fixed app chrome is cropped so seams can
 * stitch); the fixed header is that SCREEN'S own real header, cropped from
 * the same screenshot at exactly the row the capture starts, so shell and
 * content are continuous pixels. Full-bleed single-screen captures carry
 * their chrome inside the capture and pass no header.
 */
const Frame = styled.div`
  width: 100%;
  aspect-ratio: 1206 / 2622;
  border-radius: 2.2rem;
  border: 1px solid rgba(243, 210, 122, 0.22);
  background: #0b0b0b;
  overflow: hidden;
  position: relative;
  display: flex;
  flex-direction: column;
  box-shadow:
    0 0 90px rgba(243, 210, 122, 0.1),
    0 24px 70px rgba(0, 0, 0, 0.55);
`;

const HeaderImage = styled.img<{ $aspectRatio: number }>`
  display: block;
  width: 100%;
  height: auto;
  aspect-ratio: ${({ $aspectRatio }) => $aspectRatio};
  flex-shrink: 0;
  user-select: none;
  pointer-events: none;
  /* Overlap the capture by 1px: fractional image heights otherwise leave a
     sub-pixel gap where the frame background reads as a dark bar. The strip's
     bottom rows and the capture's top rows are the same pixels, so the
     overlap is invisible. */
  margin-bottom: -1px;
  position: relative;
  z-index: 1;
`;

const ScrollViewport = styled.div`
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  overflow-x: hidden;
  cursor: grab;
  scrollbar-width: none;
  -webkit-overflow-scrolling: touch;
  touch-action: pan-y;
  overscroll-behavior: contain;

  &:active {
    cursor: grabbing;
  }

  &::-webkit-scrollbar {
    display: none;
  }
`;

const CaptureImage = styled.img<{ $aspectRatio: number }>`
  display: block;
  width: 100%;
  height: auto;
  aspect-ratio: ${({ $aspectRatio }) => $aspectRatio};
  user-select: none;
  pointer-events: none;
`;

type ScrollablePhoneProps = {
  /** Tall stitched capture of the real screen. */
  readonly src: string;
  readonly width: number;
  readonly height: number;
  readonly alt: string;
  readonly eager?: boolean;
  /** This screen's own fixed header strip; omit for full-bleed captures. */
  readonly headerSrc?: string;
  readonly headerHeight?: number;
};

export default function ScrollablePhone({
  src,
  width,
  height,
  alt,
  eager,
  headerSrc,
  headerHeight,
}: ScrollablePhoneProps) {
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const drag = useRef<{ pointerId: number; lastY: number } | null>(null);

  // Mouse users get drag-to-scroll on top of the native wheel; touch users
  // scroll natively (touch-action: pan-y), so only mouse pointers drag.
  const onPointerDown = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    if (event.pointerType !== "mouse") return;
    drag.current = { pointerId: event.pointerId, lastY: event.clientY };
    event.currentTarget.setPointerCapture(event.pointerId);
  }, []);

  const onPointerMove = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    const state = drag.current;
    const viewport = viewportRef.current;
    if (!state || !viewport || state.pointerId !== event.pointerId) return;
    viewport.scrollTop -= event.clientY - state.lastY;
    state.lastY = event.clientY;
  }, []);

  const onPointerUp = useCallback(() => {
    drag.current = null;
  }, []);

  return (
    <Frame>
      {headerSrc && headerHeight ? (
        <HeaderImage
          src={headerSrc}
          $aspectRatio={width / headerHeight}
          alt=""
          aria-hidden="true"
          draggable={false}
          loading={eager ? "eager" : "lazy"}
          decoding="async"
        />
      ) : null}
      <ScrollViewport
        ref={viewportRef}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        title="Scroll to explore the real screen"
      >
        <CaptureImage
          src={src}
          $aspectRatio={width / height}
          alt={alt}
          loading={eager ? "eager" : "lazy"}
          decoding="async"
          draggable={false}
        />
      </ScrollViewport>
    </Frame>
  );
}
