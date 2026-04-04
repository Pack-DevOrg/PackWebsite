import React from "react";
import styled from "styled-components";
import GlobalStyles from "../styles/GlobalStyles";
import { useI18n } from "../i18n/I18nProvider";
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

const AmbientGlow = styled.div`
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 0;
  background:
    radial-gradient(circle at 12% 18%, rgba(231, 35, 64, 0.18), transparent 28%),
    radial-gradient(circle at 82% 8%, rgba(243, 210, 122, 0.14), transparent 24%),
    radial-gradient(circle at 50% 78%, rgba(243, 210, 122, 0.08), transparent 32%),
    radial-gradient(circle at 88% 48%, rgba(231, 35, 64, 0.1), transparent 24%),
    radial-gradient(circle at 18% 72%, rgba(243, 210, 122, 0.08), transparent 22%);

  @media (max-width: 739px) {
    background:
      radial-gradient(circle at 80% 10%, rgba(243, 210, 122, 0.08), transparent 18%),
      radial-gradient(circle at 15% 20%, rgba(231, 35, 64, 0.08), transparent 18%);
  }
`;

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

interface LayoutProps {
  children: React.ReactNode;
}

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
