import { z } from "zod";
import {
  LogoLabGenerateRequestSchema,
  LogoLabRunSchema,
  TravelDetailReviewAggregateSchema,
  type LogoLabGenerateRequest,
  type LogoLabRun,
  type TravelDetailReviewAggregate,
} from "@/schemas/labs";
import { ApiRequestError, requestPublicApi } from "@/api/client";

const StandardResponseSchema = z.object({
  success: z.boolean(),
  data: z.unknown().optional(),
  error: z
    .object({
      message: z.string().optional(),
    })
    .optional(),
});

const parseLogoLabResponse = (payload: unknown): LogoLabRun => {
  const standard = StandardResponseSchema.safeParse(payload);
  if (standard.success && standard.data.success) {
    const parsed = LogoLabRunSchema.safeParse(standard.data.data);
    if (parsed.success) {
      return parsed.data;
    }

    throw new ApiRequestError(
      500,
      "Unexpected logo lab response shape.",
      parsed.error.issues,
    );
  }

  const fallback = LogoLabRunSchema.safeParse(payload);
  if (fallback.success) {
    return fallback.data;
  }

  throw new ApiRequestError(
    500,
    standard.success
      ? standard.data.error?.message ?? "Logo lab request failed."
      : "Logo lab request failed.",
    payload,
  );
};

export const generateLogoLabRun = async (
  input: LogoLabGenerateRequest,
): Promise<LogoLabRun> => {
  const payload = LogoLabGenerateRequestSchema.parse(input);
  const response = await requestPublicApi<unknown, LogoLabGenerateRequest>({
    path: "/labs/logo-studio/generate",
    method: "POST",
    body: payload,
  });

  return parseLogoLabResponse(response);
};

export const fetchLatestLogoLabRun = async (): Promise<LogoLabRun> => {
  const response = await requestPublicApi<unknown>({
    path: "/labs/logo-studio/latest",
    method: "GET",
  });

  return parseLogoLabResponse(response);
};

const DEFAULT_TRAVEL_DETAIL_REVIEW_PATH =
  "/Users/noahmitsuhashi/Code/PackAll/PackServer/tmp/travel-extraction-stage-corpus/2026-04-10T05-34-34-314Z-25a9579a/aggregate.json";

export const fetchTravelDetailReviewAggregate = async (
  filePath: string = DEFAULT_TRAVEL_DETAIL_REVIEW_PATH,
): Promise<TravelDetailReviewAggregate> => {
  const response = await fetch(`/@fs${encodeURI(filePath)}`);
  if (!response.ok) {
    throw new ApiRequestError(
      response.status,
      `Failed to load detail review aggregate from ${filePath}.`,
    );
  }

  const payload: unknown = await response.json();
  const parsed = TravelDetailReviewAggregateSchema.safeParse(payload);
  if (!parsed.success) {
    throw new ApiRequestError(
      500,
      "Unexpected travel detail review aggregate shape.",
      parsed.error.issues,
    );
  }

  return parsed.data;
};
