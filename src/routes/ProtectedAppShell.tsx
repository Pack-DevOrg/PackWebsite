import React, { useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import styled from "styled-components";
import { AuthProvider, useAuth } from "@/auth/AuthContext";
import {
  clearAuthRetryBlocked,
  hasLogoutIntent,
  isAuthRetryBlocked,
} from "@/auth/tokenStorage";
import { useMountEffect } from "@/hooks/useMountEffect";
import { lazyImportWithRetry } from "@/utils/lazyImportWithRetry";

const AppShell = lazyImportWithRetry(async () => {
  const module = await import("../components/app/AppShell");
  return { default: module.AppShell };
}, "app-shell");

const LoadingScreenContainer = styled.div`
  min-height: 60vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  color: ${({ theme }) => theme?.colors?.neutral?.gray050 ?? "#ffffff"};
  text-align: center;
`;

const LoadingScreen: React.FC<{ readonly message?: string }> = ({
  message = "Loading…",
}) => (
  <LoadingScreenContainer>
    <span
      style={{
        display: "inline-block",
        width: "32px",
        height: "32px",
        borderRadius: "50%",
        border: "3px solid rgba(255,255,255,0.15)",
        borderTopColor: "#f0c62d",
        animation: "spin 1s linear infinite",
      }}
    />
    <p style={{ margin: 0, fontSize: "1rem", opacity: 0.8 }}>{message}</p>
    <style>{`
      @keyframes spin {
        to { transform: rotate(360deg); }
      }
    `}</style>
  </LoadingScreenContainer>
);

const ProtectedRouteLoginCoordinator: React.FC<{
  readonly authRetryBlocked: boolean;
  readonly login: ReturnType<typeof useAuth>["login"];
  readonly loginTriggered: boolean;
  readonly onAuthRetryBlockedChange: React.Dispatch<React.SetStateAction<boolean>>;
  readonly onLoginTriggered: React.Dispatch<React.SetStateAction<boolean>>;
  readonly redirectPath: string;
  readonly status: ReturnType<typeof useAuth>["status"];
}> = ({
  authRetryBlocked,
  login,
  loginTriggered,
  onAuthRetryBlockedChange,
  onLoginTriggered,
  redirectPath,
  status,
}) => {
  useMountEffect(() => {
    const blocked = isAuthRetryBlocked();
    if (blocked !== authRetryBlocked) {
      onAuthRetryBlockedChange(blocked);
    }

    if (
      status === "unauthenticated" &&
      !blocked &&
      !loginTriggered &&
      !hasLogoutIntent()
    ) {
      onLoginTriggered(true);
      void login({ redirectPath });
    }
  });

  return null;
};

const ProtectedRoute: React.FC<{ readonly children: React.ReactNode }> = ({
  children,
}) => {
  const { status, login } = useAuth();
  const location = useLocation();
  const [loginTriggered, setLoginTriggered] = useState(false);
  const [authRetryBlocked, setAuthRetryBlocked] = useState<boolean>(
    isAuthRetryBlocked()
  );

  const redirectPath = location.pathname + location.search + location.hash;
  const loginAttemptKey = `${status}:${redirectPath}:${authRetryBlocked}:${loginTriggered}`;

  if (status === "authenticated") {
    return <>{children}</>;
  }

  if (status === "unauthenticated" && authRetryBlocked) {
    return (
      <LoadingScreenContainer>
        <p style={{ margin: 0, opacity: 0.85 }}>
          Sign-in failed. Auto-retry is paused to prevent loops.
        </p>
        <button
          type="button"
          onClick={() => {
            clearAuthRetryBlocked();
            setAuthRetryBlocked(false);
            setLoginTriggered(false);
            void login({
              redirectPath:
                location.pathname + location.search + location.hash,
            });
          }}
          style={{
            border: "1px solid rgba(255,255,255,0.2)",
            color: "#fff",
            background: "rgba(255,255,255,0.08)",
            borderRadius: 999,
            padding: "0.6rem 1rem",
            cursor: "pointer",
          }}
        >
          Try sign in again
        </button>
      </LoadingScreenContainer>
    );
  }

  return (
    <>
      <ProtectedRouteLoginCoordinator
        key={loginAttemptKey}
        authRetryBlocked={authRetryBlocked}
        login={login}
        loginTriggered={loginTriggered}
        onAuthRetryBlockedChange={setAuthRetryBlocked}
        onLoginTriggered={setLoginTriggered}
        redirectPath={redirectPath}
        status={status}
      />
      <LoadingScreen message="Redirecting you to continue with Google…" />
    </>
  );
};

const ProtectedAppShell: React.FC = () => (
  <AuthProvider>
    <ProtectedRoute>
      <AppShell />
      <Outlet />
    </ProtectedRoute>
  </AuthProvider>
);

export default ProtectedAppShell;
