import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X } from "lucide-react";
import styled from "styled-components";
import { BorderBeam } from "@pack/web-effects/border-beam";
import { shouldExposeTsaForCurrentHost } from "@/config/appConfig";
import { useI18n } from "@/i18n/I18nProvider";
import logoPMark from "@/assets/optimized/logo-mark-64.webp";

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

const HeaderContainer = styled.div<{ $isMenuOpen: boolean }>`
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
    grid-template-columns: auto auto;
    border-radius: 1.4rem;
    column-gap: 0.65rem;
    row-gap: ${({ $isMenuOpen }) => ($isMenuOpen ? "0.65rem" : "0")};
    padding: 0.72rem 0.82rem 0.72rem 1rem;
  }
`;

const LogoLink = styled(Link)`
  display: inline-flex;
  align-items: center;
  justify-self: start;
`;

const LogoMark = styled.img`
  display: block;
  width: 2.15rem;
  height: 2.15rem;
  object-fit: contain;

  @media (max-width: 768px) {
    width: 2rem;
    height: 2rem;
  }

  @media (max-width: 430px) {
    width: 1.85rem;
    height: 1.85rem;
  }
`;

const MenuToggle = styled.button`
  display: none;
  align-items: center;
  justify-content: center;
  justify-self: end;
  width: 2.6rem;
  height: 2.6rem;
  padding: 0;
  border: 1px solid rgba(243, 210, 122, 0.16);
  border-radius: 999px;
  background: rgba(255, 248, 236, 0.07);
  color: var(--color-text-primary);
  cursor: pointer;
  transition: background 0.2s ease, border-color 0.2s ease;

  &:hover,
  &:focus-visible {
    background: rgba(255, 248, 236, 0.12);
    border-color: rgba(243, 210, 122, 0.28);
  }

  svg {
    width: 1.25rem;
    height: 1.25rem;
  }

  @media (max-width: 768px) {
    display: inline-flex;
  }
`;

const MobileNavigationPanel = styled.div<{ $isOpen: boolean }>`
  display: contents;

  @media (max-width: 768px) {
    display: block;
    grid-column: 1 / -1;
    width: 100%;
    max-height: ${({ $isOpen }) => ($isOpen ? "22rem" : "0")};
    opacity: ${({ $isOpen }) => ($isOpen ? "1" : "0")};
    overflow: hidden;
    padding-top: ${({ $isOpen }) => ($isOpen ? "0.28rem" : "0")};
    transform: translateY(${({ $isOpen }) => ($isOpen ? "0" : "-0.25rem")});
    transition: max-height 220ms ease, opacity 180ms ease, padding-top 220ms ease,
      transform 220ms ease;
    pointer-events: ${({ $isOpen }) => ($isOpen ? "auto" : "none")};

    @media (prefers-reduced-motion: reduce) {
      transform: none;
      transition: none;
    }
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
    display: grid;
    grid-template-columns: 1fr;
    width: 100%;
    gap: 0.35rem;
    justify-items: stretch;
  }
`;

const NavLink = styled(Link)<{ $isActive?: boolean }>`
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

  @media (max-width: 768px) {
    display: flex;
    justify-content: center;
    width: 100%;
    padding: 0.84rem 1rem;
    background: rgba(255, 248, 236, 0.045);
    border-color: ${({ $isActive }) =>
      $isActive ? "rgba(243, 210, 122, 0.2)" : "rgba(255, 248, 236, 0.06)"};
  }
`;

const baseNavItems = [
  { href: "/features", label: "Features" },
  { href: "/how-it-works", label: "How It Works" },
  { href: "/faq", label: "FAQ" },
] as const;

const NavCta = styled(Link)`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.66rem 1.3rem;
  border-radius: 999px;
  border: 1px solid rgba(243, 210, 122, 0.45);
  background: rgba(243, 210, 122, 0.06);
  color: #f3d27a;
  font-weight: 700;
  font-size: 0.8rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  text-decoration: none;
  white-space: nowrap;
  transition: border-color 0.35s var(--ease-luxe), background 0.35s var(--ease-luxe),
    color 0.35s var(--ease-luxe);

  &:hover,
  &:focus-visible {
    border-color: rgba(243, 210, 122, 0.85);
    background: rgba(243, 210, 122, 0.14);
    color: #ffe9ae;
  }

  @media (max-width: 768px) {
    width: 100%;
    padding: 0.84rem 1rem;
  }
`;

const Header: React.FC = () => {
  const location = useLocation();
  const { pathFor, t } = useI18n();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const localizedBaseNavItems = baseNavItems.map((item) => ({
    ...item,
    label:
      item.href === "/features"
        ? t("nav.features")
        : item.href === "/how-it-works"
        ? t("nav.howItWorks")
        : t("nav.faq"),
  }));
  const localizedNavItems = shouldExposeTsaForCurrentHost()
    ? [{ href: "/tsa", label: t("nav.tsaWaits") }, ...localizedBaseNavItems]
    : localizedBaseNavItems;

  return (
    <StyledHeader>
      <div className="container">
        <HeaderContainer $isMenuOpen={isMenuOpen}>
          <LogoLink to={pathFor("/")} aria-label={t("common.goToHome")}>
            <LogoMark src={logoPMark} alt="Pack" />
          </LogoLink>

          <MenuToggle
            type="button"
            aria-label="Toggle navigation menu"
            aria-controls="primary-navigation"
            aria-expanded={isMenuOpen}
            onClick={() => setIsMenuOpen((current) => !current)}
          >
            {isMenuOpen ? <X aria-hidden="true" /> : <Menu aria-hidden="true" />}
          </MenuToggle>

          <MobileNavigationPanel
            $isOpen={isMenuOpen}
            role={isMenuOpen ? "dialog" : undefined}
            aria-label={isMenuOpen ? "Navigation" : undefined}
          >
            <Navigation id="primary-navigation" aria-label="Primary">
              {localizedNavItems.map((item) => (
                <NavLink
                  key={item.href}
                  to={pathFor(item.href)}
                  $isActive={location.pathname === pathFor(item.href)}
                  aria-current={location.pathname === pathFor(item.href) ? "page" : undefined}
                  onClick={() => setIsMenuOpen(false)}
                >
                  {item.label}
                </NavLink>
              ))}
              <BorderBeam size="sm" colorVariant="sunset" theme="dark">
                <NavCta
                  to={`${pathFor("/")}#waitlist`}
                  onClick={(event) => {
                    setIsMenuOpen(false);
                    if (location.pathname === pathFor("/")) {
                      const form = document.getElementById("waitlist");
                      if (form) {
                        event.preventDefault();
                        form.scrollIntoView({ behavior: "smooth", block: "center" });
                      }
                    }
                  }}
                >
                  {t("nav.joinWaitlist")}
                </NavCta>
              </BorderBeam>
            </Navigation>
          </MobileNavigationPanel>
        </HeaderContainer>
      </div>
    </StyledHeader>
  );
};

export default Header;
