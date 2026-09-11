import { useRef, useState } from "react";
import styled from "styled-components";
import { VerifyPhoneCta, PACK_VERIFY_SMS_E164 } from "./VerifyPhoneCta";

export type VerifyPhoneStepProps = {
  readonly issueVerifyCode: (phone: string) => Promise<void>;
  readonly confirmVerifyCode: (code: string) => Promise<void>;
  readonly onVerified: () => void;
  readonly onSkip: () => void;
};

const OTP_BOX_COUNT = 6;
const RESEND_LOCK_MS = 30_000;
const MISMATCH_COPY = "That code didn't match. Try again.";

type StepPhase = "idle" | "sent" | "confirmed";

function emptyOtpBoxesBecauseUnset(): string[] {
  return ["", "", "", "", "", ""];
}

function phoneReadyBecauseNonEmpty(phone: string): boolean {
  return phone.trim().length > 0;
}

function firstNumericDigitBecauseOtpBox(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  if (digits.length === 0) {
    return "";
  }
  return digits.charAt(digits.length - 1);
}

function textFromClipboardBecausePaste(
  data: { getData: (type: string) => string } | null,
): string {
  if (data === null) {
    return "";
  }
  const plain = data.getData("text/plain");
  if (plain.length > 0) {
    return plain;
  }
  const text = data.getData("text");
  if (text.length > 0) {
    return text;
  }
  return "";
}

function sixOtpDigitsBecausePaste(raw: string): string[] {
  const only = raw.replace(/\D/g, "").slice(0, OTP_BOX_COUNT);
  const boxes = emptyOtpBoxesBecauseUnset();
  for (let i = 0; i < only.length; i += 1) {
    boxes[i] = only.charAt(i);
  }
  return boxes;
}

function joinedOtpBecauseBoxes(digits: string[]): string {
  return digits.join("");
}

const Root = styled.div`
  display: grid;
  gap: ${({ theme }) => theme.spacing[3]};
  max-width: 28rem;
`;

const Title = styled.h2`
  margin: 0;
  color: ${({ theme }) => theme.colors.text.primary};
  font-size: ${({ theme }) => theme.typography.fontSizes.xl};
  font-weight: ${({ theme }) => theme.typography.fontWeights.bold};
`;

const PhoneInput = styled.input`
  display: block;
  width: 100%;
  padding: ${({ theme }) => theme.spacing[2]} ${({ theme }) => theme.spacing[3]};
  background-color: ${({ theme }) => theme.colors.background.input};
  border: 1px solid ${({ theme }) => theme.colors.border.input};
  border-radius: var(--border-radius);
  color: ${({ theme }) => theme.colors.text.primary};
  height: 50px;
  font-size: ${({ theme }) => theme.typography.fontSizes.base};

  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.primary.main};
    background-color: ${({ theme }) => theme.colors.background.inputFocus};
    box-shadow: ${({ theme }) => theme.colors.shadow.primary};
  }
`;

const PrimaryButton = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.45rem;
  padding: 0.85rem 1.2rem;
  width: 100%;
  border-radius: 999px;
  border: none;
  background: ${({ theme }) => theme.colors.gradients.primaryButton};
  color: ${({ theme }) => theme.colors.background.primary};
  font-weight: ${({ theme }) => theme.typography.fontWeights.bold};
  cursor: pointer;
  transition:
    transform 0.15s ease,
    box-shadow 0.15s ease,
    opacity 0.12s ease;

  &:hover:not(:disabled) {
    transform: translateY(-1px);
    box-shadow: 0 16px 32px rgba(243, 210, 122, 0.22);
  }

  &:disabled {
    cursor: wait;
    opacity: 0.72;
  }
`;

const OtpRow = styled.div`
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: ${({ theme }) => theme.spacing[2]};
`;

const OtpBox = styled.input`
  width: 100%;
  height: 50px;
  text-align: center;
  font-size: ${({ theme }) => theme.typography.fontSizes.xl};
  background-color: ${({ theme }) => theme.colors.background.input};
  border: 1px solid ${({ theme }) => theme.colors.border.input};
  border-radius: var(--border-radius);
  color: ${({ theme }) => theme.colors.text.primary};

  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.primary.main};
    background-color: ${({ theme }) => theme.colors.background.inputFocus};
    box-shadow: ${({ theme }) => theme.colors.shadow.primary};
  }
`;

const ResendButton = styled.button`
  justify-self: start;
  padding: 0;
  border: none;
  background: none;
  color: ${({ theme }) => theme.colors.text.primary};
  font-weight: ${({ theme }) => theme.typography.fontWeights.semibold};
  cursor: pointer;

  &:disabled {
    color: ${({ theme }) => theme.colors.text.tertiary};
    cursor: not-allowed;
  }
`;

const SkipLink = styled.button`
  justify-self: start;
  padding: 0;
  border: none;
  background: none;
  color: ${({ theme }) => theme.colors.text.secondary};
  font-size: ${({ theme }) => theme.typography.fontSizes.small};
  cursor: pointer;
  text-decoration: underline;
`;

const ErrorCopy = styled.p`
  margin: 0;
  color: ${({ theme }) => theme.colors.text.primary};
  font-size: ${({ theme }) => theme.typography.fontSizes.small};
`;

const FallbackNote = styled.p`
  margin: 0;
  color: ${({ theme }) => theme.colors.text.tertiary};
  font-size: ${({ theme }) => theme.typography.fontSizes.xs};
`;

const QuietFallback = styled.div`
  display: grid;
  gap: ${({ theme }) => theme.spacing[2]};
`;

export const VerifyPhoneStep: React.FC<VerifyPhoneStepProps> = ({
  issueVerifyCode,
  confirmVerifyCode,
  onVerified,
  onSkip,
}) => {
  const [phase, setPhase] = useState<StepPhase>("idle");
  const [phone, setPhone] = useState("");
  const [issuedPhone, setIssuedPhone] = useState("");
  const [otpDigits, setOtpDigits] = useState<string[]>(emptyOtpBoxesBecauseUnset);
  const [resendReady, setResendReady] = useState(false);
  const [issuing, setIssuing] = useState(false);
  const [errorCopy, setErrorCopy] = useState<string | null>(null);
  const resendTimerRef = useRef<number | undefined>(undefined);
  const otpRefs = useRef<Array<HTMLInputElement | null>>(
    emptyOtpBoxesBecauseUnset().map(() => null),
  );
  const confirmInFlightRef = useRef(false);

  const startResendLockBecauseCodeIssued = (): void => {
    setResendReady(false);
    const existing = resendTimerRef.current;
    if (existing !== undefined) {
      window.clearTimeout(existing);
    }
    resendTimerRef.current = window.setTimeout(() => {
      setResendReady(true);
      resendTimerRef.current = undefined;
    }, RESEND_LOCK_MS);
  };

  const runConfirm = async (code: string): Promise<void> => {
    if (code.length !== OTP_BOX_COUNT) {
      return;
    }
    if (confirmInFlightRef.current) {
      return;
    }
    confirmInFlightRef.current = true;
    setErrorCopy(null);
    try {
      await confirmVerifyCode(code);
      setPhase("confirmed");
      onVerified();
    } catch {
      setErrorCopy(MISMATCH_COPY);
    } finally {
      confirmInFlightRef.current = false;
    }
  };

  const applyOtpDigits = (next: string[]): void => {
    setOtpDigits(next);
    const joined = joinedOtpBecauseBoxes(next);
    if (joined.length === OTP_BOX_COUNT) {
      void runConfirm(joined);
    }
  };

  const onTextMeTheCode = async (): Promise<void> => {
    if (!phoneReadyBecauseNonEmpty(phone)) {
      return;
    }
    setIssuing(true);
    setErrorCopy(null);
    try {
      const trimmed = phone.trim();
      await issueVerifyCode(trimmed);
      setIssuedPhone(trimmed);
      setOtpDigits(emptyOtpBoxesBecauseUnset());
      setPhase("sent");
      startResendLockBecauseCodeIssued();
    } catch {
      setErrorCopy("We couldn't send that code. Try again.");
    } finally {
      setIssuing(false);
    }
  };

  const onResend = async (): Promise<void> => {
    if (!phoneReadyBecauseNonEmpty(issuedPhone)) {
      return;
    }
    setErrorCopy(null);
    await issueVerifyCode(issuedPhone);
    startResendLockBecauseCodeIssued();
  };

  const onDigitChange = (index: number, raw: string): void => {
    const digit = firstNumericDigitBecauseOtpBox(raw);
    const next = otpDigits.map((current, i) => {
      if (i === index) {
        return digit;
      }
      return current;
    });
    applyOtpDigits(next);
    if (digit.length === 1 && index < OTP_BOX_COUNT - 1) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const onPasteOtp = (event: React.ClipboardEvent<HTMLInputElement>): void => {
    event.preventDefault();
    const pasted = textFromClipboardBecausePaste(event.clipboardData);
    applyOtpDigits(sixOtpDigitsBecausePaste(pasted));
  };

  const showOtp = phase === "sent" || phase === "confirmed";

  return (
    <Root data-testid="verify-phone-step">
      <Title>Verify your number</Title>
      {phase === "idle" ? (
        <>
          <PhoneInput
            type="tel"
            autoComplete="tel"
            inputMode="tel"
            aria-label="Phone number"
            value={phone}
            onChange={(event) => {
              setPhone(event.target.value);
            }}
          />
          <PrimaryButton
            type="button"
            disabled={issuing || !phoneReadyBecauseNonEmpty(phone)}
            onClick={() => {
              void onTextMeTheCode();
            }}
          >
            Text me the code
          </PrimaryButton>
        </>
      ) : null}
      {showOtp ? (
        <>
          <OtpRow>
            {otpDigits.map((digit, index) => (
              <OtpBox
                key={`otp-${index}`}
                ref={(node) => {
                  otpRefs.current[index] = node;
                }}
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={1}
                aria-label={`Digit ${index + 1} of 6`}
                value={digit}
                onChange={(event) => {
                  onDigitChange(index, event.target.value);
                }}
                onPaste={onPasteOtp}
              />
            ))}
          </OtpRow>
          <ResendButton
            type="button"
            disabled={!resendReady}
            onClick={() => {
              void onResend();
            }}
          >
            Resend
          </ResendButton>
        </>
      ) : null}
      {errorCopy !== null ? <ErrorCopy role="alert">{errorCopy}</ErrorCopy> : null}
      <SkipLink
        type="button"
        onClick={() => {
          onSkip();
        }}
      >
        Skip for now
      </SkipLink>
      <QuietFallback>
        <FallbackNote>Or text Pack at {PACK_VERIFY_SMS_E164}</FallbackNote>
        <VerifyPhoneCta />
      </QuietFallback>
    </Root>
  );
};

export default VerifyPhoneStep;
