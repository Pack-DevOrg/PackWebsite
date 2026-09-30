import { isUsStateCode } from "@pack/schemas/us-address";
import { z } from "zod";
import { ApiRequestError, type ApiClient } from "@/api/client";
import { StandardApiResponseSchema } from "@/schemas/common";

export const VAULT_ADDRESSES_PATH = "/user/vault/addresses";

export const VaultAddressLabelSchema = z.enum([
  "home",
  "work",
  "delivery",
  "other",
]);

const VaultCountryCodeSchema = z.string().regex(/^[A-Z]{2}$/);

const VaultAddressFieldSchema = z
  .object({
    label: VaultAddressLabelSchema,
    line1: z.string().min(1),
    line2: z.string().min(1).optional(),
    city: z.string().min(1),
    region: z.string().min(1),
    postalCode: z.string().min(1),
    country: VaultCountryCodeSchema,
    deliveryNotes: z.string().min(1).optional(),
    isDefaultDelivery: z.boolean(),
  })
  .strict();

function regionMatchesSharedAddressShape(
  country: string,
  region: string,
): boolean {
  if (country === "US") {
    return isUsStateCode(region);
  }
  return region.length > 0;
}

function refineVaultAddressRegion(
  value: {
    readonly country?: string;
    readonly region?: string;
  },
  ctx: z.RefinementCtx,
): void {
  if (value.country === undefined || value.region === undefined) {
    return;
  }
  if (regionMatchesSharedAddressShape(value.country, value.region)) {
    return;
  }
  ctx.addIssue({
    code: z.ZodIssueCode.custom,
    path: ["region"],
    message: "region is not a shared address region",
  });
}

export const VaultAddressWriteSchema = VaultAddressFieldSchema.superRefine(
  refineVaultAddressRegion,
);

export const VaultAddressPatchSchema = VaultAddressFieldSchema.partial().superRefine(
  refineVaultAddressRegion,
);

export const VaultAddressSchema = VaultAddressFieldSchema.extend({
  id: z.string().min(1),
}).superRefine(refineVaultAddressRegion);

export const VaultAddressListSchema = z
  .object({
    addresses: z.array(VaultAddressSchema),
  })
  .strict();

export type VaultAddressLabel = z.infer<typeof VaultAddressLabelSchema>;
export type VaultAddress = z.infer<typeof VaultAddressSchema>;
export type VaultAddressWrite = z.infer<typeof VaultAddressWriteSchema>;
export type VaultAddressPatch = z.infer<typeof VaultAddressPatchSchema>;

function messageFromApiErrorBecauseEnvelopeFailed(
  error: { message?: string } | undefined,
): string {
  if (error !== undefined && error.message !== undefined && error.message.length > 0) {
    return error.message;
  }
  return "Wallet request failed.";
}

function parseStandardSuccessData(payload: unknown): unknown {
  const parsed = StandardApiResponseSchema.safeParse(payload);
  if (!parsed.success) {
    throw new ApiRequestError(500, "Malformed wallet envelope.");
  }
  if (parsed.data.success === false) {
    throw new ApiRequestError(
      500,
      messageFromApiErrorBecauseEnvelopeFailed(parsed.data.error),
      parsed.data.error,
    );
  }
  return parsed.data.data;
}

function parseWithSchema<T extends z.ZodTypeAny>(
  data: unknown,
  schema: T,
): z.infer<T> {
  const parsed = schema.safeParse(data);
  if (!parsed.success) {
    throw new ApiRequestError(500, "Malformed wallet envelope.", parsed.error);
  }
  return parsed.data;
}

function addressPathBecauseId(id: string): string {
  return `${VAULT_ADDRESSES_PATH}/${encodeURIComponent(id)}`;
}

export const listVaultAddresses = async (
  client: ApiClient,
): Promise<readonly VaultAddress[]> => {
  const response = await client.request<unknown>({
    path: VAULT_ADDRESSES_PATH,
  });
  const parsed = parseWithSchema(
    parseStandardSuccessData(response),
    VaultAddressListSchema,
  );
  return parsed.addresses;
};

export const createVaultAddress = async (
  client: ApiClient,
  payload: VaultAddressWrite,
): Promise<VaultAddress> => {
  const body = VaultAddressWriteSchema.parse(payload);
  const response = await client.request<unknown, VaultAddressWrite>({
    path: VAULT_ADDRESSES_PATH,
    method: "POST",
    body,
  });
  return parseWithSchema(parseStandardSuccessData(response), VaultAddressSchema);
};

export const updateVaultAddress = async (
  client: ApiClient,
  id: string,
  payload: VaultAddressPatch,
): Promise<VaultAddress> => {
  const body = VaultAddressPatchSchema.parse(payload);
  const response = await client.request<unknown, VaultAddressPatch>({
    path: addressPathBecauseId(id),
    method: "PATCH",
    body,
  });
  return parseWithSchema(parseStandardSuccessData(response), VaultAddressSchema);
};

export const deleteVaultAddress = async (
  client: ApiClient,
  id: string,
): Promise<void> => {
  const response = await client.request<unknown>({
    path: addressPathBecauseId(id),
    method: "DELETE",
  });
  parseStandardSuccessData(response);
};
