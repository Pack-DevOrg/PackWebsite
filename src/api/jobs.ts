import { z } from "zod";
import { StandardApiResponseSchema } from "@/schemas/common";
import {
  DiscoveryLogEntrySchema,
  JobStatusResponseSchema,
  TravelJobListDataSchema,
  TravelJobResultSchema,
} from "@/schemas/jobs";
import { ApiRequestError, type ApiClient } from "./client";

const ProgressItemSchema = z.object({
  id: z.string(),
  label: z.string(),
  status: z.enum(["pending", "processing", "completed", "failed"]),
  order: z.number().int().nonnegative(),
  progress: z.number().min(0).max(100).optional(),
  error: z.string().optional(),
});

const JobSubmissionDataSchema = z.object({
  jobId: z.string(),
  jobType: z.string().optional(),
  estimatedDuration: z.number().optional(),
  progressItems: z.array(ProgressItemSchema).optional(),
  status: z.enum(["queued", "processing", "completed", "failed", "cancelled"]).optional(),
});

export type JobSubmission = z.infer<typeof JobSubmissionDataSchema>;
export type JobStatus = z.infer<typeof JobStatusResponseSchema>;
export type TravelJobResult = z.infer<typeof TravelJobResultSchema>;

export interface SubmitTravelPlanningPayload {
  readonly message: string;
  readonly conversationId: string;
  readonly sessionId?: string;
  readonly context?: Record<string, unknown>;
  readonly attachments?: Array<{
    readonly data: string;
    readonly mimeType: string;
    readonly filename?: string;
  }>;
}

const parseStandard = (payload: unknown) => StandardApiResponseSchema.safeParse(payload);

const parseData = <T>(
  payload: unknown,
  schema: z.ZodTypeAny,
  label: string
): T => {
  const standard = parseStandard(payload);
  if (standard.success && standard.data.success) {
    const data = standard.data.data ?? null;
    if (data === null) {
      throw new ApiRequestError(500, `Missing data while performing ${label}`);
    }
    const parsed = schema.safeParse(data);
    if (parsed.success) {
      return parsed.data as T;
    }
    throw new ApiRequestError(
      500,
      "Unexpected response format from server.",
      parsed.error.issues
    );
  }

  // Fallback: backend returned raw object without StandardApiResponse wrapper
  const fallback = schema.safeParse(payload);
  if (fallback.success) {
    return fallback.data as T;
  }

  const message =
    (standard.success && standard.data.error?.message) ||
    (standard.success && (standard.data.error as unknown as string)) ||
    "Unexpected response format from server.";
  throw new ApiRequestError(500, message ?? `Request failed while performing ${label}`, payload);
};

export const submitTravelPlanningJob = async (
  client: ApiClient,
  payload: SubmitTravelPlanningPayload
): Promise<JobSubmission> => {
  // Browser clients require strict CORS preflight compatibility.
  // Prefer /messages/submit first (web-safe), then fallback to /messages/route
  // for environments where only route exists.
  const trySubmit = async (path: string) =>
    client.request<unknown, SubmitTravelPlanningPayload>({
      path,
      method: "POST",
      body: payload,
    });

  const isBrowser = typeof window !== "undefined";
  const primaryPath = isBrowser ? "/messages/submit" : "/messages/route";
  const fallbackPath = isBrowser ? "/messages/route" : "/messages/submit";

  try {
    const response = await trySubmit(primaryPath);
    const data = parseData<JobSubmission>(
      response,
      JobSubmissionDataSchema,
      "travel planning job submission"
    );
    return data;
  } catch (error) {
    if (
      error instanceof ApiRequestError &&
      (error.status === 404 || error.status === 405)
    ) {
      const response = await trySubmit(fallbackPath);
      const data = parseData<JobSubmission>(
        response,
        JobSubmissionDataSchema,
        "travel planning job submission"
      );
      return data;
    }
    throw error;
  }
};

export const getJobStatus = async (
  client: ApiClient,
  jobId: string
): Promise<JobStatus> => {
  const response = await client.request<unknown>({
    path: `/jobs/${encodeURIComponent(jobId)}/status`,
    method: "GET",
  });

  const data = parseData<JobStatus>(
    response,
    JobStatusResponseSchema.extend({
      discoveryLog: z.array(DiscoveryLogEntrySchema).optional(),
      queueDurationMs: z.number().optional(),
      processingDurationMs: z.number().optional(),
      result: TravelJobResultSchema.optional(),
    }),
    "job status fetch"
  );
  return data;
};

export const getUserTravelJobs = async (
  client: ApiClient
): Promise<z.infer<typeof TravelJobListDataSchema>> => {
  const response = await client.request<unknown>({
    path: "/jobs/list",
    method: "GET",
  });

  const data = parseData<z.infer<typeof TravelJobListDataSchema>>(
    response,
    TravelJobListDataSchema,
    "travel jobs fetch"
  );
  return data;
};
