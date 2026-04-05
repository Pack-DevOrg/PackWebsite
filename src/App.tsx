import React, { Suspense, useEffect, useState } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import {
  BrowserRouter,
  Navigate,
  useLocation,
} from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { ThemeProvider } from "./styles/ThemeProvider";

import ConsentBanner from "./components/ConsentBanner";
import TrackingProvider, { useTracking } from "./components/TrackingProvider";
import ServiceWorkerProvider from "./components/ServiceWorkerProvider";
import PerformanceProvider from "./components/PerformanceProvider";
import { useMountEffect } from "./hooks/useMountEffect";
import { I18nProvider } from "./i18n/I18nProvider";
import { stripLocaleFromPath } from "./i18n/config";
import { createQueryClient } from "./queryClient";
import HomePage from "./routes/HomePage";

export const AppRoutes: React.FC = () => (
  <I18nProvider>
    <>
      <RouteTrackingCoordinator />
      <HomeRouteSwitch />
      <ConsentBanner />
    </>
  </I18nProvider>
);

const NonHomeApp = React.lazy(() => import("./routes/NonHomeApp"));

const HomeRouteSwitch: React.FC = () => {
  const location = useLocation();
  const normalizedPath = stripLocaleFromPath(location.pathname);
  const hasLocalePrefix = normalizedPath !== location.pathname;
  const isHomePath = normalizedPath === "/" || normalizedPath === "/verify";

  if (hasLocalePrefix) {
    return (
      <Navigate
        to={`${normalizedPath}${location.search}${location.hash}`}
        replace
      />
    );
  }

  if (isHomePath) {
    return <HomePage />;
  }

  return (
    <Suspense fallback={null}>
      <NonHomeApp />
    </Suspense>
  );
};

const RouteTrackingCoordinator: React.FC = () => {
  const location = useLocation();
  const { trackPageView } = useTracking();

  useEffect(() => {
    const pagePath = `${location.pathname}${location.search}${location.hash}` || "/";
    trackPageView(pagePath);
  }, [location.hash, location.pathname, location.search, trackPageView]);

  return null;
};

interface AppProvidersProps {
  readonly children: React.ReactNode;
  readonly helmetContext?: Record<string, unknown> | undefined;
}

export const AppProviders: React.FC<AppProvidersProps> = ({
  children,
  helmetContext,
}) => {
  const [queryClient] = useState(() => createQueryClient());
  const providerTree =
    typeof window === "undefined" ? (
      <ThemeProvider>
        <QueryClientProvider client={queryClient}>
          <TrackingProvider>{children}</TrackingProvider>
        </QueryClientProvider>
      </ThemeProvider>
    ) : (
      <ThemeProvider>
        <QueryClientProvider client={queryClient}>
          <PerformanceProvider>
            <ServiceWorkerProvider>
              <TrackingProvider>{children}</TrackingProvider>
            </ServiceWorkerProvider>
          </PerformanceProvider>
        </QueryClientProvider>
      </ThemeProvider>
    );

  return <HelmetProvider context={helmetContext}>{providerTree}</HelmetProvider>;
};

const App: React.FC = () => (
  <>
    <DynamicImportRecovery />
    <AppProviders>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AppProviders>
  </>
);

const DYNAMIC_IMPORT_RELOAD_KEY = "pack_dynamic_import_reload_attempted";

const isDynamicImportFailure = (message: string): boolean =>
  /Failed to fetch dynamically imported module|Importing a module script failed|ChunkLoadError/i.test(
    message
  );

const DynamicImportRecovery: React.FC = () => {
  useMountEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const attemptRefresh = () => {
      if (sessionStorage.getItem(DYNAMIC_IMPORT_RELOAD_KEY) === "1") {
        return;
      }
      sessionStorage.setItem(DYNAMIC_IMPORT_RELOAD_KEY, "1");
      window.location.reload();
    };

    const handleError = (event: ErrorEvent) => {
      if (event?.message && isDynamicImportFailure(event.message)) {
        attemptRefresh();
      }
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      const reason = event.reason;
      const message =
        typeof reason === "string"
          ? reason
          : reason instanceof Error
            ? reason.message
            : "";

      if (message && isDynamicImportFailure(message)) {
        attemptRefresh();
      }
    };

    window.addEventListener("error", handleError);
    window.addEventListener("unhandledrejection", handleUnhandledRejection);

    return () => {
      window.removeEventListener("error", handleError);
      window.removeEventListener("unhandledrejection", handleUnhandledRejection);
    };
  });

  return null;
};

export default App;
