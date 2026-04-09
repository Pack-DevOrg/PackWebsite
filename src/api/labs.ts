import { z } from "zod";
import {
  LogoLabGenerateRequestSchema,
  LogoLabRunSchema,
  type LogoLabGenerateRequest,
  type LogoLabRun,
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
