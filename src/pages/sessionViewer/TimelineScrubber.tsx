import styled from "styled-components";

import type { TimelineFrame, TimelineIndex } from "./sessionFrames";

export const SCRUB_COPY = {
  label: "Scrub through what Pack did",
  live: "Back to live",
  replay: "Replay",
} as const;

const Wrap = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  width: 100%;
  padding: 0.5rem 0.75rem;
  box-sizing: border-box;
`;

const Row = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
`;

const TrackButton = styled.button<{ $active: boolean }>`
  padding: 0.25rem 0.6rem;
  border: 1px solid ${({ theme }) => theme.colors.primary.main};
  border-radius: 0.4rem;
  background: ${({ $active, theme }) => ($active ? theme.colors.primary.main : "transparent")};
  color: ${({ $active, theme }) => ($active ? theme.colors.background.primary : theme.colors.text.primary)};
  font-size: 0.875rem;
  cursor: pointer;
`;

const Slider = styled.input`
  flex: 1;
  min-width: 8rem;
`;

const Caption = styled.p`
  margin: 0;
  color: ${({ theme }) => theme.colors.text.secondary};
  font-size: 0.875rem;
`;

export function framesOfTrack(index: TimelineIndex, trackId: string): TimelineFrame[] {
  return index.frames.filter((frame) => frame.trackId === trackId);
}

function clock(ts: number): string {
  return new Date(ts).toLocaleTimeString();
}

/** One slider per track: tracks are separate pages or tabs, never one mixed stream. */
export function TimelineScrubber({
  index,
  trackId,
  position,
  scrubbing,
  onTrack,
  onPosition,
  onLive,
}: {
  readonly index: TimelineIndex;
  readonly trackId: string;
  /** 0-based position within the track's frames. */
  readonly position: number;
  readonly scrubbing: boolean;
  readonly onTrack: (trackId: string) => void;
  readonly onPosition: (position: number) => void;
  readonly onLive: () => void;
}) {
  const frames = framesOfTrack(index, trackId);
  if (frames.length === 0) {
    return null;
  }
  const at = Math.min(Math.max(position, 0), frames.length - 1);
  const frame = frames[at];
  return (
    <Wrap data-testid="timeline-scrubber">
      {index.tracks.length > 1 ? (
        <Row role="tablist">
          {index.tracks.map((track) => (
            <TrackButton
              key={track.trackId}
              role="tab"
              aria-selected={track.trackId === trackId}
              $active={track.trackId === trackId}
              type="button"
              onClick={() => onTrack(track.trackId)}
            >
              {track.label}
            </TrackButton>
          ))}
        </Row>
      ) : null}
      <Row>
        <Slider
          type="range"
          aria-label={SCRUB_COPY.label}
          min={0}
          max={frames.length - 1}
          value={at}
          onChange={(event) => onPosition(Number(event.target.value))}
        />
        {scrubbing ? (
          <TrackButton type="button" $active={false} onClick={onLive}>
            {index.ended ? SCRUB_COPY.replay : SCRUB_COPY.live}
          </TrackButton>
        ) : null}
      </Row>
      <Caption>
        {frame.host} · step {frame.stepId} · {clock(frame.ts)}
      </Caption>
    </Wrap>
  );
}
