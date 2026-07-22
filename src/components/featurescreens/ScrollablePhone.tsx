import { useCallback, useRef } from "react";
import styled from "styled-components";
import { Menu } from "lucide-react";

/**
 * The interactive feature phone: a REAL app capture — a tall stitched
 * screenshot from the simulator (see the tall-scroll stitching recipe in the
 * capture pipeline) — inside a phone shell whose content actually scrolls.
 * Desktop scrolls with the wheel or a drag; mobile scrolls natively. The
 * captures are content-band only (fixed app chrome is cropped so seams can
 * stitch), so the shell paints the status bar and Pack header itself.
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

const StatusBar = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.9rem 1.35rem 0.2rem;
  color: #f5f1e8;
  font-size: 0.72rem;
  font-weight: 700;
  flex-shrink: 0;

  i {
    display: inline-block;
    background: #f5f1e8;
    border-radius: 2px;
    margin-left: 0.28rem;
  }
`;

const AppHeader = styled.div`
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  padding: 0.5rem 1.1rem 0.6rem;
  flex-shrink: 0;

  svg {
    width: 17px;
    height: 17px;
    color: #f5f1e8;
  }
`;

const Wordmark = styled.span`
  justify-self: center;
  color: #ff9800;
  font-weight: 800;
  font-size: 0.98rem;
  letter-spacing: -0.01em;
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
};

export default function ScrollablePhone({
  src,
  width,
  height,
  alt,
  eager,
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
      <StatusBar aria-hidden="true">
        <span>9:41</span>
        <span>
          <i style={{ width: 14, height: 4 }} />
          <i style={{ width: 8, height: 8, borderRadius: 4 }} />
          <i style={{ width: 16, height: 7, opacity: 0.85 }} />
        </span>
      </StatusBar>
      <AppHeader aria-hidden="true">
        <Menu />
        <Wordmark>Pack.</Wordmark>
        <span />
      </AppHeader>
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
