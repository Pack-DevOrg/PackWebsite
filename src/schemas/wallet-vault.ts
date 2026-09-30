import { isUsStateCode } from "@pack/schemas/us-address";
import { z } from "zod";

export const VAULT_CREDENTIALS_PATH = "/user/vault/credentials";
export const VAULT_ADDRESSES_PATH = "/user/vault/addresses";
export const WALLET_LINK_PATH = "/user/wallet/link";
export const WALLET_LINK_SESSION_PATH = "/user/wallet/link/session";
export const WALLET_CARDS_PATH = "/user/wallet/cards";

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

export const VaultCredentialPublicSchema = z
  .object({
    id: z.string().min(1),
    site: z.string().min(1),
    username: z.string().min(1),
    secretPresent: z.literal(true),
  })
  .strict();

export const VaultCredentialCreateSchema = z
  .object({
    site: z.string().min(1),
    username: z.string().min(1),
    secret: z.string().min(1),
  })
  .strict();

export const VaultCredentialPatchSchema = z
  .object({
    site: z.string().min(1).optional(),
    username: z.string().min(1).optional(),
    secret: z.string().min(1).optional(),
  })
  .strict();

export const VaultCredentialListSchema = z
  .object({
    credentials: z.array(VaultCredentialPublicSchema),
  })
  .strict();

export const WalletLinkStatusSchema = z
  .object({
    connected: z.boolean(),
    last4: z.string().min(4).max(4).optional(),
    brand: z.string().min(1).optional(),
  })
  .strict();

export const WalletLinkSessionSchema = z
  .object({
    url: z.string().url(),
  })
  .strict();

export const VirtualCardUseKindSchema = z.enum([
  "issue",
  "authorization",
  "decline",
]);

export const VirtualCardUseSchema = z
  .object({
    id: z.string().min(1),
    cardId: z.string().min(1),
    kind: VirtualCardUseKindSchema,
    amountCents: z.number().int(),
    merchant: z.string().min(1),
    at: z.string().datetime(),
  })
  .strict();

export const VirtualCardSchema = z
  .object({
    id: z.string().min(1),
    surrogate: z.string().regex(/^card_[A-Za-z0-9_]+$/),
    merchant: z.string().min(1),
    amountCents: z.number().int().nonnegative(),
    currency: z.string().min(1),
    status: z.enum(["issued", "active", "canceled"]),
    issuedAt: z.string().datetime(),
    uses: z.array(VirtualCardUseSchema),
  })
  .strict();

export const VirtualCardListSchema = z
  .object({
    cards: z.array(VirtualCardSchema),
  })
  .strict();

export type VaultCredentialPublic = z.infer<typeof VaultCredentialPublicSchema>;
export type VaultCredentialCreate = z.infer<typeof VaultCredentialCreateSchema>;
export type VaultCredentialPatch = z.infer<typeof VaultCredentialPatchSchema>;
export type VaultAddressLabel = z.infer<typeof VaultAddressLabelSchema>;
export type VaultAddress = z.infer<typeof VaultAddressSchema>;
export type VaultAddressWrite = z.infer<typeof VaultAddressWriteSchema>;
export type VaultAddressPatch = z.infer<typeof VaultAddressPatchSchema>;
export type WalletLinkStatus = z.infer<typeof WalletLinkStatusSchema>;
export type WalletLinkSession = z.infer<typeof WalletLinkSessionSchema>;
export type VirtualCard = z.infer<typeof VirtualCardSchema>;
export type VirtualCardUse = z.infer<typeof VirtualCardUseSchema>;
export type VirtualCardUseKind = z.infer<typeof VirtualCardUseKindSchema>;
