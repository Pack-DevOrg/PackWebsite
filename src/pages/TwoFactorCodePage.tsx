import { useRef, useState, type ChangeEvent, type FormEvent } from "react";
import { Helmet } from "react-helmet-async";
import { useParams } from "react-router-dom";
import styled from "styled-components";

import { ApiRequestError, requestPublicApi } from "../api/client";

export const TWO_FACTOR_EXPIRED_HEADING = "Pack needs your help — this link expired";
export const TWO_FACTOR_SENT_STATUS = "Got it. Pack is entering the code.";
const TWO_FACTOR_FAILED_STATUS = "That didn't reach Pack. Enter the code again.";
const TWO_FACTOR_INPUT_ID = "two-factor-code";
const SIX_DIGITS = /^\d{6}$/;

export type TwoFactorSubmitResult =
  | { readonly accepted: true }
  | { readonly accepted: false; readonly expired: boolean };

export type SubmitTwoFactorCode = (
  ticket: string,
  code: string,
) => Promise<TwoFactorSubmitResult>;

/**
 * One-shot handoff. The code stays in the request body and is not written to
 * logs, storage, or the URL. 410 means the ticket is expired or already used.
 */
export async function submitTwoFactorCodeBecauseTicket(
  ticket: string,
  code: string,
): Promise<TwoFactorSubmitResult> {
  try {
    await requestPublicApi({
      path: `/2fa/${encodeURIComponent(ticket)}`,
      method: "POST",
      body: { code },
      credentials: "omit",
    });
    return { accepted: true };
  } catch (error) {
    if (error instanceof ApiRequestError) {
      return { accepted: false, expired: error.status === 410 };
    }
    throw error;
  }
}

const PageContainer = styled.main`
  min-height: 80vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 3rem 1.5rem;
  background: ${({ theme }) => theme.colors.background.primary};
`;

const Card = styled.section`
  max-width: 24rem;
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  text-align: center;
`;

const Title = styled.h1`
  font-size: 1.75rem;
  color: ${({ theme }) => theme.colors.text.primary};
`;

const CodeLabel = styled.label`
  color: ${({ theme }) => theme.colors.text.secondary};
`;

const CodeInput = styled.input`
  width: 100%;
  padding: 0.875rem 1rem;
  border-radius: 0.75rem;
  border: 1px solid ${({ theme }) => theme.colors.border.input};
  background: ${({ theme }) => theme.colors.background.input};
  color: ${({ theme }) => theme.colors.text.primary};
  font-size: 1.5rem;
  letter-spacing: 0.25rem;
  text-align: center;
`;

const Status = styled.p`
  color: ${({ theme }) => theme.colors.text.primary};
`;

function digitsOnly(value: string): string {
  return value.replace(/\D/g, "").slice(0, 6);
}

export function TwoFactorCodeView({
  submitCode,
}: {
  readonly submitCode: SubmitTwoFactorCode;
}) {
  const { ticket } = useParams<{ ticket?: string }>();
  const [draft, setDraft] = useState("");
  const [phase, setPhase] = useState<"idle" | "sending" | "sent" | "expired" | "failed">("idle");
  const locked = useRef(false);

  const send = (code: string) => {
    if (!ticket || locked.current || SIX_DIGITS.test(code) !== true) {
      return;
    }
    locked.current = true;
    setDraft("");
    setPhase("sending");
    void (async () => {
      try {
        const result = await submitCode(ticket, code);
        if (result.accepted) {
          setPhase("sent");
          return;
        }
        if (result.expired) {
          setPhase("expired");
          return;
        }
      } catch {
        // The code stays out of the message.
      }
      locked.current = false;
      setPhase("failed");
    })();
  };

  const onChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (locked.current) {
      return;
    }
    const code = digitsOnly(event.target.value);
    setDraft(code);
    if (code.length === 6) {
      send(code);
    }
  };

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    send(digitsOnly(draft));
  };

  const expired = !ticket || phase === "expired";

  return (
    <>
      <Helmet>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>
      <PageContainer>
        <Card>
          {expired ? (
            <Title>{TWO_FACTOR_EXPIRED_HEADING}</Title>
          ) : (
            <>
              <Title>Enter the code</Title>
              <form onSubmit={onSubmit}>
                <CodeLabel htmlFor={TWO_FACTOR_INPUT_ID}>Verification code</CodeLabel>
                <CodeInput
                  id={TWO_FACTOR_INPUT_ID}
                  name="one-time-code"
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  autoFocus
                  autoCapitalize="off"
                  autoCorrect="off"
                  spellCheck={false}
                  pattern="[0-9]*"
                  maxLength={6}
                  enterKeyHint="done"
                  value={draft}
                  onChange={onChange}
                />
              </form>
              {phase === "sent" ? <Status role="status">{TWO_FACTOR_SENT_STATUS}</Status> : null}
              {phase === "failed" ? <Status role="alert">{TWO_FACTOR_FAILED_STATUS}</Status> : null}
            </>
          )}
        </Card>
      </PageContainer>
    </>
  );
}

export default function TwoFactorCodePage() {
  return <TwoFactorCodeView submitCode={submitTwoFactorCodeBecauseTicket} />;
}
