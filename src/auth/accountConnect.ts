/**
 * Web Gmail/Calendar connect uses the same Google web client and canonical
 * redirect the app's ConnectedAccountsScreen exchanges at POST /user/accounts.
 * Apex 301s this redirect onto www, so the SPA callback still has the session.
 */

export const USER_ACCOUNTS_PATH = "/user/accounts";

export const GOOGLE_WEB_CLIENT_ID =
  "954475259916-15eeqa9prhfgllda42ofrcdv2sirav5n.apps.googleusercontent.com";

export const MICROSOFT_CLIENT_ID = "5be1eac2-56a6-4dcf-a985-336797ed1e27";

export const GOOGLE_REDIRECT_URI =
  "https://trypackai.com/api/auth/callback/google";

export const MICROSOFT_REDIRECT_URI =
  "https://trypackai.com/api/auth/callback/microsoft";

export const GOOGLE_AUTHORIZE_URL =
  "https://accounts.google.com/o/oauth2/v2/auth";

export const MICROSOFT_AUTHORIZE_URL =
  "https://login.microsoftonline.com/common/oauth2/v2.0/authorize";

/** Identity scopes plus the Gmail and Calendar scopes ConnectedAccountsScreen requests. */
export const GOOGLE_CONNECT_SCOPES = [
  "openid",
  "email",
  "profile",
  "https://www.googleapis.com/auth/userinfo.email",
  "https://www.googleapis.com/auth/userinfo.profile",
  "https://www.googleapis.com/auth/gmail.modify",
  "https://www.googleapis.com/auth/calendar.readonly",
] as const;

export const MICROSOFT_CONNECT_SCOPES = [
  "offline_access",
  "openid",
  "profile",
  "email",
  "User.Read",
  "Mail.Read",
  "Calendars.Read",
] as const;

export const ACCOUNT_CONNECT_CATEGORIES = ["email", "calendar"] as const;

const PENDING_KEY = "pack.accountConnect.pending.v1";
const RETURN_KEY = "pack.onboard.connectionsReturn.v1";
const SNAPSHOT_KEY = "pack.onboard.connectedMailboxes.v1";
const PENDING_MAX_AGE_MS = 10 * 60 * 1000;

export type AccountConnectProvider = "google" | "microsoft";

export interface ConnectedMailboxSnapshot {
  readonly googleEmail: string | null;
  readonly microsoftEmail: string | null;
}

interface PendingAccountConnect {
  readonly provider: AccountConnectProvider;
  readonly state: string;
  readonly createdAt: number;
  readonly codeVerifier?: string;
}

export interface GoogleAccountConnectBody {
  readonly provider: "Google";
  readonly categories: readonly ["email", "calendar"];
  readonly token: string;
  readonly metadata: {
    readonly requestedScopes: readonly string[];
    readonly redirectUri: string;
  };
}

export interface MicrosoftAccountConnectBody {
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

export function resolveGoogleWebClientId(override?: string): string {
  const trimmed = override?.trim() ?? "";
  if (trimmed.length > 0) {
    return trimmed;
  }
  return GOOGLE_WEB_CLIENT_ID;
}

export function resolveMicrosoftClientId(override?: string): string {
  const trimmed = override?.trim() ?? "";
  if (trimmed.length > 0) {
    return trimmed;
  }
  return MICROSOFT_CLIENT_ID;
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

function readPending(): PendingAccountConnect | null {
  const storage = browserStorage();
  if (!storage) {
    return null;
  }
  const raw = storage.getItem(PENDING_KEY);
  if (!raw) {
    return null;
  }
  try {
    const pending = JSON.parse(raw) as PendingAccountConnect;
    if (pending.provider !== "google" && pending.provider !== "microsoft") {
      return null;
    }
    if (typeof pending.state !== "string" || pending.state.length === 0) {
      return null;
    }
    if (Date.now() - pending.createdAt > PENDING_MAX_AGE_MS) {
      storage.removeItem(PENDING_KEY);
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
  storage.setItem(PENDING_KEY, JSON.stringify(pending));
}

export function clearPendingAccountConnect(): void {
  browserStorage()?.removeItem(PENDING_KEY);
}

export function markOnboardConnectionsReturn(): void {
  browserStorage()?.setItem(RETURN_KEY, "1");
}

export function consumeOnboardConnectionsReturn(): boolean {
  const storage = browserStorage();
  if (!storage) {
    return false;
  }
  if (storage.getItem(RETURN_KEY) !== "1") {
    return false;
  }
  storage.removeItem(RETURN_KEY);
  return true;
}

export function emptyConnectedMailboxSnapshot(): ConnectedMailboxSnapshot {
  return { googleEmail: null, microsoftEmail: null };
}

export function readConnectedMailboxSnapshot(): ConnectedMailboxSnapshot {
  const storage = browserStorage();
  if (!storage) {
    return emptyConnectedMailboxSnapshot();
  }
  const raw = storage.getItem(SNAPSHOT_KEY);
  if (!raw) {
    return emptyConnectedMailboxSnapshot();
  }
  try {
    const parsed = JSON.parse(raw) as ConnectedMailboxSnapshot;
    return {
      googleEmail: typeof parsed.googleEmail === "string" ? parsed.googleEmail : null,
      microsoftEmail:
        typeof parsed.microsoftEmail === "string" ? parsed.microsoftEmail : null,
    };
  } catch {
    return emptyConnectedMailboxSnapshot();
  }
}

export function writeConnectedMailboxSnapshot(snapshot: ConnectedMailboxSnapshot): void {
  browserStorage()?.setItem(SNAPSHOT_KEY, JSON.stringify(snapshot));
}

export const accountConnectWindow = {
  assign(url: string): void {
    window.location.assign(url);
  },
};

export function startGoogleAccountConnect(clientId?: string): string {
  const state = randomUrlSafe(16);
  writePending({ provider: "google", state, createdAt: Date.now() });
  markOnboardConnectionsReturn();
  return buildGoogleAccountConnectUrl({ state, clientId });
}

export async function startMicrosoftAccountConnect(clientId?: string): Promise<string> {
  const state = randomUrlSafe(16);
  const codeVerifier = randomUrlSafe(32);
  writePending({
    provider: "microsoft",
    state,
    createdAt: Date.now(),
    codeVerifier,
  });
  markOnboardConnectionsReturn();
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
): PendingAccountConnect | null {
  if (!state) {
    return null;
  }
  const pending = readPending();
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
  provider: AccountConnectProvider,
  email: string | null,
): ConnectedMailboxSnapshot {
  const current = readConnectedMailboxSnapshot();
  if (provider === "google") {
    return {
      googleEmail: email ?? current.googleEmail,
      microsoftEmail: current.microsoftEmail,
    };
  }
  return {
    googleEmail: current.googleEmail,
    microsoftEmail: email ?? current.microsoftEmail,
  };
}
