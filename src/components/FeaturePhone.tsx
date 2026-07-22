import { useCallback, useEffect, useRef, useState } from "react";
import styled from "styled-components";

/**
 * One phone playing one demo clip — the shared media element behind the
 * features deck and the capability landing pages. The recording is
 * interactive: drag horizontally to scrub anywhere in the clip, tap to
 * pause/resume. Clips + posters come from the demo pipeline:
 *   PackApp: node scripts/produce-demo-clips.mjs --export \
 *     ../PackWebsite/public/videos/features
 *
 * All editing lives at the video side (the pipeline bakes cuts, framerate,
 * and renditions into the files); this component only PICKS a file. Two
 * renditions ship per clip: the 750px master and a 540px `-small` for
 * mobile-width layouts and slow connections. Data Saver gets the poster and
 * downloads nothing until the visitor taps.
 */
export const FEATURE_MEDIA_BASE = "/videos/features";

const SMALL_LAYOUT_QUERY = "(max-width: 979px)";

type NetworkInformationLike = {
  readonly saveData?: boolean;
  readonly effectiveType?: string;
};

/**
 * Decided once per mount, before any media loads. Swapping src mid-play
 * resets the element, so this deliberately does not react to resizes.
 */
function pickDelivery(): {rendition: "" | "-small"; autoplay: boolean} {
  if (typeof window === "undefined") return {rendition: "", autoplay: true};
  const connection = (navigator as Navigator & {connection?: NetworkInformationLike})
    .connection;
  if (connection?.saveData) return {rendition: "-small", autoplay: false};
  const slow = connection?.effectiveType
    ? ["slow-2g", "2g", "3g"].includes(connection.effectiveType)
    : false;
  // A suspended/background document can report a zero-size viewport; treat
  // width as unknown there and keep the master rather than guessing small.
  const smallLayout =
    window.innerWidth > 0 && (window.matchMedia?.(SMALL_LAYOUT_QUERY).matches ?? false);
  return {rendition: slow || smallLayout ? "-small" : "", autoplay: true};
}

/**
 * HEAD-gate on the export manifest so SEO never depends on media assets.
 * Checks content-type, not just status: the SPA's 404 fallback answers any
 * missing path with index.html and HTTP 200, which would otherwise open the
 * gate and render broken players when the clips aren't deployed.
 */
export function useFeatureMediaAvailable(): boolean {
  const [available, setAvailable] = useState(false);
  useEffect(() => {
    let cancelled = false;
    fetch(`${FEATURE_MEDIA_BASE}/features.json`, { method: "HEAD" })
      .then((response) => {
        const isJson =
          response.headers.get("content-type")?.includes("json") ?? false;
        if (!cancelled && response.ok && isJson) setAvailable(true);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);
  return available;
}

const Frame = styled.div`
  width: 100%;
  aspect-ratio: 1206 / 2622;
  border-radius: 2.2rem;
  border: 1px solid rgba(243, 210, 122, 0.22);
  background: #000;
  overflow: hidden;
  position: relative;
  box-shadow:
    0 0 90px rgba(243, 210, 122, 0.1),
    0 24px 70px rgba(0, 0, 0, 0.55);
  cursor: grab;
  /* Horizontal drags scrub the clip; vertical stays with the page scroll. */
  touch-action: pan-y;
  user-select: none;

  &:active {
    cursor: grabbing;
  }

  video {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
    pointer-events: none;
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

type FeaturePhoneProps = {
  screenId: string;
  /** The active phone plays from the top; inactive ones pause. */
  active: boolean;
  /** Render the <video> at all — deck neighbors skip far-offset cards. */
  withVideo: boolean;
  loop?: boolean;
  preload?: "auto" | "metadata";
  onEnded?: () => void;
};

export default function FeaturePhone({
  screenId,
  active,
  withVideo,
  loop,
  preload = "metadata",
  onEnded,
}: FeaturePhoneProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const progressRef = useRef<HTMLDivElement | null>(null);
  const [delivery] = useState(pickDelivery);
  const drag = useRef<{
    startX: number;
    startTime: number;
    wasPlaying: boolean;
    moved: boolean;
  } | null>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    if (active && delivery.autoplay) {
      video.currentTime = 0;
      video.play().catch(() => {});
    } else {
      video.pause();
    }
    if (progressRef.current) progressRef.current.style.width = "0%";
  }, [active, delivery.autoplay, withVideo]);

  // Browsers pause offscreen autoplay video; resume when the visitor
  // returns to the tab so the tour never sits frozen.
  useEffect(() => {
    if (!active || !delivery.autoplay) return;
    const onVisible = () => {
      if (document.visibilityState !== "visible") return;
      videoRef.current?.play().catch(() => {});
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [active]);

  const onTimeUpdate = useCallback(() => {
    const video = videoRef.current;
    if (!progressRef.current || !video?.duration) return;
    progressRef.current.style.width = `${(video.currentTime / video.duration) * 100}%`;
  }, []);

  const onPointerDown = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    const video = videoRef.current;
    if (!video || !video.duration) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    drag.current = {
      startX: event.clientX,
      startTime: video.currentTime,
      wasPlaying: !video.paused,
      moved: false,
    };
  }, []);

  const onPointerMove = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    const video = videoRef.current;
    const state = drag.current;
    if (!video || !state) return;
    const dx = event.clientX - state.startX;
    if (!state.moved && Math.abs(dx) < 5) return;
    if (!state.moved) {
      state.moved = true;
      video.pause();
    }
    const width = event.currentTarget.clientWidth || 1;
    // One frame-width of drag sweeps the whole clip; stop shy of the end so
    // scrubbing never fires onEnded and yanks the deck forward.
    const target = state.startTime + (dx / width) * video.duration;
    video.currentTime = Math.min(Math.max(target, 0), video.duration - 0.05);
    onTimeUpdate();
  }, [onTimeUpdate]);

  const onPointerUp = useCallback(() => {
    const video = videoRef.current;
    const state = drag.current;
    drag.current = null;
    if (!video || !state) return;
    if (!state.moved) {
      // A plain tap toggles the recording.
      if (video.paused) video.play().catch(() => {});
      else video.pause();
    } else if (state.wasPlaying) {
      video.play().catch(() => {});
    }
  }, []);

  return (
    <Frame
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      title="Drag to scrub the recording; tap to pause"
    >
      {withVideo && (
        <video
          ref={videoRef}
          src={`${FEATURE_MEDIA_BASE}/feature-${screenId}${delivery.rendition}.mp4`}
          poster={`${FEATURE_MEDIA_BASE}/feature-${screenId}-poster.jpg`}
          muted
          playsInline
          loop={loop}
          preload={delivery.autoplay ? preload : "none"}
          onTimeUpdate={active ? onTimeUpdate : undefined}
          onEnded={active ? onEnded : undefined}
        />
      )}
      {active && withVideo && (
        <ClipProgress aria-hidden="true">
          <ClipProgressFill ref={progressRef} />
        </ClipProgress>
      )}
    </Frame>
  );
}
