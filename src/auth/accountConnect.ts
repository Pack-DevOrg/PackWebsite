/**
 * Web Gmail/Calendar connect uses the same Google web client and canonical
 * redirect the app's ConnectedAccountsScreen exchanges at POST /user/accounts.
 * Apex 301s this redirect onto www, so the SPA callback still has the session.
 */

// @ts-expect-error PackApp source is resolved by Vite and Jest, not this tsconfig.
import { CAPABILITY_SPECS } from "@pack/app/screens/settings/ConnectedServices/capabilities";
import {
  ACCOUNT_CONNECT_PENDING_KEY_PREFIX,
  LEGACY_ACCOUNT_CONNECT_PENDING_KEY,
  ONBOARD_CONNECTED_MAILBOXES_KEY_PREFIX,
  ONBOARD_CONNECTIONS_RETURN_KEY_PREFIX,
  removeSessionStorageKeysByPrefix,
} from "./tokenStorage";

type WebOnboardCapabilityId = "mail_read" | "calendar_read";

const WEB_ONBOARD_CAPABILITY_IDS: readonly WebOnboardCapabilityId[] = [
  "mail_read",
  "calendar_read",
];

const CANONICAL_CAPABILITY_SPECS: Readonly<
  Record<
    WebOnboardCapabilityId,
    {
      readonly requestScope: {
        readonly google: string;
        readonly microsoft: string;
      };
    }
  >
> = CAPABILITY_SPECS;

export const USER_ACCOUNTS_PATH = "/user/accounts";

export const GOOGLE_WEB_CLIENT_ID =
  "954475259916-15eeqa9prhfgllda42ofrcdv2sirav5n.apps.googleusercontent.com";

const MICROSOFT_CLIENT_ID = "5be1eac2-56a6-4dcf-a985-336797ed1e27";

export const GOOGLE_REDIRECT_URI =
  "https://trypackai.com/api/auth/callback/google";

const MICROSOFT_REDIRECT_URI =
  "https://trypackai.com/api/auth/callback/microsoft";

const GOOGLE_AUTHORIZE_URL =
  "https://accounts.google.com/o/oauth2/v2/auth";

const MICROSOFT_AUTHORIZE_URL =
  "https://login.microsoftonline.com/common/oauth2/v2.0/authorize";

const GOOGLE_IDENTITY_SCOPES = [
  "openid",
  "email",
  "profile",
  "https://www.googleapis.com/auth/userinfo.email",
  "https://www.googleapis.com/auth/userinfo.profile",
] as const;

const MICROSOFT_IDENTITY_SCOPES = [
  "offline_access",
  "openid",
  "profile",
  "email",
  "User.Read",
] as const;

function resolveProviderConnectScopes(
  provider: AccountConnectProvider,
): readonly string[] {
  const identityScopes =
    provider === "google" ? GOOGLE_IDENTITY_SCOPES : MICROSOFT_IDENTITY_SCOPES;
  const capabilityScopes = WEB_ONBOARD_CAPABILITY_IDS.map(
    (id) => CANONICAL_CAPABILITY_SPECS[id].requestScope[provider],
  );
  return [...identityScopes, ...new Set(capabilityScopes)];
}

/** Identity scopes plus read-only Gmail and Calendar scopes from canonical `CAPABILITY_SPECS`. */
export const GOOGLE_CONNECT_SCOPES: readonly string[] =
  resolveProviderConnectScopes("google");

export const MICROSOFT_CONNECT_SCOPES: readonly string[] =
  resolveProviderConnectScopes("microsoft");

const ACCOUNT_CONNECT_CATEGORIES = ["email", "calendar"] as const;

const PENDING_MAX_AGE_MS = 10 * 60 * 1000;

export type AccountConnectProvider = "google" | "microsoft";

export interface ConnectedMailboxSnapshot {
  readonly googleEmail: string | null;
  readonly microsoftEmail: string | null;
}

interface StoredConnectedMailboxSnapshot extends ConnectedMailboxSnapshot {
  readonly userId: string;
}

interface PendingAccountConnect {
  readonly userId: string;
  readonly provider: AccountConnectProvider;
  readonly state: string;
  readonly createdAt: number;
  readonly codeVerifier?: string;
}

interface GoogleAccountConnectBody {
  readonly provider: "Google";
  readonly categories: readonly ["email", "calendar"];
  readonly token: string;
  readonly metadata: {
    readonly requestedScopes: readonly string[];
    readonly redirectUri: string;
  };
}

interface MicrosoftAccountConnectBody {
  readonly provider: "Microsoft";
  readonly categories: readonly ["email", "calendar"];
  readonly token: {
    readonly authorizationCode: string;
    readonly redirectUri: string;
    readonly codeVerifier?: string;
    readonly scopes: readonly string[];
  };
  readonly metadata: {
    readonly requestedScopes: readonly string[];
  };
}

function browserStorage(): Storage | null {
  if (typeof window === "undefined") {
    return null;
  }
  try {
    return window.sessionStorage;
  } catch {
    return null;
  }
}

function randomUrlSafe(byteLength: number): string {
  const bytes = new Uint8Array(byteLength);
  crypto.getRandomValues(bytes);
  return base64Url(bytes);
}

function base64Url(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary).replaceAll("+", "-").replaceAll("/", "_").replaceAll("=", "");
}

function resolveGoogleWebClientId(override?: string): string {
  const trimmed = override?.trim() ?? "";
  if (trimmed.length > 0) {
    return trimmed;
  }
  return GOOGLE_WEB_CLIENT_ID;
}

function resolveMicrosoftClientId(override?: string): string {
  const trimmed = override?.trim() ?? "";
  if (trimmed.length > 0) {
    return trimmed;
  }
  return MICROSOFT_CLIENT_ID;
}

function normalizeUserId(userId: string | null | undefined): string | null {
  if (typeof userId !== "string") {
    return null;
  }
  const trimmed = userId.trim();
  if (trimmed.length === 0) {
    return null;
  }
  return trimmed;
}

function requireUserId(userId: string | null | undefined): string {
  const normalized = normalizeUserId(userId);
  if (!normalized) {
    throw new Error("Authenticated userId is required for account connect");
  }
  return normalized;
}

export function resolveAuthenticatedUserId(
  status: string,
  sub: string | null | undefined,
): string | null {
  if (status !== "authenticated") {
    return null;
  }
  return normalizeUserId(sub);
}

function pendingKeyForUser(userId: string): string {
  return `${ACCOUNT_CONNECT_PENDING_KEY_PREFIX}${userId}`;
}

function returnKeyForUser(userId: string): string {
  return `${ONBOARD_CONNECTIONS_RETURN_KEY_PREFIX}${userId}`;
}

function snapshotKeyForUser(userId: string): string {
  return `${ONBOARD_CONNECTED_MAILBOXES_KEY_PREFIX}${userId}`;
}

export function buildGoogleAccountConnectUrl(input: {
  readonly state: string;
  readonly clientId?: string;
}): string {
  const url = new URL(GOOGLE_AUTHORIZE_URL);
  url.searchParams.set("client_id", resolveGoogleWebClientId(input.clientId));
  url.searchParams.set("redirect_uri", GOOGLE_REDIRECT_URI);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", GOOGLE_CONNECT_SCOPES.join(" "));
  url.searchParams.set("access_type", "offline");
  url.searchParams.set("prompt", "consent");
  url.searchParams.set("include_granted_scopes", "true");
  url.searchParams.set("state", input.state);
  return url.toString();
}

export async function buildMicrosoftAccountConnectUrl(input: {
  readonly state: string;
  readonly codeVerifier: string;
  readonly clientId?: string;
}): Promise<string> {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(input.codeVerifier),
  );
  const url = new URL(MICROSOFT_AUTHORIZE_URL);
  url.searchParams.set("client_id", resolveMicrosoftClientId(input.clientId));
  url.searchParams.set("redirect_uri", MICROSOFT_REDIRECT_URI);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", MICROSOFT_CONNECT_SCOPES.join(" "));
  url.searchParams.set("prompt", "select_account");
  url.searchParams.set("state", input.state);
  url.searchParams.set("code_challenge", base64Url(new Uint8Array(digest)));
  url.searchParams.set("code_challenge_method", "S256");
  return url.toString();
}

function readPending(userId: string): PendingAccountConnect | null {
  const storage = browserStorage();
  if (!storage) {
    return null;
  }
  const key = pendingKeyForUser(userId);
  const raw = storage.getItem(key);
  if (!raw) {
    return null;
  }
  try {
    const pending = JSON.parse(raw) as PendingAccountConnect;
    if (pending.userId !== userId) {
      return null;
    }
    if (pending.provider !== "google" && pending.provider !== "microsoft") {
      return null;
    }
    if (typeof pending.state !== "string" || pending.state.length === 0) {
      return null;
    }
    if (
      typeof pending.createdAt !== "number" ||
      Date.now() - pending.createdAt > PENDING_MAX_AGE_MS
    ) {
      storage.removeItem(key);
      return null;
    }
    return pending;
  } catch {
    return null;
  }
}

function writePending(pending: PendingAccountConnect): void {
  const storage = browserStorage();
  if (!storage) {
    return;
  }
  storage.setItem(pendingKeyForUser(pending.userId), JSON.stringify(pending));
}

export function clearPendingAccountConnect(
  userId?: string | null,
): void {
  const storage = browserStorage();
  if (!storage) {
    return;
  }
  storage.removeItem(LEGACY_ACCOUNT_CONNECT_PENDING_KEY);
  const normalized = normalizeUserId(userId);
  if (normalized) {
    storage.removeItem(pendingKeyForUser(normalized));
    return;
  }
  removeSessionStorageKeysByPrefix([ACCOUNT_CONNECT_PENDING_KEY_PREFIX]);
}

export function markOnboardConnectionsReturn(
  userId: string | null | undefined,
): void {
  const normalized = normalizeUserId(userId);
  const storage = browserStorage();
  if (!normalized || !storage) {
    return;
  }
  storage.setItem(returnKeyForUser(normalized), normalized);
}

export function consumeOnboardConnectionsReturn(
  userId: string | null | undefined,
): boolean {
  const normalized = normalizeUserId(userId);
  const storage = browserStorage();
  if (!normalized || !storage) {
    return false;
  }
  const key = returnKeyForUser(normalized);
  const storedUserId = storage.getItem(key);
  storage.removeItem(key);
  return storedUserId === normalized;
}

function emptyConnectedMailboxSnapshot(): ConnectedMailboxSnapshot {
  return { googleEmail: null, microsoftEmail: null };
}

export function readConnectedMailboxSnapshot(
  userId: string | null | undefined,
): ConnectedMailboxSnapshot {
  const normalized = normalizeUserId(userId);
  if (!normalized) {
    return emptyConnectedMailboxSnapshot();
  }
  const storage = browserStorage();
  if (!storage) {
    return emptyConnectedMailboxSnapshot();
  }
  const raw = storage.getItem(snapshotKeyForUser(normalized));
  if (!raw) {
    return emptyConnectedMailboxSnapshot();
  }
  try {
    const parsed = JSON.parse(raw) as StoredConnectedMailboxSnapshot;
    if (parsed.userId !== normalized) {
      return emptyConnectedMailboxSnapshot();
    }
    return {
      googleEmail: typeof parsed.googleEmail === "string" ? parsed.googleEmail : null,
      microsoftEmail:
        typeof parsed.microsoftEmail === "string" ? parsed.microsoftEmail : null,
    };
  } catch {
    return emptyConnectedMailboxSnapshot();
  }
}

export function writeConnectedMailboxSnapshot(
  userId: string | null | undefined,
  snapshot: ConnectedMailboxSnapshot,
): void {
  const normalized = normalizeUserId(userId);
  const storage = browserStorage();
  if (!normalized || !storage) {
    return;
  }
  const payload: StoredConnectedMailboxSnapshot = {
    userId: normalized,
    googleEmail: snapshot.googleEmail,
    microsoftEmail: snapshot.microsoftEmail,
  };
  storage.setItem(snapshotKeyForUser(normalized), JSON.stringify(payload));
}

export const accountConnectWindow = {
  assign(url: string): void {
    window.location.assign(url);
  },
};

export function startGoogleAccountConnect(
  userId: string,
  clientId?: string,
): string {
  const normalized = requireUserId(userId);
  const state = randomUrlSafe(16);
  writePending({
    userId: normalized,
    provider: "google",
    state,
    createdAt: Date.now(),
  });
  markOnboardConnectionsReturn(normalized);
  return buildGoogleAccountConnectUrl({ state, clientId });
}

export async function startMicrosoftAccountConnect(
  userId: string,
  clientId?: string,
): Promise<string> {
  const normalized = requireUserId(userId);
  const state = randomUrlSafe(16);
  const codeVerifier = randomUrlSafe(32);
  writePending({
    userId: normalized,
    provider: "microsoft",
    state,
    createdAt: Date.now(),
    codeVerifier,
  });
  markOnboardConnectionsReturn(normalized);
  return buildMicrosoftAccountConnectUrl({ state, codeVerifier, clientId });
}

export function googleAccountConnectBody(code: string): GoogleAccountConnectBody {
  return {
    provider: "Google",
    categories: ACCOUNT_CONNECT_CATEGORIES,
    token: code,
    metadata: {
      requestedScopes: GOOGLE_CONNECT_SCOPES,
      redirectUri: GOOGLE_REDIRECT_URI,
    },
  };
}

export function microsoftAccountConnectBody(
  code: string,
  codeVerifier: string | undefined,
): MicrosoftAccountConnectBody {
  return {
    provider: "Microsoft",
    categories: ACCOUNT_CONNECT_CATEGORIES,
    token: {
      authorizationCode: code,
      redirectUri: MICROSOFT_REDIRECT_URI,
      ...(codeVerifier ? { codeVerifier } : {}),
      scopes: MICROSOFT_CONNECT_SCOPES,
    },
    metadata: {
      requestedScopes: MICROSOFT_CONNECT_SCOPES,
    },
  };
}

export function pendingMatchesCallback(
  provider: AccountConnectProvider,
  state: string | null,
  userId: string | null | undefined,
): PendingAccountConnect | null {
  const normalized = normalizeUserId(userId);
  if (!normalized) {
    return null;
  }
  const pending = readPending(normalized);
  if (!pending || pending.provider !== provider || pending.state !== state) {
    return null;
  }
  return pending;
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (value !== null && typeof value === "object") {
    return value as Record<string, unknown>;
  }
  return null;
}

export function mailboxesFromAccountsPayload(payload: unknown): Array<{
  readonly provider: AccountConnectProvider;
  readonly email: string;
}> {
  const root = asRecord(payload);
  if (!root) {
    return [];
  }
  const data = asRecord(root.data);
  const accounts = Array.isArray(root.accounts)
    ? root.accounts
    : Array.isArray(data?.accounts)
      ? data.accounts
      : [];
  const rows: Array<{ provider: AccountConnectProvider; email: string }> = [];
  for (const item of accounts) {
    const record = asRecord(item);
    if (!record) {
      continue;
    }
    const email = typeof record.email === "string" ? record.email.trim() : "";
    if (email.length === 0) {
      continue;
    }
    if (record.provider === "Google") {
      rows.push({ provider: "google", email });
    }
    if (record.provider === "Microsoft") {
      rows.push({ provider: "microsoft", email });
    }
  }
  return rows;
}

export function emailFromAccountConnectResponse(payload: unknown): string | null {
  const root = asRecord(payload);
  if (!root) {
    return null;
  }
  const data = asRecord(root.data);
  const direct = typeof root.email === "string" ? root.email.trim() : "";
  if (direct.length > 0) {
    return direct;
  }
  const nested = typeof data?.email === "string" ? data.email.trim() : "";
  if (nested.length > 0) {
    return nested;
  }
  return null;
}

export function snapshotWithConnectedEmail(
  userId: string | null | undefined,
  provider: AccountConnectProvider,
  email: string | null,
): ConnectedMailboxSnapshot {
  const normalized = normalizeUserId(userId);
  if (!normalized) {
    return emptyConnectedMailboxSnapshot();
  }
  const current = readConnectedMailboxSnapshot(normalized);
  if (provider === "google") {
    return {
      googleEmail: email !== null ? email : current.googleEmail,
      microsoftEmail: current.microsoftEmail,
    };
  }
  return {
    googleEmail: current.googleEmail,
    microsoftEmail: email !== null ? email : current.microsoftEmail,
  };
}
