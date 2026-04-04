import React, { Suspense, startTransition, useMemo, useRef, useState } from "react";
import styled from "styled-components";
import Layout from "@/components/Layout";
import HeroAboveFold from "@/components/HeroAboveFold";
import WaitlistForm from "@/components/WaitlistForm";
import { useI18n } from "@/i18n/I18nProvider";
import { env } from "@/utils/env";
import { apiEndpoints } from "@/config/appConfig";
import { useMountEffect } from "@/hooks/useMountEffect";

type IdleWindowLike = Window & {
  requestIdleCallback?: (
    callback: () => void,
    options?: { timeout: number },
  ) => number;
  cancelIdleCallback?: (handle: number) => void;
};

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

const importFooter = () => import("../components/Footer");
const importScrollToTop = () => import("../components/ScrollToTop");
const importValueProp = () => import("../components/ValueProp");
const importHeroJourneyShowcase = () => import("../components/Hero");
const importLiveActivityStackSection = () =>
  import("../components/LiveActivityStackSection");
const importBookingTimelineHighlight = () =>
  import("../components/BookingTimelineHighlight");
const importTrustBanner = () => import("../components/TrustBanner");

const Footer = React.lazy(importFooter);
const ScrollToTop = React.lazy(importScrollToTop);
const ValueProp = React.lazy(importValueProp);
const HeroJourneyShowcase = React.lazy(importHeroJourneyShowcase);
const LiveActivityStackSection = React.lazy(importLiveActivityStackSection);
const BookingTimelineHighlight = React.lazy(importBookingTimelineHighlight);
const TrustBanner = React.lazy(importTrustBanner);

const SectionWrapper = styled.section`
  width: 100%;
  display: flex;
  justify-content: center;
  padding: clamp(1.75rem, 4.5vw, 3.75rem) 0;
  position: relative;

  &::before {
    content: "";
    position: absolute;
    inset: 0;
    border-top: 1px solid rgba(243, 210, 122, 0.08);
    opacity: 0.7;
    pointer-events: none;
  }
`;

const SectionInner = styled.div`
  width: 100%;
  max-width: min(1100px, 100%);
  padding-inline: 0;
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  align-items: stretch;
`;

const WaitlistSectionInner = styled(SectionInner)`
  max-width: 1040px;
`;

const TightAfterLiveActivitySection = styled(SectionWrapper)`
  margin-bottom: -28px;

  @media (max-width: 768px) {
    margin-bottom: -16px;
  }
`;

const DeferredPlaceholder = styled.div<{ $minHeight: number }>`
  width: 100%;
  min-height: ${({ $minHeight }) => `${$minHeight}px`};
  border-radius: 1.5rem;
  border: 1px solid rgba(243, 210, 122, 0.08);
  background:
    linear-gradient(180deg, rgba(20, 15, 11, 0.48), rgba(12, 9, 7, 0.22)),
    rgba(255, 248, 236, 0.02);
`;

const JourneySuspenseFallback = styled(DeferredPlaceholder)`
  margin-top: 0.8rem;
  border-radius: 1.8rem;
  background:
    linear-gradient(
      90deg,
      rgba(243, 210, 122, 0.04) 0%,
      rgba(243, 210, 122, 0.1) 42%,
      rgba(231, 35, 64, 0.08) 58%,
      rgba(243, 210, 122, 0.04) 100%
    ),
    linear-gradient(180deg, rgba(17, 13, 10, 0.86), rgba(11, 9, 7, 0.92));
  background-size: 200% 100%, auto;
  animation: journeyPlaceholderShift 1.6s ease-in-out infinite;

  @keyframes journeyPlaceholderShift {
    0% {
      background-position: 100% 0, 0 0;
    }
    100% {
      background-position: -100% 0, 0 0;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
`;

const SectionSuspenseFallback = styled(DeferredPlaceholder)`
  border-radius: 1.8rem;
  background:
    linear-gradient(
      90deg,
      rgba(243, 210, 122, 0.03) 0%,
      rgba(243, 210, 122, 0.08) 38%,
      rgba(231, 35, 64, 0.06) 55%,
      rgba(243, 210, 122, 0.03) 100%
    ),
    linear-gradient(180deg, rgba(18, 13, 10, 0.78), rgba(11, 9, 7, 0.78));
  background-size: 220% 100%, auto;
  animation: sectionPlaceholderShift 2s ease-in-out infinite;

  @keyframes sectionPlaceholderShift {
    0% {
      background-position: 100% 0, 0 0;
    }
    100% {
      background-position: -100% 0, 0 0;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
`;

const scheduleIdleTask = (
  callback: () => void,
  timeoutMs: number,
): (() => void) => {
  if (typeof window === "undefined") {
    return () => undefined;
  }

  const idleWindow = window as IdleWindowLike;

  if (typeof idleWindow.requestIdleCallback === "function") {
    const handle = idleWindow.requestIdleCallback(callback, { timeout: timeoutMs });
    return () => {
      if (typeof idleWindow.cancelIdleCallback === "function") {
        idleWindow.cancelIdleCallback(handle);
      }
    };
  }

  const timeoutId = window.setTimeout(callback, timeoutMs);
  return () => window.clearTimeout(timeoutId);
};

const DeferredContent: React.FC<{
  readonly children: React.ReactNode;
  readonly minHeight: number;
  readonly rootMargin?: string;
}> = ({ children, minHeight, rootMargin = "600px 0px" }) => {
  const [shouldRender, setShouldRender] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useMountEffect(() => {
    if (shouldRender) {
      return;
    }

    const node = containerRef.current;
    if (!node) {
      startTransition(() => setShouldRender(true));
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          observer.disconnect();
          startTransition(() => setShouldRender(true));
        }
      },
      { rootMargin }
    );

    observer.observe(node);

    return () => {
      observer.disconnect();
    };
  });

  return (
    <div ref={containerRef} style={{ width: "100%" }}>
      {shouldRender ? children : <DeferredPlaceholder $minHeight={minHeight} aria-hidden="true" />}
    </div>
  );
};

const IdleDeferredMount: React.FC<{
  readonly children: React.ReactNode;
  readonly delayMs?: number;
}> = ({ children, delayMs = 1800 }) => {
  const [shouldRender, setShouldRender] = useState(false);

  useMountEffect(() => {
    const cancel = scheduleIdleTask(() => {
      startTransition(() => {
        setShouldRender(true);
      });
    }, delayMs);

    return () => {
      cancel();
    };
  });

  return shouldRender ? <>{children}</> : null;
};

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

const VerificationNotification = React.memo(
  ({ status, locale }: { readonly status: string | null; readonly locale: string }) => {
    if (!status) return null;
    const isSuccess = status === "success";
    const title = isSuccess
      ? locale === "es"
        ? "Correo verificado correctamente"
        : "Email Verified Successfully!"
      : locale === "es"
      ? "Verificación fallida"
      : "Verification Failed";
    const body = isSuccess
      ? locale === "es"
        ? "Gracias por confirmar tu correo. Ya estás en nuestra lista."
        : "Thank you for confirming your email. You're on our waitlist."
      : locale === "es"
      ? "No pudimos verificar tu correo. Es posible que el enlace haya expirado o no sea válido."
      : "We couldn't verify your email. The link may be expired or invalid.";

    return (
      <div
        style={{
          padding: "1rem",
          marginBottom: "2rem",
          borderRadius: "0.5rem",
          backgroundColor: isSuccess
            ? "rgba(76, 175, 80, 0.2)"
            : "rgba(244, 67, 54, 0.2)",
          color: "white",
          maxWidth: "600px",
          margin: "0 auto 1rem auto",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
          border: `1px solid ${
            isSuccess ? "rgba(76, 175, 80, 0.5)" : "rgba(244, 67, 54, 0.5)"
          }`,
        }}
      >
        <div style={{ marginRight: "1rem", fontSize: "1.5rem" }}>
          {isSuccess ? "✓" : "⚠"}
        </div>
        <div>
          <h3 style={{ margin: "0 0 0.5rem 0" }}>
            {title}
          </h3>
          <p style={{ margin: 0 }}>{body}</p>
        </div>
      </div>
    );
  }
);

const HomePage: React.FC = () => {
  const { locale } = useI18n();
  const [verificationStatus, setVerificationStatus] = useState<string | null>(
    null
  );
  const [isVerifying, setIsVerifying] = useState(false);

  useMountEffect(() => {
    const url = new URL(window.location.href);
    const urlHash = url.hash;
    const match = urlHash.match(/^#\/verify\?token=(.+)$/);
    const token = match && match[1];
    if (token) {
      setIsVerifying(true);
      const VERIFY_ENDPOINT =
        (env.VITE_VERIFY_ENDPOINT as string | undefined) || apiEndpoints.waitlistVerify;

      const attemptVerification = async (endpoint: string) => {
        try {
          const response = await fetch(`${endpoint}?token=${token}`);
          const data = await response.json();
          const isSuccess = data.success === true || data.ok === true;
          return { success: true, isSuccess };
        } catch (error) {
          if (env.DEV) {
            console.error(`Verification error with ${endpoint}:`, error);
          }
          return { success: false, error };
        }
      };

      attemptVerification(VERIFY_ENDPOINT)
        .then((result) => {
          if (result.success) {
            setVerificationStatus(result.isSuccess ? "success" : "failed");
          } else {
            setVerificationStatus("failed");
          }
        })
        .then(() => {
          window.history.replaceState({}, document.title, "/");
        })
        .catch((error) => {
          if (env.DEV) {
            console.error("Verification completely failed:", error);
          }
          setVerificationStatus("failed");
          window.history.replaceState({}, document.title, "/");
        })
        .finally(() => {
          setIsVerifying(false);
        });
    } else {
      const params = new URLSearchParams(window.location.search);
      const status = params.get("verification");
      if (status === "success" || status === "failed") {
        setVerificationStatus(status);
        window.history.replaceState({}, document.title, "/#/");
      }
    }
  });

  const heroWaitlist = useMemo(
    () => (
      <div id="waitlist" style={{ display: "grid", gap: "0.85rem" }}>
        {isVerifying ? (
          <LoadingScreen
            message={
              locale === "es" ? "Verificando tu correo…" : "Verifying your email…"
            }
          />
        ) : (
          verificationStatus && (
            <VerificationNotification status={verificationStatus} locale={locale} />
          )
        )}
        <WaitlistForm variant="hero" />
      </div>
    ),
    [isVerifying, locale, verificationStatus]
  );

  return (
    <Layout>
      <HeroAboveFold waitlistSlot={heroWaitlist} />
      <DeferredContent minHeight={760} rootMargin="960px 0px">
        <Suspense fallback={<JourneySuspenseFallback $minHeight={760} aria-hidden="true" />}>
          <HeroJourneyShowcase journeyOnly />
        </Suspense>
      </DeferredContent>
      <DeferredContent minHeight={560} rootMargin="720px 0px">
        <Suspense fallback={<SectionSuspenseFallback $minHeight={560} aria-hidden="true" />}>
          <TightAfterLiveActivitySection>
            <SectionInner>
              <LiveActivityStackSection />
            </SectionInner>
          </TightAfterLiveActivitySection>
        </Suspense>
      </DeferredContent>
      <DeferredContent minHeight={560} rootMargin="840px 0px">
        <Suspense
          fallback={
            <>
              <SectionWrapper>
                <SectionInner>
                  <SectionSuspenseFallback $minHeight={520} aria-hidden="true" />
                </SectionInner>
              </SectionWrapper>
              <SectionWrapper>
                <SectionInner>
                  <SectionSuspenseFallback $minHeight={360} aria-hidden="true" />
                </SectionInner>
              </SectionWrapper>
              <SectionWrapper>
                <SectionInner>
                  <SectionSuspenseFallback $minHeight={260} aria-hidden="true" />
                </SectionInner>
              </SectionWrapper>
            </>
          }
        >
          <SectionWrapper>
            <SectionInner>
              <ValueProp />
            </SectionInner>
          </SectionWrapper>
          <SectionWrapper>
            <SectionInner>
              <BookingTimelineHighlight />
            </SectionInner>
          </SectionWrapper>
          <SectionWrapper>
            <SectionInner>
              <TrustBanner />
            </SectionInner>
          </SectionWrapper>
        </Suspense>
      </DeferredContent>
      <DeferredContent minHeight={360} rootMargin="960px 0px">
        <SectionWrapper id="waitlist-bottom">
          <WaitlistSectionInner>
            <WaitlistForm />
          </WaitlistSectionInner>
        </SectionWrapper>
      </DeferredContent>
      <DeferredContent minHeight={240} rootMargin="960px 0px">
        <Suspense fallback={<SectionSuspenseFallback $minHeight={240} aria-hidden="true" />}>
          <Footer />
          <ScrollToTop />
        </Suspense>
      </DeferredContent>
      <IdleDeferredMount delayMs={2200}>
        <Suspense fallback={null}>
          <PerformanceOptimization page="home" />
          <VoiceSearchOptimization page="home" />
          <ConversationalAIContent page="home" />
          <SemanticSearchOptimization page="home" />
          <AITrainingOptimization page="home" />
        </Suspense>
      </IdleDeferredMount>
    </Layout>
  );
};

export default HomePage;
