import { useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import styled, { keyframes } from "styled-components";
import { AlertTriangle, Loader2 } from "lucide-react";
import { useAuth } from "@/auth/AuthContext";
import { appConfig } from "@/config/appConfig";
import { clearLogoutIntent, hasLogoutIntent } from "@/auth/tokenStorage";
import { useMountEffect } from "@/hooks/useMountEffect";
import { useConversionTracking } from "@/hooks/useConversionTracking";
import { useI18n } from "@/i18n/I18nProvider";
import packLogo from "@/assets/logo.png";

const Container = styled.div`
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background:
    radial-gradient(circle at top, rgba(240, 198, 45, 0.16), transparent 34%),
    linear-gradient(180deg, #08050e 0%, #100914 45%, #05030b 100%);
  color: ${({ theme }) => theme?.colors?.neutral?.gray050 ?? "#ffffff"};
  padding: 2rem;
`;

const Card = styled.div`
  width: min(520px, 100%);
  background:
    linear-gradient(180deg, rgba(23, 16, 30, 0.9), rgba(9, 7, 18, 0.92)),
    rgba(9, 7, 18, 0.88);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 28px;
  padding: clamp(1.9rem, 5vw, 3rem);
  display: grid;
  gap: 1rem;
  box-shadow: 0 32px 80px rgba(5, 3, 12, 0.62);
  text-align: center;
`;

const LogoBadge = styled.div`
  width: 76px;
  height: 76px;
  margin: 0 auto 0.15rem;
  border-radius: 22px;
  display: grid;
  place-items: center;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.03));
  border: 1px solid rgba(255, 255, 255, 0.09);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.06);
`;

const Logo = styled.img`
  width: 46px;
  height: 46px;
  object-fit: contain;
`;

const Eyebrow = styled.p`
  margin: 0;
  color: ${({ theme }) => theme?.colors?.brand?.primary ?? "#f0c62d"};
  font-size: 0.76rem;
  font-weight: 800;
  letter-spacing: 0.18em;
  text-transform: uppercase;
`;

const spin = keyframes`
  to {
    transform: rotate(360deg);
  }
`;

const LoadingIcon = styled(Loader2)`
  width: 42px;
  height: 42px;
  margin: 0 auto;
  animation: ${spin} 1.2s linear infinite;
  color: ${({ theme }) => theme?.colors?.brand?.primary ?? "#f0c62d"};
`;

const ErrorIcon = styled(AlertTriangle)`
  width: 42px;
  height: 42px;
  margin: 0 auto;
  color: ${({ theme }) => theme?.colors?.brand?.secondary ?? "#e72340"};
`;

const Heading = styled.h2`
  margin: 0;
  font-size: clamp(1.4rem, 3.2vw, 1.9rem);
  font-weight: 600;
`;

const Message = styled.p`
  margin: 0 auto;
  max-width: 44ch;
  font-size: 1rem;
  line-height: 1.6;
  color: ${({ theme }) => theme?.colors?.neutral?.gray200 ?? "#d5d6dc"};
`;

const FooterNote = styled.p`
  margin: 0.2rem 0 0;
  color: rgba(213, 214, 220, 0.62);
  font-size: 0.9rem;
  line-height: 1.5;
`;

const RetryButton = styled.button`
  margin: 0 auto;
  padding: 0.75rem 1.5rem;
  border-radius: 999px;
  border: none;
  background: ${({ theme }) => theme?.colors?.brand?.primary ?? "#f0c62d"};
  color: ${({ theme }) => theme?.colors?.neutral?.gray950 ?? "#05030b"};
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.2s ease;

  &:hover {
    transform: translateY(-1px);
  }
`;

type CallbackState = "processing" | "error";
const processedCallbackKeys = new Set<string>();

const isAbsoluteRedirectUrl = (value: string): boolean =>
  /^https?:\/\//i.test(value);

const bootstrapAuthenticatedUser = async (
  accessToken: string,
  tokenType: string,
): Promise<void> => {
  const response = await fetch(`${appConfig.apiBaseUrl}/user/information`, {
    method: "GET",
    headers: {
      Accept: "application/json",
      Authorization: `${tokenType || "Bearer"} ${accessToken}`,
    },
  });

  if (!response.ok) {
    const details = await response.text().catch(() => "");
    throw new Error(
      details?.trim() ||
        "We couldn't finish preparing your account. Please try again.",
    );
  }
};

const AuthCallbackPageInstance: React.FC<{ readonly search: string }> = ({
  search,
}) => {
  const navigate = useNavigate();
  const { pathFor } = useI18n();
  const { completeLogin, login } = useAuth();
  const { trackConversion } = useConversionTracking();

  const [state, setState] = useState<CallbackState>("processing");
  const [errorMessage, setErrorMessage] = useState<string>(
    "Attempting to complete your sign-in. This should only take a moment."
  );

  useMountEffect(() => {
    if (hasLogoutIntent()) {
      clearLogoutIntent();
      navigate(pathFor("/"), { replace: true });
      return;
    }

    const searchParams = new URLSearchParams(search);
    const code = searchParams.get("code");
    const oauthState = searchParams.get("state");
    const error = searchParams.get("error");
    const description =
      searchParams.get("error_description") ?? "Authentication failed.";

    if (error) {
      setState("error");
      setErrorMessage(decodeURIComponent(description));
      return;
    }

    if (!code || !oauthState) {
      setState("error");
      setErrorMessage(
        "We couldn't complete the sign-in because the callback is missing required parameters. Please try signing in again."
      );
      return;
    }

    const callbackKey = `${code}:${oauthState}`;
    if (processedCallbackKeys.has(callbackKey)) {
      return;
    }
    processedCallbackKeys.add(callbackKey);

    void completeLogin(code, oauthState)
      .then(async ({ redirectPath, accessToken, tokenType }) => {
        if (accessToken) {
          await bootstrapAuthenticatedUser(accessToken, tokenType);
        }

        trackConversion('login', {
          auth_provider: 'google',
          event_category: 'conversion',
          event_label: 'oauth_callback_success',
        });
        window.history.replaceState({}, document.title, location.pathname);
        if (redirectPath && isAbsoluteRedirectUrl(redirectPath)) {
          window.location.replace(redirectPath);
          return;
        }
        navigate(redirectPath ?? pathFor("/app"), { replace: true });
      })
      .catch((errorCause) => {
        window.history.replaceState({}, document.title, location.pathname);
        setState("error");
        setErrorMessage(
          errorCause instanceof Error
            ? errorCause.message
            : "We couldn’t finish signing you in. Please try again."
        );
      });
  });

  if (state === "processing") {
    return (
      <Container>
        <Card>
          <LogoBadge>
            <Logo src={packLogo} alt="Pack" />
          </LogoBadge>
          <Eyebrow>Pack</Eyebrow>
          <LoadingIcon aria-hidden="true" />
          <Heading>Finalizing your sign-in…</Heading>
          <Message>
            We&apos;re getting your travel profile ready so your next page feels
            like it already knows you.
          </Message>
          <Message>{errorMessage}</Message>
          <FooterNote>Built with ❤️ for travellers.</FooterNote>
        </Card>
      </Container>
    );
  }

  return (
    <Container>
      <Card>
        <LogoBadge>
          <Logo src={packLogo} alt="Pack" />
        </LogoBadge>
        <Eyebrow>Pack</Eyebrow>
        <ErrorIcon aria-hidden="true" />
        <Heading>We hit a snag finishing your sign-in</Heading>
        <Message>{errorMessage}</Message>
        <FooterNote>Built with ❤️ for travellers.</FooterNote>
        <RetryButton onClick={() => login({ redirectPath: pathFor("/app") })}>
          Try Again
        </RetryButton>
      </Card>
    </Container>
  );
};

export const AuthCallbackPage: React.FC = () => {
  const location = useLocation();
  const callbackKey = useMemo(() => location.search || "__empty__", [location.search]);

  return <AuthCallbackPageInstance key={callbackKey} search={location.search} />;
};
