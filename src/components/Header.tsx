import React from "react";
import { useLocation } from "react-router-dom";
import styled from "styled-components";
import { useI18n } from "@/i18n/I18nProvider";

const StyledHeader = styled.header`
  display: flex;
  justify-content: center;
  width: 100%;
  padding: 1.45rem 0 0.65rem;
  position: relative;
  z-index: 10;

  @media (max-width: 430px) {
    padding: 1rem 0 0.5rem;
  }
`;

const HeaderContainer = styled.div`
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  align-items: center;
  gap: 1rem;
  width: 100%;
  padding: 1rem 1.35rem 1rem 1.5rem;
  border: 1px solid var(--color-border);
  border-radius: 999px;
  background: rgba(16, 13, 10, 0.72);
  backdrop-filter: blur(18px);
  box-shadow: var(--shadow-soft);

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    border-radius: 1.4rem;
    gap: 0.85rem;
    padding: 0.95rem 1rem;
  }
`;

const LogoLink = styled.a`
  display: inline-flex;
  align-items: center;
  justify-self: start;
`;

const LogoWordmark = styled.span`
  display: inline-block;
  background: linear-gradient(
    90deg,
    #feab00 0%,
    #fd9c00 30%,
    #fc6c01 62%,
    #f6151d 100%
  );
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  -webkit-text-fill-color: transparent;
  font-size: 1.32rem;
  font-weight: 800;
  letter-spacing: 0.015em;
  white-space: nowrap;
  line-height: 1.05;

  @media (max-width: 768px) {
    font-size: 1.18rem;
  }

  @media (max-width: 430px) {
    font-size: 1.06rem;
  }
`;

const Navigation = styled.nav`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.52rem;
  flex-wrap: wrap;
  justify-self: center;

  @media (max-width: 768px) {
    width: 100%;
  }
`;

const NavLink = styled.a<{ $isActive?: boolean }>`
  color: ${({ $isActive }) =>
    $isActive ? "var(--color-text-primary)" : "var(--color-text-secondary)"};
  text-decoration: none;
  font-weight: 500;
  font-size: 0.8rem;
  padding: 0.78rem 1rem;
  border-radius: 999px;
  border: 1px solid
    ${({ $isActive }) =>
      $isActive ? "rgba(243, 210, 122, 0.16)" : "transparent"};
  background: ${({ $isActive }) =>
    $isActive ? "rgba(255, 248, 236, 0.08)" : "transparent"};
  letter-spacing: 0.04em;
  text-transform: uppercase;
  transition: color 0.2s ease, background 0.2s ease, border-color 0.2s ease;

  &:hover,
  &:focus-visible {
    color: var(--color-text-primary);
    background: rgba(255, 248, 236, 0.06);
  }
`;

const baseNavItems = [
  { href: "/features", label: "Features" },
  { href: "/how-it-works", label: "How It Works" },
  { href: "/faq", label: "FAQ" },
  { href: "/terms", label: "Terms" },
  { href: "/privacy", label: "Privacy" },
] as const;

const Header: React.FC = () => {
  const location = useLocation();
  const { pathFor, t } = useI18n();
  const navItems =
    __DEV__
      ? ([{ href: "/tsa", label: t("nav.tsaWaits") }, ...baseNavItems.map((item) => ({
          ...item,
          label:
            item.href === "/features"
              ? t("nav.features")
              : item.href === "/how-it-works"
              ? t("nav.howItWorks")
              : item.href === "/faq"
              ? t("nav.faq")
              : item.href === "/terms"
              ? t("nav.terms")
              : t("nav.privacy"),
        }))] as const)
      : baseNavItems;
  const localizedNavItems =
    __DEV__
      ? navItems
      : baseNavItems.map((item) => ({
          ...item,
          label:
            item.href === "/features"
              ? t("nav.features")
              : item.href === "/how-it-works"
              ? t("nav.howItWorks")
              : item.href === "/faq"
              ? t("nav.faq")
              : item.href === "/terms"
              ? t("nav.terms")
              : t("nav.privacy"),
        }));

  return (
    <StyledHeader>
      <div className="container">
        <HeaderContainer>
          <LogoLink href={pathFor("/")} aria-label={t("common.goToHome")}>
            <LogoWordmark>Pack.</LogoWordmark>
          </LogoLink>

          <Navigation aria-label="Primary">
            {localizedNavItems.map((item) => (
              <NavLink
                key={item.href}
                href={pathFor(item.href)}
                $isActive={location.pathname === pathFor(item.href)}
                aria-current={location.pathname === pathFor(item.href) ? "page" : undefined}
              >
                {item.label}
              </NavLink>
            ))}
          </Navigation>
        </HeaderContainer>
      </div>
    </StyledHeader>
  );
};

export default Header;
