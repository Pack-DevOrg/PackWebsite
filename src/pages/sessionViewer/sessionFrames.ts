import { z } from "zod";

import { ApiRequestError, type ApiClient } from "../../api/client";

/** One batch from GET /live-view/{jobId}/view: masked JPEG frames from the private browser. */
const BatchSchema = z.object({
  frames: z
    .array(z.object({ capturedAtMs: z.number(), jpegBase64: z.string().min(1) }))
    .min(1),
  viewport: z.object({ width: z.number().positive(), height: z.number().positive() }),
  masked: z.literal(true),
  batchMs: z.number().nonnegative(),
});
export type FrameBatch = z.infer<typeof BatchSchema>;

const EnvelopeSchema = z.object({ success: z.literal(true), data: z.unknown() });

/** The API answers `{success, data}`; a bare body is accepted for older fixtures. */
export function frameBatchBecauseBody(body: unknown): FrameBatch | null {
  const envelope = EnvelopeSchema.safeParse(body);
  const parsed = BatchSchema.safeParse(envelope.success ? envelope.data.data : body);
  return parsed.success ? parsed.data : null;
}

export type TouchEvent =
  | { type: "pointer"; action: "tap"; x: number; y: number }
  | { type: "pointer"; action: "scroll"; x: number; y: number; dy: number }
  | { type: "key"; text?: string; key?: "Enter" | "Backspace" | "Tab" };

export type FetchFrameBatch = (signal: AbortSignal) => Promise<FrameBatch | null>;
export type SendTouch = (event: TouchEvent) => Promise<void>;

export const FRAMES_PER_BATCH = 4;
export const FRAME_GAP_MS = 120;

export function fetchFrameBatchBecauseApiClient(client: ApiClient, jobId: string): FetchFrameBatch {
  const path = `/live-view/${encodeURIComponent(jobId)}/view?n=${FRAMES_PER_BATCH}&gapMs=${FRAME_GAP_MS}`;
  return async (signal) => frameBatchBecauseBody(await client.request<unknown>({ path, method: "GET", signal }));
}

export function sendTouchBecauseApiClient(client: ApiClient, jobId: string): SendTouch {
  const path = `/live-view/${encodeURIComponent(jobId)}/hitl`;
  return async (event) => {
    await client.request<unknown, TouchEvent>({ path, method: "POST", body: event });
  };
}

/** The per-job frame timeline: masked frames, one track per page or tab. */
const TimelineIndexSchema = z.object({
  version: z.literal(1),
  jobId: z.string(),
  ended: z.boolean(),
  tracks: z.array(z.object({ trackId: z.string(), label: z.string(), firstTs: z.number(), frames: z.number() })),
  frames: z.array(
    z.object({
      trackId: z.string(),
      seq: z.number(),
      ts: z.number(),
      host: z.string(),
      stepId: z.string(),
      bytes: z.number(),
    }),
  ),
});
export type TimelineIndex = z.infer<typeof TimelineIndexSchema>;
export type TimelineFrame = TimelineIndex["frames"][number];

export function timelineIndexBecauseBody(body: unknown): TimelineIndex | null {
  const envelope = EnvelopeSchema.safeParse(body);
  const parsed = TimelineIndexSchema.safeParse(envelope.success ? envelope.data.data : body);
  return parsed.success ? parsed.data : null;
}

export type FetchTimelineIndex = (signal: AbortSignal) => Promise<TimelineIndex | null>;
/** The frame as a data: URL. */
export type FetchTimelineFrame = (trackId: string, seq: number, signal: AbortSignal) => Promise<string | null>;

export function fetchTimelineIndexBecauseApiClient(client: ApiClient, jobId: string): FetchTimelineIndex {
  const path = `/live-view/${encodeURIComponent(jobId)}/timeline`;
  return async (signal) => {
    try {
      return timelineIndexBecauseBody(await client.request<unknown>({ path, method: "GET", signal }));
    } catch (error) {
      if (error instanceof ApiRequestError && error.status === 404) {
        return null;
      }
      throw error;
    }
  };
}

export function fetchTimelineFrameBecauseApiClient(client: ApiClient, jobId: string): FetchTimelineFrame {
  return async (trackId, seq, signal) => {
    const path = `/live-view/${encodeURIComponent(jobId)}/timeline/${encodeURIComponent(trackId)}/${seq}`;
    const body = await client.request<unknown>({ path, method: "GET", signal });
    const envelope = EnvelopeSchema.safeParse(body);
    const data = envelope.success ? envelope.data.data : body;
    const url = (data as { url?: unknown } | null)?.url;
    return typeof url === "string" && url.startsWith("data:image/jpeg;base64,") ? url : null;
  };
}
