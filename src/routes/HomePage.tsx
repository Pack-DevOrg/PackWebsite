import React, { Suspense, startTransition, useMemo, useRef, useState } from "react";
import styled from "styled-components";
import Layout from "@/components/Layout";
import HeroAboveFold from "@/components/HeroAboveFold";
import HeroJourneyShowcase from "@/components/Hero";
import WaitlistForm from "@/components/WaitlistForm";
import { useI18n } from "@/i18n/I18nProvider";
import PageSeo, { createSoftwareApplicationSchema } from "@/seo/pageSeo";
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

type BuildManifestEntry = {
  readonly file?: string;
  readonly imports?: readonly string[];
  readonly css?: readonly string[];
  readonly assets?: readonly string[];
};

type BuildManifest = Record<string, BuildManifestEntry>;

const importFooter = () => import("../components/Footer");
const importScrollToTop = () => import("../components/ScrollToTop");
const importValueProp = () => import("../components/ValueProp");
const importLiveActivityStackSection = () =>
  import("../components/LiveActivityStackSection");
const importBookingTimelineHighlight = () =>
  import("../components/BookingTimelineHighlight");
const importTrustBanner = () => import("../components/TrustBanner");

const DEFERRED_SECTION_PREFETCH_GROUPS: ReadonlyArray<{
  readonly entries: readonly string[];
  readonly timeoutMs: number;
}> = [
  {
    entries: ["src/components/LiveActivityStackSection.tsx"],
    timeoutMs: 2200,
  },
  {
    entries: [
      "src/components/ValueProp.tsx",
      "src/components/BookingTimelineHighlight.tsx",
      "src/components/TrustBanner.tsx",
    ],
    timeoutMs: 4200,
  },
  {
    entries: ["src/components/Footer.tsx", "src/components/ScrollToTop.tsx"],
    timeoutMs: 6200,
  },
] as const;

const prefetchedAssetHrefs = new Set<string>();
let buildManifestPromise: Promise<BuildManifest | null> | undefined;

const Footer = React.lazy(importFooter);
const ScrollToTop = React.lazy(importScrollToTop);
const ValueProp = React.lazy(importValueProp);
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

const canSpeculativelyWarmSections = (): boolean => {
  if (typeof navigator === "undefined") {
    return false;
  }

  const connection = (
    navigator as Navigator & {
      connection?: {
        effectiveType?: string;
        saveData?: boolean;
      };
    }
  ).connection;

  if (!connection) {
    return true;
  }

  if (connection.saveData) {
    return false;
  }

  return (
    connection.effectiveType !== "slow-2g" &&
    connection.effectiveType !== "2g"
  );
};

const appendPrefetchLink = (href: string, as?: string) => {
  if (typeof document === "undefined" || prefetchedAssetHrefs.has(href)) {
    return;
  }

  prefetchedAssetHrefs.add(href);

  const link = document.createElement("link");
  link.rel = "prefetch";
  link.href = href;
  if (as) {
    link.as = as;
  }
  link.crossOrigin = "anonymous";
  document.head.appendChild(link);
};

const resolveManifestAssetUrls = (
  manifest: BuildManifest,
  entryKeys: readonly string[],
): string[] => {
  const discoveredUrls: string[] = [];
  const visitedEntries = new Set<string>();
  const homepageEntryImports = new Set(manifest["index.html"]?.imports ?? []);

  const visitEntry = (entryKey: string) => {
    if (visitedEntries.has(entryKey)) {
      return;
    }

    visitedEntries.add(entryKey);
    const entry = manifest[entryKey];
    if (!entry) {
      return;
    }

    if (entry.file) {
      discoveredUrls.push(`/${entry.file}`);
    }

    for (const cssFile of entry.css ?? []) {
      discoveredUrls.push(`/${cssFile}`);
    }

    for (const assetFile of entry.assets ?? []) {
      discoveredUrls.push(`/${assetFile}`);
    }

    for (const importedEntry of entry.imports ?? []) {
      if (importedEntry !== "index.html" && !homepageEntryImports.has(importedEntry)) {
        visitEntry(importedEntry);
      }
    }
  };

  for (const entryKey of entryKeys) {
    visitEntry(entryKey);
  }

  return discoveredUrls;
};

const inferPrefetchType = (assetUrl: string): string | undefined => {
  if (assetUrl.endsWith(".js")) {
    return "script";
  }
  if (assetUrl.endsWith(".css")) {
    return "style";
  }
  if (/\.(png|jpg|jpeg|gif|webp|avif|svg)$/u.test(assetUrl)) {
    return "image";
  }

  return undefined;
};

const loadBuildManifest = async (): Promise<BuildManifest | null> => {
  if (typeof window === "undefined") {
    return null;
  }

  if (!buildManifestPromise) {
    buildManifestPromise = fetch("/.vite/manifest.json", {
      credentials: "same-origin",
      cache: "force-cache",
    })
      .then(async (response) => {
        if (!response.ok) {
          return null;
        }
        return (await response.json()) as BuildManifest;
      })
      .catch(() => null);
  }

  return buildManifestPromise;
};

const prefetchDeferredSections = (): (() => void) => {
  const cleanupTasks: Array<() => void> = [];

  const queuePrefetchGroup = (
    entryKeys: readonly string[],
    timeoutMs: number,
  ) => {
    cleanupTasks.push(
      scheduleIdleTask(async () => {
        const manifest = await loadBuildManifest();
        if (!manifest) {
          return;
        }

        for (const assetUrl of resolveManifestAssetUrls(manifest, entryKeys)) {
          appendPrefetchLink(assetUrl, inferPrefetchType(assetUrl));
        }
      }, timeoutMs)
    );
  };

  for (const prefetchGroup of DEFERRED_SECTION_PREFETCH_GROUPS) {
    queuePrefetchGroup(prefetchGroup.entries, prefetchGroup.timeoutMs);
  }

  return () => {
    for (const cleanupTask of cleanupTasks) {
      cleanupTask();
    }
  };
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

  useMountEffect(() => {
    if (!canSpeculativelyWarmSections()) {
      return;
    }

    const startPrefetching = () => prefetchDeferredSections();
    let releasePrefetches: (() => void) | undefined;

    if (document.readyState === "complete") {
      releasePrefetches = startPrefetching();
      return () => {
        releasePrefetches?.();
      };
    }

    const handleLoad = () => {
      releasePrefetches = startPrefetching();
    };

    window.addEventListener("load", handleLoad, { once: true });

    return () => {
      window.removeEventListener("load", handleLoad);
      releasePrefetches?.();
    };
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
      <PageSeo
        title="Pack | AI travel assistant for personalized trip planning and booking"
        description="Pack turns prompts, confirmation emails, calendars, and travel preferences into organized trip plans you can review and book in one place."
        path="/"
        schema={[createSoftwareApplicationSchema(
          "Pack",
          "AI travel assistant for personalized trip planning, booking, and trip organization.",
        )]}
      />
      <HeroAboveFold waitlistSlot={heroWaitlist} />
      <HeroJourneyShowcase journeyOnly />
      <DeferredContent minHeight={560} rootMargin="1280px 0px">
        <Suspense fallback={<SectionSuspenseFallback $minHeight={560} aria-hidden="true" />}>
          <TightAfterLiveActivitySection>
            <SectionInner>
              <LiveActivityStackSection />
            </SectionInner>
          </TightAfterLiveActivitySection>
        </Suspense>
      </DeferredContent>
      <DeferredContent minHeight={560} rootMargin="1480px 0px">
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
      <DeferredContent minHeight={360} rootMargin="1800px 0px">
        <SectionWrapper id="waitlist-bottom">
          <WaitlistSectionInner>
            <WaitlistForm />
          </WaitlistSectionInner>
        </SectionWrapper>
      </DeferredContent>
      <DeferredContent minHeight={240} rootMargin="2200px 0px">
        <Suspense fallback={<SectionSuspenseFallback $minHeight={240} aria-hidden="true" />}>
          <Footer />
          <ScrollToTop />
        </Suspense>
      </DeferredContent>
    </Layout>
  );
};

export default HomePage;
