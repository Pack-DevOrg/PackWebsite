import React from "react";
import styled, { keyframes } from "styled-components";
import { useLocation } from "react-router-dom";
import GlobalStyles from "../styles/GlobalStyles";
import { useI18n } from "../i18n/I18nProvider";
import { useMountEffect } from "@/hooks/useMountEffect";
import Header from "./Header";
import Breadcrumbs from "./Breadcrumbs";

const StyledLayout = styled.div`
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  position: relative;
`;

const MainContent = styled.main`
  flex: 1;
  width: 100%;
  margin: 0;
  position: relative;
  padding-bottom: var(--space-7);
`;

const auroraDrift = keyframes`
  0% {
    transform: translate3d(0, 0, 0) scale(1);
  }
  50% {
    transform: translate3d(-2.5%, 1.8%, 0) scale(1.06);
  }
  100% {
    transform: translate3d(0, 0, 0) scale(1);
  }
`;

const AmbientGlow = styled.div`
  position: fixed;
  inset: -8%;
  pointer-events: none;
  z-index: 0;
  background:
    radial-gradient(circle at 78% 6%, rgba(243, 210, 122, 0.1), transparent 36%),
    radial-gradient(circle at 30% 30%, rgba(196, 108, 77, 0.05), transparent 34%),
    radial-gradient(circle at 8% 88%, rgba(231, 35, 64, 0.06), transparent 30%);
  animation: ${auroraDrift} 26s ease-in-out infinite;
  will-change: transform;

  @media (max-width: 739px) {
    background: radial-gradient(circle at 80% 10%, rgba(243, 210, 122, 0.08), transparent 22%);
  }

  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
`;

/* Filmic grain kills gradient banding and the "flat digital" look on dark UIs. */
const GrainOverlay = styled.div`
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 5;
  opacity: 0.05;
  mix-blend-mode: overlay;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='180' height='180'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='180' height='180' filter='url(%23n)'/%3E%3C/svg%3E");
  background-size: 180px 180px;
`;

const routeDraw = keyframes`
  to {
    stroke-dashoffset: 0;
  }
`;

const AmbientRoutesSvg = styled.svg`
  position: fixed;
  inset: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 0;
  opacity: 0.4;
  mask-image: radial-gradient(ellipse at 60% 18%, black 12%, transparent 64%);

  path {
    fill: none;
    stroke: rgba(243, 210, 122, 0.16);
    stroke-width: 1;
    stroke-dasharray: 6 7;
    stroke-dashoffset: 1300;
    animation: ${routeDraw} 60s linear infinite;
  }

  circle {
    fill: rgba(243, 210, 122, 0.38);
  }

  @media (max-width: 739px) {
    display: none;
  }

  @media (prefers-reduced-motion: reduce) {
    path {
      animation: none;
      stroke-dashoffset: 0;
    }
  }
`;

/* Faint great-circle flight arcs — the travel-native answer to a starfield. */
const AmbientRoutes: React.FC = () => (
  <AmbientRoutesSvg aria-hidden="true" viewBox="0 0 1440 900" preserveAspectRatio="xMidYMin slice">
    <path d="M 120 340 C 380 60, 820 40, 1150 210" />
    <path d="M 260 520 C 560 260, 980 240, 1330 430" />
    <path d="M 40 200 C 320 -40, 760 -20, 1040 120" />
    <circle cx="120" cy="340" r="2.5" />
    <circle cx="1150" cy="210" r="2.5" />
    <circle cx="260" cy="520" r="2.5" />
    <circle cx="1330" cy="430" r="2.5" />
    <circle cx="1040" cy="120" r="2.5" />
  </AmbientRoutesSvg>
);

const AmbientGrid = styled.div`
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 0;
  opacity: 0.18;
  background-image:
    linear-gradient(rgba(243, 210, 122, 0.06) 1px, transparent 1px),
    linear-gradient(90deg, rgba(243, 210, 122, 0.06) 1px, transparent 1px);
  background-size: 52px 52px;
  mask-image: radial-gradient(circle at 50% 32%, black 18%, transparent 72%);

  @media (max-width: 739px) {
    display: none;
  }
`;

const HeaderLayer = styled.div`
  position: relative;
  z-index: 2;
`;

const TopAnchor = styled.div`
  position: absolute;
  inset: 0 auto auto 0;
  width: 1px;
  height: 1px;
  pointer-events: none;
`;

interface LayoutProps {
  children: React.ReactNode;
}

const RouteScrollResetInstance: React.FC<{
  readonly anchorRef: React.RefObject<HTMLDivElement | null>;
}> = ({ anchorRef }) => {
  useMountEffect(() => {
    if (typeof window === "undefined" || window.location.hash) {
      return;
    }

    const scrollToHeader = () => {
      const anchor = anchorRef.current;
      if (anchor) {
        anchor.scrollIntoView({ block: "start", inline: "nearest" });
      }

      window.scrollTo({ top: 0, left: 0, behavior: "auto" });
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
    };

    scrollToHeader();

    const rafId = window.requestAnimationFrame(() => {
      scrollToHeader();
    });

    return () => {
      window.cancelAnimationFrame(rafId);
    };
  });

  return null;
};

const RouteScrollReset: React.FC = () => {
  const location = useLocation();
  const isInitialHomeRoute =
    location.pathname === "/" &&
    location.search.length === 0 &&
    location.hash.length === 0;
  const routeKey = `${location.pathname}${location.search}`;
  const anchorRef = React.useRef<HTMLDivElement | null>(null);

  if (isInitialHomeRoute) {
    return null;
  }

  return (
    <>
      <TopAnchor ref={anchorRef} aria-hidden="true" />
      <RouteScrollResetInstance key={routeKey} anchorRef={anchorRef} />
    </>
  );
};

/**
 * @component Layout
 * @description Provides a consistent page layout for the Pack website.
 * This component wraps the main content of the application, including the global styles,
 * header, breadcrumbs, and a main content area with a fade-in animation.
 *
 * @param {LayoutProps} props - The props for the Layout component.
 * @param {React.ReactNode} props.children - The content to be rendered within the main content area.
 * @returns {JSX.Element} The Layout component.
 *
 * @example
 * <Layout>
 *   <MyPageContent />
 * </Layout>
 *
 * @integration
 * - `GlobalStyles`: Applies global CSS resets and base styles.
 * - `Header`: Renders the main navigation header at the top of the page.
 * - `Breadcrumbs`: Renders navigation breadcrumbs (if applicable to the current route). Wrapped in
 *   a global `.container` to align with site-wide centering.
 * - `MainContent`: Provides fade-in animation; its inner content is wrapped with a global
 *   `.container` to unify horizontal padding and max-width.
 *
 * @animation
 * - `MainContent`: Fades in on mount to provide a smooth transition when pages load.
 */
const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { t } = useI18n();

  return (
    <>
      <GlobalStyles />
      <StyledLayout>
        <AmbientGlow aria-hidden="true" />
        <AmbientGrid aria-hidden="true" />
        <AmbientRoutes />
        <GrainOverlay aria-hidden="true" />
        <RouteScrollReset />
        <a className="skip-link" href="#main-content">
          {t("common.skipToContent")}
        </a>
        <HeaderLayer>
          <Header />
        </HeaderLayer>
        <MainContent
          id="main-content"
          tabIndex={-1}
        >
          <div className="container">{children}</div>
        </MainContent>
      </StyledLayout>
    </>
  );
};

export default Layout;
