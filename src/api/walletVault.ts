import { z } from "zod";
import { StandardApiResponseSchema } from "@/schemas/common";
import {
  VAULT_CREDENTIALS_PATH,
  WALLET_CARDS_PATH,
  WALLET_LINK_PATH,
  WALLET_LINK_SESSION_PATH,
  VaultCredentialCreateSchema,
  VaultCredentialListSchema,
  VaultCredentialPatchSchema,
  VaultCredentialPublicSchema,
  VirtualCardListSchema,
  WalletLinkSessionSchema,
  WalletLinkStatusSchema,
  type VaultCredentialCreate,
  type VaultCredentialPatch,
  type VaultCredentialPublic,
  type VirtualCard,
  type WalletLinkSession,
  type WalletLinkStatus,
} from "@/schemas/wallet-vault";
import { ApiRequestError, type ApiClient } from "./client";

export {
  VAULT_CREDENTIALS_PATH,
  WALLET_CARDS_PATH,
  WALLET_LINK_PATH,
  WALLET_LINK_SESSION_PATH,
};
export type {
  VaultCredentialCreate,
  VaultCredentialPatch,
  VaultCredentialPublic,
  VirtualCard,
  WalletLinkSession,
  WalletLinkStatus,
};

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

function credentialPathBecauseId(id: string): string {
  return `${VAULT_CREDENTIALS_PATH}/${encodeURIComponent(id)}`;
}

export const listVaultCredentials = async (
  client: ApiClient,
): Promise<readonly VaultCredentialPublic[]> => {
  const response = await client.request<unknown>({
    path: VAULT_CREDENTIALS_PATH,
  });
  const parsed = parseWithSchema(
    parseStandardSuccessData(response),
    VaultCredentialListSchema,
  );
  return parsed.credentials;
};

export const createVaultCredential = async (
  client: ApiClient,
  payload: VaultCredentialCreate,
): Promise<VaultCredentialPublic> => {
  const body = VaultCredentialCreateSchema.parse(payload);
  const response = await client.request<unknown, VaultCredentialCreate>({
    path: VAULT_CREDENTIALS_PATH,
    method: "POST",
    body,
  });
  return parseWithSchema(
    parseStandardSuccessData(response),
    VaultCredentialPublicSchema,
  );
};

export const updateVaultCredential = async (
  client: ApiClient,
  id: string,
  payload: VaultCredentialPatch,
): Promise<VaultCredentialPublic> => {
  const body = VaultCredentialPatchSchema.parse(payload);
  const response = await client.request<unknown, VaultCredentialPatch>({
    path: credentialPathBecauseId(id),
    method: "PATCH",
    body,
  });
  return parseWithSchema(
    parseStandardSuccessData(response),
    VaultCredentialPublicSchema,
  );
};

export const deleteVaultCredential = async (
  client: ApiClient,
  id: string,
): Promise<void> => {
  const response = await client.request<unknown>({
    path: credentialPathBecauseId(id),
    method: "DELETE",
  });
  parseStandardSuccessData(response);
};

export const fetchWalletLinkStatus = async (
  client: ApiClient,
): Promise<WalletLinkStatus> => {
  const response = await client.request<unknown>({
    path: WALLET_LINK_PATH,
  });
  return parseWithSchema(
    parseStandardSuccessData(response),
    WalletLinkStatusSchema,
  );
};

export const createWalletLinkSession = async (
  client: ApiClient,
): Promise<WalletLinkSession> => {
  const response = await client.request<unknown>({
    path: WALLET_LINK_SESSION_PATH,
    method: "POST",
    body: {},
  });
  return parseWithSchema(
    parseStandardSuccessData(response),
    WalletLinkSessionSchema,
  );
};

export const listVirtualCards = async (
  client: ApiClient,
): Promise<readonly VirtualCard[]> => {
  const response = await client.request<unknown>({
    path: WALLET_CARDS_PATH,
  });
  const parsed = parseWithSchema(
    parseStandardSuccessData(response),
    VirtualCardListSchema,
  );
  return parsed.cards;
};

export function openLinkUrlBecauseStripeSession(url: string): void {
  window.open(url, "_blank", "noopener,noreferrer");
}
