import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { createApiClient } from "@/api/client";
import {
  clearPendingAccountConnect,
  emailFromAccountConnectResponse,
  googleAccountConnectBody,
  markOnboardConnectionsReturn,
  microsoftAccountConnectBody,
  pendingMatchesCallback,
  snapshotWithConnectedEmail,
  USER_ACCOUNTS_PATH,
  writeConnectedMailboxSnapshot,
  type AccountConnectProvider,
} from "@/auth/accountConnect";
import { AuthProvider, useAuth } from "@/auth/AuthContext";
import { ONBOARD_PATH } from "@/pages/OnboardPage";

function providerFromPath(pathname: string): AccountConnectProvider {
  if (pathname.includes("/microsoft")) {
    return "microsoft";
  }
  return "google";
}

function CallbackFlow(): React.ReactElement {
  const navigate = useNavigate();
  const location = useLocation();
  const { status, getAccessToken, tokens } = useAuth();
  const started = useRef(false);
  const [message, setMessage] = useState("Connecting your account…");

  useEffect(() => {
    if (status === "loading" || started.current) {
      return;
    }
    started.current = true;
    const provider = providerFromPath(location.pathname);
    const params = new URLSearchParams(location.search);
    const oauthError = params.get("error");
    if (oauthError) {
      clearPendingAccountConnect();
      setMessage("Google or Microsoft declined the connection. Return to onboarding and try again.");
      return;
    }
    const code = params.get("code");
    const pending = pendingMatchesCallback(provider, params.get("state"));
    if (!code || !pending) {
      setMessage("This connection link is missing or expired. Return to onboarding and try again.");
      return;
    }
    if (status !== "authenticated") {
      setMessage("Sign in again, then connect the account from onboarding.");
      return;
    }

    const client = createApiClient(
      getAccessToken,
      () => tokens?.tokenType ?? "Bearer",
    );
    const body =
      provider === "google"
        ? googleAccountConnectBody(code)
        : microsoftAccountConnectBody(code, pending.codeVerifier);

    void client
      .request<unknown, typeof body>({
        path: USER_ACCOUNTS_PATH,
        method: "POST",
        body,
      })
      .then((payload) => {
        const email = emailFromAccountConnectResponse(payload);
        writeConnectedMailboxSnapshot(snapshotWithConnectedEmail(provider, email));
        clearPendingAccountConnect();
        markOnboardConnectionsReturn();
        navigate(ONBOARD_PATH, { replace: true });
      })
      .catch(() => {
        setMessage("Pack could not save that account. Return to onboarding and try again.");
      });
  }, [getAccessToken, location.pathname, location.search, navigate, status, tokens?.tokenType]);

  return (
    <p data-testid="account-connect-callback" role="status">
      {message}
    </p>
  );
}

export function AccountConnectCallbackPage(): React.ReactElement {
  return (
    <AuthProvider>
      <CallbackFlow />
    </AuthProvider>
  );
}

export default AccountConnectCallbackPage;
