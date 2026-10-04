import { createApiClient } from "@/api/client";

export type PackAccessRead = "waitlisted" | "active";

/** Missing `access` is an existing linked account: active. */
export function packAccessBecauseInformationPayload(
  payload: unknown,
): PackAccessRead {
  if (payload === null || typeof payload !== "object") {
    return "active";
  }
  const record = payload as Record<string, unknown>;
  const data =
    record.data !== null && typeof record.data === "object"
      ? (record.data as Record<string, unknown>)
      : record;
  if (data.access === "waitlisted") {
    return "waitlisted";
  }
  return "active";
}

export async function readPackAccessBecauseSession(input: {
  readonly getAccessToken: () => Promise<string | null>;
  readonly tokenType: string;
}): Promise<PackAccessRead> {
  const client = createApiClient(
    async () => input.getAccessToken(),
    () => input.tokenType,
  );
  const payload = await client.request<unknown>({
    path: "/user/information",
    method: "GET",
  });
  return packAccessBecauseInformationPayload(payload);
}
