import React, { Suspense, useState } from "react";
import {
  Navigate,
  Outlet,
  Route,
  Routes,
  useLocation,
  useParams,
} from "react-router-dom";
import styled from "styled-components";
import Layout from "@/components/Layout";
import { appConfig, shouldExposeTsaForCurrentHost } from "@/config/appConfig";
import { useI18n } from "@/i18n/I18nProvider";
import { isSupportedLocale, localizePath } from "@/i18n/config";
import PrivacyPolicy from "@/pages/PrivacyPolicy";
import TermsOfService from "@/pages/TermsOfService";
import { useMountEffect } from "@/hooks/useMountEffect";
import { lazyImportWithRetry } from "@/utils/lazyImportWithRetry";
import HomePage from "./HomePage";

const FAQ = React.lazy(() => import("../pages/FAQ"));
const Features = React.lazy(() => import("../pages/Features"));
const HowItWorks = React.lazy(() => import("../pages/HowItWorks"));
const LiveActivityLab = React.lazy(() => import("../pages/LiveActivityLab"));
const PrivacyRequestPage = React.lazy(() => import("../pages/PrivacyRequest"));
const PrivacyRequestVerificationPage = React.lazy(
  () => import("../pages/PrivacyRequestVerificationPage"),
);
const AccessibilityPage = React.lazy(() => import("../pages/Accessibility"));
const SupportPage = React.lazy(() => import("../pages/Support"));
const UnsubscribePage = React.lazy(() => import("../pages/UnsubscribePage"));
const EmailForwardingSetupPage = React.lazy(
  () => import("../pages/EmailForwardingSetup")
);
const SharedTravelPlan = React.lazy(async () => {
  const module = await import("../pages/SharedTravelPlan");
  return { default: module.SharedTravelPlan };
});
const LinkedTripInviteLanding = React.lazy(async () => {
  const module = await import("../pages/LinkedTripInviteLanding");
  return { default: module.LinkedTripInviteLanding };
});
const VoiceSearchOptimization = React.lazy(
  () => import("../components/VoiceSearchOptimization")
);
const ConversationalAIContent = React.lazy(
  () => import("../components/ConversationalAIContent")
);
const SemanticSearchOptimization = React.lazy(
  () => import("../components/SemanticSearchOptimization")
);
const AITrainingOptimization = React.lazy(
  () => import("../components/AITrainingOptimization")
);
const PerformanceOptimization = React.lazy(
  () => import("../components/PerformanceOptimization")
);
const Footer = React.lazy(() => import("../components/Footer"));
const ScrollToTop = React.lazy(() => import("../components/ScrollToTop"));
const ExitIntentOptimization = React.lazy(
  () => import("../components/ExitIntentOptimization")
);
const ProtectedAppShell = React.lazy(() => import("./ProtectedAppShell"));
const AuthCallbackRoute = React.lazy(() => import("./AuthCallbackRoute"));

const ConversationPage = lazyImportWithRetry(async () => {
  const module = await import("../pages/ConversationPage");
  return { default: module.ConversationPage };
}, "conversation-page");

const EnhancedTripsPage = lazyImportWithRetry(async () => {
  const module = await import("../pages/EnhancedTripsPage");
  return { default: module.EnhancedTripsPage };
}, "enhanced-trips-page");

const labsEnabled = import.meta.env.DEV || __DEV__;
const LabsPage = labsEnabled
  ? React.lazy(() => import("../pages/Labs"))
  : null;
const LabsVideosPage = labsEnabled
  ? React.lazy(async () => {
      const module = await import("../pages/Labs");
      return { default: module.LabsVideosPage };
    })
  : null;
const LabsComparisonsPage = labsEnabled
  ? React.lazy(async () => {
      const module = await import("../pages/Labs");
      return { default: module.LabsComparisonsPage };
    })
  : null;
const LabsBrandAssetsPage = labsEnabled
  ? React.lazy(async () => {
      const module = await import("../pages/Labs");
      return { default: module.LabsBrandAssetsPage };
    })
  : null;
const TsaWaitTimesPage = React.lazy(() => import("../pages/TsaWaitTimesPage"));

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
  message,
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
    <p style={{ margin: 0, fontSize: "1rem", opacity: 0.8 }}>{message ?? "Loading…"}</p>
    <style>{`
      @keyframes spin {
        to { transform: rotate(360deg); }
      }
    `}</style>
  </LoadingScreenContainer>
);

const LocalizedLoadingPage: React.FC = () => {
  const { t } = useI18n();
  return <LoadingScreen message={t("common.loadingPage")} />;
};

const LegalShellWrap = styled.div`
  min-height: 100vh;
  background:
    radial-gradient(circle at top, rgba(196, 108, 77, 0.16), transparent 24%),
    #090706;
  color: var(--color-text-primary);
  padding: 1.25rem 0 3rem;
`;

const LegalShellInner = styled.div`
  width: min(100%, 980px);
  margin: 0 auto;
  padding: 1.1rem 1rem 2.5rem;
  border: 1px solid var(--color-border);
  border-radius: 1.8rem;
  background: rgba(16, 13, 10, 0.72);
  backdrop-filter: blur(18px);
  box-shadow: var(--shadow-soft);

  @media (max-width: 768px) {
    border-radius: 1.3rem;
    padding: 0.95rem 0.85rem 2rem;
  }
`;

const LegalShellNav = styled.nav`
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-bottom: 1.5rem;
`;

const LegalShellLink = styled.a`
  color: var(--color-text-secondary);
  text-decoration: none;
  border: 1px solid rgba(243, 210, 122, 0.12);
  background: rgba(255, 248, 236, 0.04);
  border-radius: 999px;
  padding: 0.55rem 0.85rem;
  font-size: 0.78rem;
  letter-spacing: 0.04em;
  text-transform: uppercase;

  &:hover,
  &:focus-visible {
    color: var(--color-text-primary);
    background: rgba(255, 248, 236, 0.08);
  }
`;

const LegalShell: React.FC<{ readonly children: React.ReactNode }> = ({
  children,
}) => {
  const { pathFor, t } = useI18n();

  return (
    <Layout>
      <LegalShellWrap>
        <LegalShellInner>
          <LegalShellNav aria-label={t("nav.legalNavigation")}>
            <LegalShellLink href={pathFor("/")}>{t("common.home")}</LegalShellLink>
            <LegalShellLink href={pathFor("/terms")}>{t("legal.termsShort")}</LegalShellLink>
            <LegalShellLink href={pathFor("/privacy")}>{t("legal.privacyShort")}</LegalShellLink>
          </LegalShellNav>
          {children}
        </LegalShellInner>
      </LegalShellWrap>
    </Layout>
  );
};

const DeferredExitIntentOptimization: React.FC = () => {
  const [shouldLoad, setShouldLoad] = useState(false);

  useMountEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const isDesktopPointer =
      window.matchMedia?.("(hover: hover) and (pointer: fine)")?.matches ?? false;

    if (!isDesktopPointer) {
      return;
    }

    const schedule = (window as unknown as { requestIdleCallback?: (callback: () => void) => void })
      .requestIdleCallback;

    if (typeof schedule === "function") {
      schedule(() => setShouldLoad(true));
      return;
    }

    const timeoutId = window.setTimeout(() => setShouldLoad(true), 1500);
    return () => window.clearTimeout(timeoutId);
  });

  if (!shouldLoad) {
    return null;
  }

  return (
    <Suspense fallback={null}>
      <ExitIntentOptimization />
    </Suspense>
  );
};

const AppOriginRedirect: React.FC = () => {
  const { locale, t } = useI18n();

  useMountEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const target = new URL(appConfig.appBaseUrl);
    target.pathname = localizePath(window.location.pathname, locale);
    target.search = window.location.search;
    target.hash = window.location.hash;
    window.location.replace(target.toString());
  });

  return <LoadingScreen message={t("common.openingApp")} />;
};

const isAppOriginHost = (hostname: string): boolean => {
  try {
    return new URL(appConfig.appBaseUrl).hostname === hostname;
  } catch {
    return hostname === "app.trypackai.com";
  }
};

const LocalizedRouteGuard: React.FC<{ readonly children: React.ReactNode }> = ({
  children,
}) => {
  const location = useLocation();
  const { locale } = useParams();

  if (locale && !isSupportedLocale(locale)) {
    const redirectedPath = location.pathname.replace(new RegExp(`^/${locale}`), "") || "/";
    return (
      <Navigate
        to={`${redirectedPath}${location.search}${location.hash}`}
        replace
      />
    );
  }

  return <>{children}</>;
};

const LocalizedOutlet: React.FC = () => (
  <LocalizedRouteGuard>
    <Outlet />
  </LocalizedRouteGuard>
);

const NonHomeRoutes: React.FC = () => {
  const {pathFor} = useI18n();
  const tsaEnabled = shouldExposeTsaForCurrentHost();

  return (
    <>
      <Suspense fallback={<LocalizedLoadingPage />}>
        <Routes>
        <Route
          path="/terms"
          element={
            <LocalizedRouteGuard>
              <LegalShell>
                <TermsOfService />
              </LegalShell>
            </LocalizedRouteGuard>
          }
        />
        <Route
          path="/privacy"
          element={
            <LocalizedRouteGuard>
              <LegalShell>
                <PrivacyPolicy />
              </LegalShell>
            </LocalizedRouteGuard>
          }
        />
        <Route
          path="/do-not-sell"
          element={
            <LocalizedRouteGuard>
              <Navigate to={pathFor("/privacy-request")} replace />
            </LocalizedRouteGuard>
          }
        />
        <Route
          path="/accessibility"
          element={
            <Layout>
              <Suspense fallback={null}>
                <AccessibilityPage />
              </Suspense>
              <Suspense fallback={null}>
                <Footer />
                <ScrollToTop />
              </Suspense>
            </Layout>
          }
        />
        <Route
          path="/support"
          element={
            <Layout>
              <Suspense fallback={null}>
                <SupportPage />
              </Suspense>
              <Suspense fallback={null}>
                <Footer />
                <ScrollToTop />
              </Suspense>
            </Layout>
          }
        />
        <Route
          path="/unsubscribe"
          element={
            <Suspense fallback={null}>
              <UnsubscribePage />
            </Suspense>
          }
        />
        <Route
          path="/privacy-request"
          element={
            <Layout>
              <Suspense fallback={null}>
                <PrivacyRequestPage />
              </Suspense>
              <Suspense fallback={null}>
                <Footer />
                <ScrollToTop />
              </Suspense>
            </Layout>
          }
        />
        <Route
          path="/privacy-request/:requestType"
          element={
            <Layout>
              <Suspense fallback={null}>
                <PrivacyRequestPage />
              </Suspense>
              <Suspense fallback={null}>
                <Footer />
                <ScrollToTop />
              </Suspense>
            </Layout>
          }
        />
        <Route
          path="/privacy-request/verify"
          element={
            <Layout>
              <Suspense fallback={null}>
                <PrivacyRequestVerificationPage />
              </Suspense>
              <Suspense fallback={null}>
                <Footer />
                <ScrollToTop />
              </Suspense>
            </Layout>
          }
        />
        <Route
          path="/setup/email-forwarding"
          element={
            <Layout>
              <Suspense fallback={null}>
                <EmailForwardingSetupPage />
              </Suspense>
              <Suspense fallback={null}>
                <Footer />
                <ScrollToTop />
              </Suspense>
            </Layout>
          }
        />
        <Route
          path="/share"
          element={
            <Suspense fallback={null}>
              <SharedTravelPlan />
            </Suspense>
          }
        />
        <Route
          path="/share/:shareId"
          element={
            <Suspense fallback={null}>
              <SharedTravelPlan />
            </Suspense>
          }
        />
        <Route
          path="/trip/:linkedTripId"
          element={
            <Suspense fallback={null}>
              <LinkedTripInviteLanding />
            </Suspense>
          }
        />
        <Route
          path="/faq"
          element={
            <Layout>
              <Suspense fallback={null}>
                <PerformanceOptimization page="faq" />
                <VoiceSearchOptimization page="faq" />
                <ConversationalAIContent page="faq" />
                <SemanticSearchOptimization page="faq" />
                <AITrainingOptimization page="faq" />
                <FAQ />
              </Suspense>
            </Layout>
          }
        />
        <Route
          path="/features"
          element={
            <Layout>
              <Suspense fallback={null}>
                <PerformanceOptimization page="features" />
                <VoiceSearchOptimization page="features" />
                <ConversationalAIContent page="features" />
                <SemanticSearchOptimization page="features" />
                <AITrainingOptimization page="features" />
                <Features />
              </Suspense>
            </Layout>
          }
        />
        {labsEnabled ? (
          <Route
            path="/lab"
            element={
              <Layout>
                <Suspense fallback={null}>
                  <LiveActivityLab />
                </Suspense>
              </Layout>
            }
          />
        ) : null}
        {labsEnabled ? (
          <Route
            path="/lab/live-activity"
            element={
              <Layout>
                <Suspense fallback={null}>
                  <LiveActivityLab />
                </Suspense>
              </Layout>
            }
          />
        ) : null}
        {LabsPage ? (
          <Route
            path="/labs"
            element={
              <Layout>
                <Suspense fallback={null}>
                  <LabsPage />
                </Suspense>
              </Layout>
            }
          />
        ) : null}
        {LabsVideosPage ? (
          <Route
            path="/labs/videos"
            element={
              <Layout>
                <Suspense fallback={null}>
                  <LabsVideosPage />
                </Suspense>
              </Layout>
            }
          />
        ) : null}
        {LabsComparisonsPage ? (
          <Route
            path="/labs/comparisons"
            element={
              <Layout>
                <Suspense fallback={null}>
                  <LabsComparisonsPage />
                </Suspense>
              </Layout>
            }
          />
        ) : null}
        {LabsBrandAssetsPage ? (
          <Route
            path="/labs/brand-assets"
            element={
              <Layout>
                <Suspense fallback={null}>
                  <LabsBrandAssetsPage />
                </Suspense>
              </Layout>
            }
          />
        ) : null}
        {LabsPage ? (
          <Route
            path="/labs/live-activities"
            element={
              <Layout>
                <Suspense fallback={null}>
                  <LiveActivityLab />
                </Suspense>
              </Layout>
            }
          />
        ) : null}
        {tsaEnabled ? (
          <Route
            path="/tsa"
            element={
                <Layout>
                  <Suspense fallback={null}>
                    <TsaWaitTimesPage />
                  </Suspense>
                  <Suspense fallback={null}>
                    <Footer />
                  <ScrollToTop />
                </Suspense>
              </Layout>
            }
          />
        ) : null}
        <Route
          path="/how-it-works"
          element={
            <Layout>
              <Suspense fallback={null}>
                <PerformanceOptimization page="how-it-works" />
                <VoiceSearchOptimization page="how-it-works" />
                <ConversationalAIContent page="how-it-works" />
                <SemanticSearchOptimization page="how-it-works" />
                <AITrainingOptimization page="how-it-works" />
                <HowItWorks />
              </Suspense>
            </Layout>
          }
        />
        <Route
          path="/auth/callback"
          element={
            <Suspense fallback={<LocalizedLoadingPage />}>
              <AuthCallbackRoute />
            </Suspense>
          }
        />
        <Route
          path="/oauth/callback"
          element={
            <Suspense fallback={<LocalizedLoadingPage />}>
              <AuthCallbackRoute />
            </Suspense>
          }
        />
        <Route
          path="/app"
          element={
              <Suspense fallback={<LocalizedLoadingPage />}>
                {typeof window !== "undefined" &&
              !isAppOriginHost(window.location.hostname) ? (
                <AppOriginRedirect />
              ) : (
                <ProtectedAppShell />
              )}
            </Suspense>
          }
        >
          <Route index element={<ConversationPage />} />
          <Route path="trips" element={<EnhancedTripsPage />} />
        </Route>
        <Route path="/:locale" element={<LocalizedOutlet />}>
          <Route
            path="terms"
            element={
              <LegalShell>
                <TermsOfService />
              </LegalShell>
            }
          />
          <Route
            path="privacy"
            element={
              <LegalShell>
                <PrivacyPolicy />
              </LegalShell>
            }
          />
          <Route
            path="do-not-sell"
            element={
              <Navigate to={pathFor("/privacy-request")} replace />
            }
          />
          <Route
            path="accessibility"
            element={
              <Layout>
                <Suspense fallback={null}>
                  <AccessibilityPage />
                </Suspense>
                <Suspense fallback={null}>
                  <Footer />
                  <ScrollToTop />
                </Suspense>
              </Layout>
            }
          />
          <Route
            path="support"
            element={
              <Layout>
                <Suspense fallback={null}>
                  <SupportPage />
                </Suspense>
                <Suspense fallback={null}>
                  <Footer />
                  <ScrollToTop />
                </Suspense>
              </Layout>
            }
          />
          <Route path="unsubscribe" element={<Suspense fallback={null}><UnsubscribePage /></Suspense>} />
          <Route
            path="privacy-request"
            element={
              <Layout>
                <Suspense fallback={null}>
                  <PrivacyRequestPage />
                </Suspense>
                <Suspense fallback={null}>
                  <Footer />
                  <ScrollToTop />
                </Suspense>
              </Layout>
            }
          />
          <Route
            path="privacy-request/:requestType"
            element={
              <Layout>
                <Suspense fallback={null}>
                  <PrivacyRequestPage />
                </Suspense>
                <Suspense fallback={null}>
                  <Footer />
                  <ScrollToTop />
                </Suspense>
              </Layout>
            }
          />
          <Route
            path="privacy-request/verify"
            element={
              <Layout>
                <Suspense fallback={null}>
                  <PrivacyRequestVerificationPage />
                </Suspense>
                <Suspense fallback={null}>
                  <Footer />
                  <ScrollToTop />
                </Suspense>
              </Layout>
            }
          />
          <Route
            path="setup/email-forwarding"
            element={
              <Layout>
                <Suspense fallback={null}>
                  <EmailForwardingSetupPage />
                </Suspense>
                <Suspense fallback={null}>
                  <Footer />
                  <ScrollToTop />
                </Suspense>
              </Layout>
            }
          />
          <Route path="share" element={<Suspense fallback={null}><SharedTravelPlan /></Suspense>} />
          <Route path="share/:shareId" element={<Suspense fallback={null}><SharedTravelPlan /></Suspense>} />
          <Route path="trip/:linkedTripId" element={<Suspense fallback={null}><LinkedTripInviteLanding /></Suspense>} />
          <Route
            path="faq"
            element={
              <Layout>
                <Suspense fallback={null}>
                  <PerformanceOptimization page="faq" />
                  <VoiceSearchOptimization page="faq" />
                  <ConversationalAIContent page="faq" />
                  <SemanticSearchOptimization page="faq" />
                  <AITrainingOptimization page="faq" />
                  <FAQ />
                </Suspense>
              </Layout>
            }
          />
          <Route
            path="features"
            element={
              <Layout>
                <Suspense fallback={null}>
                  <PerformanceOptimization page="features" />
                  <VoiceSearchOptimization page="features" />
                  <ConversationalAIContent page="features" />
                  <SemanticSearchOptimization page="features" />
                  <AITrainingOptimization page="features" />
                  <Features />
                </Suspense>
              </Layout>
            }
          />
          {labsEnabled ? (
            <Route path="lab" element={<Layout><Suspense fallback={null}><LiveActivityLab /></Suspense></Layout>} />
          ) : null}
          {labsEnabled ? (
            <Route path="lab/live-activity" element={<Layout><Suspense fallback={null}><LiveActivityLab /></Suspense></Layout>} />
          ) : null}
          {LabsPage ? (
            <Route path="labs" element={<Layout><Suspense fallback={null}><LabsPage /></Suspense></Layout>} />
          ) : null}
          {LabsVideosPage ? (
            <Route path="labs/videos" element={<Layout><Suspense fallback={null}><LabsVideosPage /></Suspense></Layout>} />
          ) : null}
          {LabsComparisonsPage ? (
            <Route path="labs/comparisons" element={<Layout><Suspense fallback={null}><LabsComparisonsPage /></Suspense></Layout>} />
          ) : null}
          {LabsBrandAssetsPage ? (
            <Route path="labs/brand-assets" element={<Layout><Suspense fallback={null}><LabsBrandAssetsPage /></Suspense></Layout>} />
          ) : null}
          {LabsPage ? (
            <Route path="labs/live-activities" element={<Layout><Suspense fallback={null}><LiveActivityLab /></Suspense></Layout>} />
          ) : null}
          {tsaEnabled ? (
            <Route
              path="tsa"
              element={
                <Layout>
                  <Suspense fallback={null}>
                    <TsaWaitTimesPage />
                  </Suspense>
                  <Suspense fallback={null}>
                    <Footer />
                    <ScrollToTop />
                  </Suspense>
                </Layout>
              }
            />
          ) : null}
          <Route
            path="how-it-works"
            element={
              <Layout>
                <Suspense fallback={null}>
                  <PerformanceOptimization page="how-it-works" />
                  <VoiceSearchOptimization page="how-it-works" />
                  <ConversationalAIContent page="how-it-works" />
                  <SemanticSearchOptimization page="how-it-works" />
                  <AITrainingOptimization page="how-it-works" />
                  <HowItWorks />
                </Suspense>
              </Layout>
            }
          />
          <Route
            path="auth/callback"
            element={
              <Suspense fallback={<LocalizedLoadingPage />}>
                <AuthCallbackRoute />
              </Suspense>
            }
          />
          <Route
            path="oauth/callback"
            element={
              <Suspense fallback={<LocalizedLoadingPage />}>
                <AuthCallbackRoute />
              </Suspense>
            }
          />
          <Route
            path="app"
            element={
              <Suspense fallback={<LocalizedLoadingPage />}>
                {typeof window !== "undefined" &&
                !isAppOriginHost(window.location.hostname) ? (
                  <AppOriginRedirect />
                ) : (
                  <ProtectedAppShell />
                )}
              </Suspense>
            }
          >
            <Route index element={<ConversationPage />} />
            <Route path="trips" element={<EnhancedTripsPage />} />
          </Route>
          <Route path="*" element={<HomePage />} />
        </Route>
        <Route path="*" element={<HomePage />} />
        </Routes>
      </Suspense>
      <DeferredExitIntentOptimization />
    </>
  );
};

export default NonHomeRoutes;
