import { ApiRequestError, type ApiClient } from "./client";
import { StandardApiResponseSchema } from "@/schemas/common";
import {
  createDefaultUserPreferences,
  UserPreferencesSchema,
  type UserPreferences,
} from "@/schemas/user-preferences";

const parseStandardResponse = (payload: unknown): UserPreferences => {
  const base = StandardApiResponseSchema.parse(payload);
  if (!base.success) {
    throw new ApiRequestError(
      500,
      base.error?.message ?? "Request failed.",
      base.error
    );
  }

  return UserPreferencesSchema.parse(base.data ?? {});
};

export const fetchUserPreferences = async (
  client: ApiClient,
  fallback?: { readonly sub?: string; readonly email?: string }
): Promise<UserPreferences> => {
  const response = await client.request<unknown>({
    path: "/user/preferences",
  });

  const parsed = parseStandardResponse(response);
  if (parsed.sub || parsed.email) {
    return parsed;
  }

  return createDefaultUserPreferences(fallback?.sub, fallback?.email);
};
