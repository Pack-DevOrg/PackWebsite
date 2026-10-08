import React, { useState } from "react";

export const ACCESS_CODE_LABEL = "Access code";
export const ACCESS_CODE_SUBMIT = "Redeem code";

export function normalizeAccessCode(raw: string): string {
  return raw.replace(/\s+/g, "").toUpperCase();
}

/** Reads the access code a link carries, from `?code=` or `?access_code=`. */
export function accessCodeFromSearch(search: string): string {
  const params = new URLSearchParams(search);
  return normalizeAccessCode(
    params.get("code") ?? params.get("access_code") ?? "",
  );
}

const ERROR_LINES: Record<string, string> = {
  invalid: "That code isn't valid. Check it and try again.",
  expired: "That code has expired.",
  used: "That code has already been used.",
};

export function accessCodeErrorLine(reason: string | null | undefined): string {
  if (!reason) return "";
  return ERROR_LINES[reason] ?? "We couldn't redeem that code. Try again.";
}

export interface AccessCodeFieldProps {
  initialCode?: string;
  errorReason?: string | null;
  submitting?: boolean;
  onSubmit: (code: string) => void;
}

export function AccessCodeField({
  initialCode = "",
  errorReason = null,
  submitting = false,
  onSubmit,
}: AccessCodeFieldProps): React.ReactElement {
  const [code, setCode] = useState(() => normalizeAccessCode(initialCode));
  const errorLine = accessCodeErrorLine(errorReason);
  const canSubmit = code.length > 0 && !submitting;

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        if (canSubmit) onSubmit(code);
      }}
    >
      <label htmlFor="access-code-input">{ACCESS_CODE_LABEL}</label>
      <input
        id="access-code-input"
        value={code}
        autoComplete="off"
        autoCapitalize="characters"
        aria-invalid={errorLine ? true : undefined}
        onChange={(event) => setCode(normalizeAccessCode(event.target.value))}
      />
      {errorLine ? <p role="alert">{errorLine}</p> : null}
      <button type="submit" disabled={!canSubmit}>
        {ACCESS_CODE_SUBMIT}
      </button>
    </form>
  );
}
