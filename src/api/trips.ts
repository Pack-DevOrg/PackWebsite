import { z } from "zod";
import { StandardApiResponseSchema } from "@/schemas/common";
import {
  TripSchema,
  TripResponseSchema,
  TripCreateSchema,
} from "@/schemas/trips";
import type { ApiClient } from "./client";
import { ApiRequestError } from "./client";

export type Trip = z.infer<typeof TripSchema>;
export type TripResponse = z.infer<typeof TripResponseSchema>;

export const TripCreatePayloadSchema = TripCreateSchema.omit({ sub: true });

export type TripCreatePayload = z.infer<typeof TripCreatePayloadSchema>;

function parseStandardResponse(
  payload: unknown,
): z.infer<typeof StandardApiResponseSchema>;
function parseStandardResponse<T extends z.ZodTypeAny>(
  payload: unknown,
  dataSchema: T,
): z.infer<typeof StandardApiResponseSchema> & {readonly data: z.infer<T>};
function parseStandardResponse<T extends z.ZodTypeAny>(
  payload: unknown,
  dataSchema?: T,
) {
  const base = StandardApiResponseSchema.parse(payload);
  if (!base.success) {
    throw new ApiRequestError(
      500,
      base.error?.message ?? "Request failed.",
      base.error
    );
  }

  if (!dataSchema) {
    return base;
  }

  return {
    ...base,
    data: dataSchema.parse(base.data),
  };
}

export const fetchTrips = async (client: ApiClient): Promise<Trip[]> => {
  const response = await client.request<unknown>({ path: "/user/trips" });
  const parsed = parseStandardResponse(response, TripResponseSchema);
  return parsed.data?.trips ?? [];
};

export const createTrip = async (
  client: ApiClient,
  payload: TripCreatePayload
): Promise<Trip> => {
  const validated = TripCreatePayloadSchema.parse(payload);
  const response = await client.request<unknown, typeof validated>({
    path: "/user/trips",
    method: "POST",
    body: validated,
  });
  const parsed = parseStandardResponse(response, TripSchema);
  return parsed.data;
};

export const deleteTrip = async (
  client: ApiClient,
  tripId: string
): Promise<void> => {
  const response = await client.request<unknown>({
    path: `/user/trips/${encodeURIComponent(tripId)}`,
    method: "DELETE",
  });
  parseStandardResponse(response);
};
