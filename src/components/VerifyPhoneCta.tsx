import { useState } from "react";
import styled from "styled-components";
import { MessageCircle } from "lucide-react";
import { mintPhoneVerificationStart } from "@/api/client";
import { useApiClient } from "@/api/useApiClient";
import { useAuth } from "@/auth/AuthContext";

export const PACK_VERIFY_SMS_E164 = "+13054392989";

export type VerifyPhoneCtaProps = {
  readonly locationHrefTarget?: { href: string };
};

export function deviceOpensSmsHrefBecauseMobileUa(): boolean {
  if (typeof navigator === "undefined") {
    return false;
  }
  return /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
}

function locationHrefTargetBecauseWindow(
  injected: { href: string } | undefined,
): { href: string } {
  if (injected === undefined) {
    return window.location;
  }
  return injected;
}

const Root = styled.div`
  display: grid;
  gap: 0.75rem;
`;

const CtaButton = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  padding: 0.85rem 1.2rem;
  width: fit-content;
  border-radius: 999px;
  border: none;
  background: ${({ theme }) => theme.colors.gradients.primaryButton};
  color: ${({ theme }) => theme.colors.background.primary};
  font-weight: 700;
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

  svg {
    width: 18px;
    height: 18px;
  }
`;

const FallbackCopy = styled.p`
  margin: 0;
  color: var(--color-text-secondary);
  font-size: 0.88rem;
`;

export const VerifyPhoneCta: React.FC<VerifyPhoneCtaProps> = ({
  locationHrefTarget,
}) => {
  const { status } = useAuth();
  const apiClient = useApiClient();
  const [fallbackCode, setFallbackCode] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const hrefTarget = locationHrefTargetBecauseWindow(locationHrefTarget);

  const onClick = async () => {
    setPending(true);
    setErrorMessage(null);
    try {
      const minted = await mintPhoneVerificationStart(
        status === "authenticated" ? apiClient : undefined,
      );
      if (deviceOpensSmsHrefBecauseMobileUa()) {
        hrefTarget.href = minted.smsHref;
        return;
      }
      setFallbackCode(minted.code);
    } catch {
      setErrorMessage("Unable to start verification.");
    } finally {
      setPending(false);
    }
  };

  return (
    <Root data-testid="verify-phone-cta">
      <CtaButton
        type="button"
        onClick={() => {
          void onClick();
        }}
        disabled={pending}
      >
        <MessageCircle aria-hidden="true" />
        Text Pack
      </CtaButton>
      {fallbackCode !== null ? (
        <FallbackCopy>
          Text {PACK_VERIFY_SMS_E164} with {fallbackCode}
        </FallbackCopy>
      ) : null}
      {errorMessage !== null ? (
        <FallbackCopy role="alert">{errorMessage}</FallbackCopy>
      ) : null}
    </Root>
  );
};

export default VerifyPhoneCta;
