import React, { Suspense, useLayoutEffect } from "react";
import {
  BrowserRouter,
  Navigate,
  useLocation,
} from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { ThemeProvider } from "./styles/ThemeProvider";

import ConsentBanner from "./components/ConsentBanner";
import TrackingProvider, { useTracking } from "./components/TrackingProvider";
import PerformanceProvider from "./components/PerformanceProvider";
import { useMountEffect } from "./hooks/useMountEffect";
import { I18nProvider } from "./i18n/I18nProvider";
import { stripLocaleFromPath } from "./i18n/config";
import HomePage from "./routes/HomePage";
import { WebMcpRegistrar } from "./agent/webMcp";
import { env } from "./utils/env";

interface RuntimeErrorBoundaryState {
  readonly hasError: boolean;
}

class RuntimeErrorBoundary extends React.Component<
  { readonly children: React.ReactNode },
  RuntimeErrorBoundaryState
> {
  override state: RuntimeErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): RuntimeErrorBoundaryState {
    return { hasError: true };
  }

  override componentDidCatch(error: Error, info: React.ErrorInfo): void {
    console.error("Pack website runtime error", {
      error,
      componentStack: info.componentStack,
    });
  }

  override render(): React.ReactNode {
    if (this.state.hasError) {
      return (
        <main
          style={{
            alignItems: "center",
            display: "flex",
            minHeight: "100vh",
            padding: "24px",
          }}
        >
          <section
            style={{
              margin: "0 auto",
              maxWidth: "560px",
            }}
          >
            <h1>Pack is having trouble loading.</h1>
            <p>Please refresh the page and try again.</p>
          </section>
        </main>
      );
    }

    return this.props.children;
  }
}

export const AppRoutes: React.FC = () => (
  <I18nProvider>
    <>
      <RouteTrackingCoordinator />
      <HomeRouteSwitch />
      <ConsentBanner />
    </>
  </I18nProvider>
);

const NonHomeRuntime = React.lazy(() => import("./routes/NonHomeRuntime"));

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
    return (
      <>
        <HomeServiceWorkerCleanup />
        <HomePage />
      </>
    );
  }

  return (
    <Suspense fallback={null}>
      <NonHomeRuntime />
    </Suspense>
  );
};

const HomeServiceWorkerCleanup: React.FC = () => {
  useLayoutEffect(() => {
    if (
      env.DEV === true ||
      typeof navigator === "undefined" ||
      !("serviceWorker" in navigator)
    ) {
      return;
    }

    void navigator.serviceWorker.getRegistrations().then((registrations) => {
      registrations
        .filter((registration) => registration.scope.endsWith("/app/"))
        .forEach((registration) => {
          void registration.unregister();
        });
    });
  }, []);

  return null;
};

const RouteTrackingCoordinator: React.FC = () => {
  const location = useLocation();
  const { trackPageView } = useTracking();

  useLayoutEffect(() => {
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
  const providerTree = (
    <ThemeProvider>
      <PerformanceProvider>
        <TrackingProvider>{children}</TrackingProvider>
      </PerformanceProvider>
    </ThemeProvider>
  );

  return <HelmetProvider context={helmetContext}>{providerTree}</HelmetProvider>;
};

const App: React.FC = () => (
  <>
    <DynamicImportRecovery />
    <WebMcpRegistrar />
    <AppProviders>
      <RuntimeErrorBoundary>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </RuntimeErrorBoundary>
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
