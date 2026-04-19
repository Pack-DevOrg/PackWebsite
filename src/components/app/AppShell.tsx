import { Suspense, useCallback, useRef, useState } from "react";
import { Outlet, NavLink, useLocation } from "react-router-dom";
import styled from "styled-components";
import { LogOut, Sparkles } from "lucide-react";
import { useAuth } from "@/auth/AuthContext";
import logoImage from "@/assets/logo.png";
import { useIsomorphicLayoutEffect } from "@/hooks/useIsomorphicLayoutEffect";

const NAV_ITEMS = [
  { id: "home", label: "Home", to: "/app", end: true },
  { id: "trips", label: "Trips", to: "/app/trips" },
] as const;

type NavItemId = (typeof NAV_ITEMS)[number]["id"];

const Shell = styled.div`
  min-height: 100vh;
  background: var(--page-gradient);
  color: var(--color-text-primary);
  display: flex;
  flex-direction: column;
  position: relative;

  &::before {
    content: "";
    position: fixed;
    inset: 0;
    background-image:
      linear-gradient(rgba(255, 248, 236, 0.03) 1px, transparent 1px),
      linear-gradient(90deg, rgba(255, 248, 236, 0.03) 1px, transparent 1px),
      linear-gradient(90deg, rgba(8, 7, 6, 0.14) 0%, rgba(8, 7, 6, 0.02) 34%, rgba(243, 210, 122, 0.015) 70%, rgba(243, 210, 122, 0.045) 100%);
    background-size: 32px 32px, 32px 32px, auto;
    mask-image: linear-gradient(180deg, rgba(0, 0, 0, 0.34), transparent 82%);
    opacity: 0.55;
    pointer-events: none;
    z-index: 0;
  }
`;

const Header = styled.header`
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: min(1240px, calc(100% - 2rem));
  margin: 1.05rem auto 0;
  padding: 0.95rem 1.1rem;
  gap: 1.5rem;
  position: sticky;
  top: 0.9rem;
  z-index: 10;
  background: rgba(16, 13, 10, 0.72);
  backdrop-filter: blur(18px);
  border: 1px solid var(--color-border);
  border-radius: 999px;
  box-shadow: var(--shadow-soft);

  @media (max-width: 960px) {
    flex-direction: column;
    align-items: stretch;
    gap: 1rem;
    width: calc(100% - 1rem);
    margin-top: 0.5rem;
    top: 0.5rem;
    padding: 0.85rem 0.9rem;
    border-radius: 28px;
  }
`;

const HeaderLead = styled.div`
  display: flex;
  align-items: center;
  gap: 1.25rem;

  @media (max-width: 640px) {
    gap: 0.75rem;
    justify-content: space-between;
  }
`;

const Brand = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 0.75rem;

  img {
    width: 2.5rem;
    height: 2.5rem;
    object-fit: contain;
  }

  div {
    display: grid;
    gap: 0.1rem;
  }

  strong {
    font-size: clamp(1rem, 1.4vw, 1.1rem);
    font-weight: 700;
    letter-spacing: -0.02em;
    line-height: 1;
  }

  span {
    font-size: 0.7rem;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: var(--color-text-secondary);
  }
`;

const Nav = styled.nav`
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;

  @media (max-width: 960px) {
    width: 100%;
  }
`;

const NavTabs = styled.div`
  position: relative;
  display: inline-flex;
  gap: 0.5rem;
  padding: 0.38rem;
  background: var(--color-surface);
  border-radius: 999px;
  border: 1px solid var(--color-border);

  @media (max-width: 960px) {
    width: 100%;
  }
`;

const NavTabButton = styled(NavLink)<{ readonly $active: boolean }>`
  position: relative;
  flex: 1;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.78rem 1.25rem;
  border-radius: 999px;
  border: none;
  background: transparent;
  color: ${({ $active }) =>
    $active ? "#120d08" : "var(--color-text-secondary)"};
  font-weight: ${({ $active }) => ($active ? 700 : 600)};
  font-size: 0.84rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  text-decoration: none;
  cursor: pointer;
  transition: color 0.2s ease, background 0.2s ease;
  z-index: 1;

  &:hover {
    background: ${({ $active }) =>
      $active ? "transparent" : "rgba(255, 248, 236, 0.06)"};
  }

  &:focus-visible {
    outline: 2px solid rgba(240, 198, 45, 0.4);
    outline-offset: 2px;
  }
`;

const NavTabHighlight = styled.span`
  position: absolute;
  top: 0;
  left: 0;
  bottom: 0;
  border-radius: 999px;
  background: linear-gradient(135deg, #f3d27a 0%, #ebbe58 100%);
  box-shadow: 0 12px 28px rgba(243, 210, 122, 0.16);
  pointer-events: none;
  z-index: 0;
  width: 0;
  transform: translateX(0);
  transition: transform 160ms ease-out, width 160ms ease-out;

  @media (prefers-reduced-motion: reduce) {
    transition: none;
  }
`;

const UserMenu = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 0.7rem;
  padding: 0.28rem;
  border-radius: 999px;
  background: var(--color-surface);
  border: 1px solid var(--color-border);

  @media (max-width: 960px) {
    width: 100%;
    justify-content: flex-end;
    padding: 0;
    background: transparent;
    border: none;
  }
`;

const Avatar = styled.div`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: var(--color-accent-soft);
  border: 1px solid var(--color-border-medium);
  color: var(--color-text-primary);
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;

  @media (max-width: 520px) {
    display: none;
  }
`;

const LogoutButton = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  padding: 0.68rem 1.1rem;
  border-radius: 999px;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  color: var(--color-text-primary);
  cursor: pointer;
  font-weight: 600;
  transition: transform 0.15s ease, background 0.15s ease, opacity 0.15s ease;

  &:hover {
    transform: translateY(-1px);
    background: var(--color-surface-strong);
  }

  @media (max-width: 520px) {
    width: 100%;
    justify-content: center;
  }
`;

const Main = styled.main`
  width: 100%;
  max-width: 1240px;
  margin: 0 auto;
  flex: 1;
  padding: clamp(1.35rem, 3vw, 2.75rem) clamp(1rem, 3vw, 1.5rem) clamp(2rem, 4vw, 3rem);
  position: relative;
  z-index: 1;

  @media (max-width: 960px) {
    padding: 1rem 0.75rem 1.5rem;
  }
`;

const BetaBadge = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  font-size: 0.74rem;
  font-weight: 600;
  padding: 0.46rem 0.8rem;
  border-radius: 999px;
  background: rgba(243, 210, 122, 0.1);
  color: var(--color-accent);
  border: 1px solid var(--color-border);
  letter-spacing: 0.08em;
  text-transform: uppercase;
`;

const RouteLoadingState = styled.div`
  min-height: 40vh;
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${({ theme }) => theme?.colors?.neutral?.gray200 ?? "#d5d6dc"};
  font-size: 0.95rem;
`;

export const AppShell: React.FC = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [highlightPosition, setHighlightPosition] = useState<
    | {
        width: number;
        left: number;
      }
    | null
  >(null);
  const tabsRef = useRef<HTMLDivElement | null>(null);
  const tabRefs = useRef<Record<NavItemId, HTMLAnchorElement | null>>({
    home: null,
    trips: null,
  });

  const activeTab: NavItemId = location.pathname.startsWith("/app/trips")
    ? "trips"
    : "home";

  const updateHighlightPosition = useCallback(() => {
    const container = tabsRef.current;
    const activeElement = tabRefs.current[activeTab];

    if (!container || !activeElement) {
      setHighlightPosition(null);
      return;
    }

    const containerRect = container.getBoundingClientRect();
    const activeRect = activeElement.getBoundingClientRect();

    setHighlightPosition({
      width: activeRect.width,
      left: activeRect.left - containerRect.left,
    });
  }, [activeTab]);

  useIsomorphicLayoutEffect(() => {
    updateHighlightPosition();
  }, [updateHighlightPosition]);

  useIsomorphicLayoutEffect(() => {
    window.addEventListener("resize", updateHighlightPosition);
    return () => window.removeEventListener("resize", updateHighlightPosition);
  }, [updateHighlightPosition]);

  const initials = user?.name
    ? user.name
        .split(" ")
        .filter(Boolean)
        .map((part) => part[0])
        .join("")
        .slice(0, 2)
    : user?.email?.slice(0, 2) ?? "DA";

  return (
    <Shell>
      <Header>
        <HeaderLead>
          <Brand>
            <img src={logoImage} alt="Pack" />
            <div>
              <strong>Pack</strong>
              <span>Travel planner</span>
            </div>
          </Brand>
          <BetaBadge>
            <Sparkles size={16} /> Web beta
          </BetaBadge>
        </HeaderLead>

        <Nav>
          <NavTabs ref={tabsRef}>
            {highlightPosition ? (
              <NavTabHighlight
                role="presentation"
                style={{
                  width: `${highlightPosition.width}px`,
                  transform: `translateX(${highlightPosition.left}px)`,
                }}
              />
            ) : null}
            {NAV_ITEMS.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <NavTabButton
                  key={tab.id}
                  to={tab.to}
                  end={tab.end}
                  $active={isActive}
                  ref={(node) => {
                    tabRefs.current[tab.id] = node;
                  }}
                >
                  {tab.label}
                </NavTabButton>
              );
            })}
          </NavTabs>
        </Nav>

        <UserMenu>
          <Avatar aria-hidden="true">{initials}</Avatar>
          <LogoutButton onClick={() => logout()}>
            <LogOut size={17} />
            Sign out
          </LogoutButton>
        </UserMenu>
      </Header>

      <Main>
        <Suspense fallback={<RouteLoadingState>Loading…</RouteLoadingState>}>
          <Outlet />
        </Suspense>
      </Main>
    </Shell>
  );
};
