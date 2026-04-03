import { z } from "zod";
import { StandardApiResponseSchema } from "@/schemas/common";
import {
  CreateSharedTravelPlanRequestSchema,
  CreateSharedTravelPlanResponseSchema,
  GetSharedTravelPlanResponseSchema,
  SharedTravelDataSchema,
} from "@/schemas/shared-travel";
import { ApiRequestError, type ApiClient } from "./client";

export type SharedTravelData = z.infer<typeof SharedTravelDataSchema>;

const parseStandard = (payload: unknown) => StandardApiResponseSchema.parse(payload);

const parseData = <T>(
  payload: unknown,
  schema: z.ZodTypeAny,
  label: string
): T => {
  const parsed = parseStandard(payload);
  if (!parsed.success) {
    const message =
      parsed.error?.message ??
      parsed.error ??
      `Request failed while performing ${label}`;
    throw new ApiRequestError(500, message, parsed.error);
  }
  if (parsed.data === undefined) {
    throw new ApiRequestError(500, `Missing data while performing ${label}`);
  }
  const validated = schema.parse(parsed.data);
  return validated as T;
};

export const createSharedTravelPlan = async (
  client: ApiClient,
  payload: z.infer<typeof CreateSharedTravelPlanRequestSchema>
): Promise<z.infer<typeof CreateSharedTravelPlanResponseSchema>> => {
  const validated = CreateSharedTravelPlanRequestSchema.parse(payload);
  const response = await client.request<unknown, typeof validated>({
    path: "/api/share",
    method: "POST",
    body: validated,
  });

  const data = parseData<z.infer<typeof CreateSharedTravelPlanResponseSchema>>(
    response,
    CreateSharedTravelPlanResponseSchema,
    "share link creation"
  );
  return data;
};

export const fetchSharedTravelPlan = async (
  client: ApiClient,
  shareId: string
): Promise<SharedTravelData> => {
  const response = await client.request<unknown>({
    path: `/api/share/${encodeURIComponent(shareId)}`,
    method: "GET",
  });

  // The lambda wraps payload in StandardApiResponseSchema
  try {
    const data = parseData<SharedTravelData>(
      response,
      SharedTravelDataSchema,
      "shared plan fetch"
    );
    return data;
  } catch {
    // fall through to legacy handling below
  }

  // Some callers (e.g. legacy) may return GetSharedTravelPlanResponseSchema directly
  const parsedLegacy = GetSharedTravelPlanResponseSchema.parse(response);
  if (!parsedLegacy.success || !parsedLegacy.data) {
    throw new ApiRequestError(
      500,
      parsedLegacy.error ?? "Failed to load shared travel plan",
      parsedLegacy
    );
  }

  return parsedLegacy.data;
};
