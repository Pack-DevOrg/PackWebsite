import React, { useState } from "react";
import { ApiRequestError, createApiClient } from "@/api/client";

export const ACCESS_CODE_LABEL = "Invite code";
export const ACCESS_CODE_SUBMIT = "Redeem";
export const ACCESS_CODE_FALLBACK_ERROR =
  "We could not check that code. Try again.";

const REASON_LINES: Readonly<Record<string, string>> = {
  invalid: "That code is not valid.",
  not_found: "That code is not valid.",
  expired: "That code has expired.",
  exhausted: "That code has no uses left.",
  already_redeemed: "That code was already used.",
  rate_limited: "Too many tries. Wait a minute and try again.",
};

/** One line per reason; unknown reasons fall back to the server message. */
export function accessCodeErrorLine(error: unknown): string {
  if (error instanceof ApiRequestError) {
    const details = error.details;
    const record =
      details !== null && typeof details === "object"
        ? (details as Record<string, unknown>)
        : {};
    const nested =
      record.error !== null && typeof record.error === "object"
        ? ((record.error as Record<string, unknown>).details as
            | Record<string, unknown>
            | undefined)
        : undefined;
    const reason = nested?.reason ?? record.reason;
    if (typeof reason === "string" && REASON_LINES[reason] !== undefined) {
      return REASON_LINES[reason];
    }
    if (error.message.trim().length > 0) {
      return error.message;
    }
  }
  return ACCESS_CODE_FALLBACK_ERROR;
}

/** Normalizes the `?code=` URL param (invite links) into the field value. */
export function accessCodeFromSearch(search: string): string {
  return (new URLSearchParams(search).get("code") ?? "").trim().toUpperCase();
}

export interface AccessCodeFieldProps {
  readonly initialCode?: string;
  readonly getAccessToken: () => Promise<string | null>;
  readonly tokenType: string;
  readonly onRedeemed: () => void;
}

export function AccessCodeField(props: AccessCodeFieldProps): React.ReactElement {
  const [code, setCode] = useState((props.initialCode ?? "").toUpperCase());
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(event: React.FormEvent): Promise<void> {
    event.preventDefault();
    const trimmed = code.trim();
    if (trimmed.length === 0 || busy) {
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const client = createApiClient(
        async () => props.getAccessToken(),
        () => props.tokenType,
      );
      await client.request<unknown>({
        path: "/access/redeem",
        method: "POST",
        body: { code: trimmed },
      });
      props.onRedeemed();
    } catch (caught) {
      setError(accessCodeErrorLine(caught));
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={(event) => void submit(event)}>
      <label htmlFor="access-code">{ACCESS_CODE_LABEL}</label>
      <input
        id="access-code"
        value={code}
        autoCapitalize="characters"
        autoComplete="off"
        onChange={(event) => setCode(event.target.value.toUpperCase())}
      />
      {error !== null ? <p role="alert">{error}</p> : null}
      <button type="submit" disabled={busy}>
        {ACCESS_CODE_SUBMIT}
      </button>
    </form>
  );
}
