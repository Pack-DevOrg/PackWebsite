import { useCallback, useEffect, useRef, useState } from "react";
import styled from "styled-components";

import type { FetchFrameBatch, FrameBatch, SendTouch } from "./sessionFrames";

export const STALE_AFTER_MS = 5000;
const LOST_AFTER_FAILURES = 3;
const RETRY_DELAY_MS = 1000;
export const VIEWER_COPY = {
  stale: "Waiting for a fresh picture",
  lost: "Lost the connection to Pack's browser. Retrying.",
  type: "Type into the page",
  send: "Send",
  done: "Done, keep going",
} as const;

export type ViewerHealth = "live" | "stale" | "lost";
export type ViewerStats = { framesPerSecond: number; batchMs: number };

const Stage = styled.div`
  position: relative;
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  background: ${({ theme }) => theme.colors.background.secondary};
`;

const Picture = styled.img`
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
  touch-action: manipulation;
  cursor: pointer;
`;

const Badge = styled.p`
  position: absolute;
  top: 0.75rem;
  left: 0.75rem;
  margin: 0;
  padding: 0.35rem 0.65rem;
  border-radius: 0.35rem;
  background: ${({ theme }) => theme.colors.error.dark};
  color: ${({ theme }) => theme.colors.text.white};
  font-size: 0.875rem;
`;

const Bar = styled.form`
  display: flex;
  gap: 0.5rem;
  width: 100%;
  padding: 0.75rem;
  box-sizing: border-box;
`;

const TextField = styled.input`
  flex: 1;
  min-width: 0;
  padding: 0.6rem;
  font-size: 1rem;
`;

const Button = styled.button`
  padding: 0.6rem 1.1rem;
  border: 0;
  border-radius: 0.4rem;
  background: ${({ theme }) => theme.colors.primary.main};
  color: ${({ theme }) => theme.colors.background.primary};
  font-size: 1rem;
  cursor: pointer;
`;

function sleep(ms: number, signal: AbortSignal): Promise<void> {
  return new Promise((resolve) => {
    const timer = setTimeout(resolve, ms);
    signal.addEventListener("abort", () => {
      clearTimeout(timer);
      resolve();
    });
  });
}

/** Plays each batch at the spacing it was captured, then asks for the next one. */
export function SessionViewer({
  fetchBatch,
  sendTouch,
  onDone,
  doneBusy,
  onStats,
}: {
  readonly fetchBatch: FetchFrameBatch;
  readonly sendTouch: SendTouch;
  readonly onDone: () => void;
  readonly doneBusy: boolean;
  readonly onStats?: (stats: ViewerStats) => void;
}) {
  const [src, setSrc] = useState<string | null>(null);
  const [health, setHealth] = useState<ViewerHealth>("live");
  const [text, setText] = useState("");
  const lastFrameAt = useRef(Date.now());

  useEffect(() => {
    const abort = new AbortController();
    let failures = 0;
    const play = async (batch: FrameBatch): Promise<void> => {
      const first = batch.frames[0].capturedAtMs;
      const startedAt = Date.now();
      for (const frame of batch.frames) {
        const wait = frame.capturedAtMs - first - (Date.now() - startedAt);
        // Sequential on purpose: frames play in capture order.
         
        if (wait > 0) await sleep(wait, abort.signal);
        if (abort.signal.aborted) return;
        setSrc(`data:image/jpeg;base64,${frame.jpegBase64}`);
        lastFrameAt.current = Date.now();
      }
    };
    const loop = async (): Promise<void> => {
      while (!abort.signal.aborted) {
        const asked = Date.now();
        try {
           
          const batch = await fetchBatch(abort.signal);
          if (abort.signal.aborted) return;
          if (batch === null) throw new Error("no frames");
          failures = 0;
          setHealth("live");
          onStats?.({
            framesPerSecond: batch.frames.length / Math.max((Date.now() - asked) / 1000, 0.001),
            batchMs: batch.batchMs,
          });
           
          await play(batch);
        } catch {
          if (abort.signal.aborted) return;
          failures += 1;
          if (failures >= LOST_AFTER_FAILURES) setHealth("lost");
           
          await sleep(RETRY_DELAY_MS, abort.signal);
        }
      }
    };
    void loop();
    const watchdog = setInterval(() => {
      if (Date.now() - lastFrameAt.current > STALE_AFTER_MS) {
        setHealth((current) => (current === "lost" ? current : "stale"));
      }
    }, 1000);
    return () => {
      abort.abort();
      clearInterval(watchdog);
    };
  }, [fetchBatch, onStats]);

  const onPicture = useCallback(
    (event: React.MouseEvent<HTMLImageElement>) => {
      const box = event.currentTarget.getBoundingClientRect();
      if (box.width <= 0 || box.height <= 0) return;
      const x = Math.min(Math.max((event.clientX - box.left) / box.width, 0), 1);
      const y = Math.min(Math.max((event.clientY - box.top) / box.height, 0), 1);
      void sendTouch({ type: "pointer", action: "tap", x, y }).catch(() => setHealth("lost"));
    },
    [sendTouch],
  );

  const submitText = (event: React.FormEvent) => {
    event.preventDefault();
    if (text.length === 0) return;
    const typed = text;
    setText("");
    void sendTouch({ type: "key", text: typed }).catch(() => setHealth("lost"));
  };

  return (
    <>
      <Stage data-testid="session-viewer" data-health={health}>
        {src !== null ? <Picture alt="Pack's browser" src={src} onClick={onPicture} /> : null}
        {health !== "live" ? (
          <Badge role="status">{health === "lost" ? VIEWER_COPY.lost : VIEWER_COPY.stale}</Badge>
        ) : null}
      </Stage>
      <Bar onSubmit={submitText}>
        <TextField
          aria-label={VIEWER_COPY.type}
          placeholder={VIEWER_COPY.type}
          value={text}
          onChange={(event) => setText(event.target.value)}
        />
        <Button type="submit">{VIEWER_COPY.send}</Button>
        <Button type="button" onClick={onDone} disabled={doneBusy}>
          {VIEWER_COPY.done}
        </Button>
      </Bar>
    </>
  );
}
