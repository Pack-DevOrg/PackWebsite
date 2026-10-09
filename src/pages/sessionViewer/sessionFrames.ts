import { z } from "zod";

import type { ApiClient } from "../../api/client";

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
