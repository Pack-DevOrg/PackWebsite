import React, {Suspense, useState} from "react";
import {Outlet, NavLink, useLocation} from "react-router-dom";
import styled from "styled-components";
import {BarChart3, Home, LogOut, Map, Settings, Users} from "lucide-react";
import {useAuth} from "@/auth/AuthContext";
import type {AuthenticatedUser} from "@/auth/types";
import logoImage from "@/assets/logo.png";
import {useIsomorphicLayoutEffect} from "@/hooks/useIsomorphicLayoutEffect";
import {Button, Card, MicroLabel, PageHeader} from "@/components/ui/Chrome";

const RAIL_MIN_WIDTH_PX = 1100;
const RAIL_MEDIA_QUERY = `(min-width: ${RAIL_MIN_WIDTH_PX}px)`;

const NAV_ITEMS = [
  {id: "home", label: "Home", to: "/app", end: true, Icon: Home},
  {id: "trips", label: "Trips", to: "/app/trips", end: false, Icon: Map},
  {id: "friends", label: "Friends", to: "/app/friends", end: false, Icon: Users},
  {id: "stats", label: "Stats", to: "/app/stats", end: false, Icon: BarChart3},
  {
    id: "settings",
    label: "Settings",
    to: "/app/settings",
    end: false,
    Icon: Settings,
  },
] as const;

type NavItemId = (typeof NAV_ITEMS)[number]["id"];
type NavLayout = "rail" | "tabs";

function readRailMatchBecauseViewport(): boolean {
  if (typeof window === "undefined") {
    return false;
  }
  if (typeof window.matchMedia === "function") {
    return window.matchMedia(RAIL_MEDIA_QUERY).matches;
  }
  return window.innerWidth >= RAIL_MIN_WIDTH_PX;
}

function useRailLayout(): boolean {
  const [isRail, setIsRail] = useState(readRailMatchBecauseViewport);

  useIsomorphicLayoutEffect(() => {
    const sync = () => {
      setIsRail(readRailMatchBecauseViewport());
    };
    sync();

    const media =
      typeof window.matchMedia === "function"
        ? window.matchMedia(RAIL_MEDIA_QUERY)
        : null;

    if (media !== null) {
      if (typeof media.addEventListener === "function") {
        media.addEventListener("change", sync);
      } else if (typeof media.addListener === "function") {
        media.addListener(sync);
      }
    }
    window.addEventListener("resize", sync);

    return () => {
      if (media !== null) {
        if (typeof media.removeEventListener === "function") {
          media.removeEventListener("change", sync);
        } else if (typeof media.removeListener === "function") {
          media.removeListener(sync);
        }
      }
      window.removeEventListener("resize", sync);
    };
  }, []);

  return isRail;
}

function activeNavIdBecausePath(pathname: string): NavItemId {
  if (pathname === "/app" || pathname === "/app/") {
    return "home";
  }
  if (pathname.startsWith("/app/trips")) {
    return "trips";
  }
  if (pathname.startsWith("/app/friends")) {
    return "friends";
  }
  if (pathname.startsWith("/app/stats")) {
    return "stats";
  }
  if (pathname.startsWith("/app/settings")) {
    return "settings";
  }
  return "home";
}

function initialsBecauseUser(user: AuthenticatedUser | null): string {
  if (user !== null && user.name !== undefined && user.name.trim().length > 0) {
    const letters = user.name
      .split(" ")
      .filter((part) => part.length > 0)
      .map((part) => part[0])
      .join("")
      .slice(0, 2);
    if (letters.length > 0) {
      return letters;
    }
  }
  if (
    user !== null &&
    user.email !== undefined &&
    user.email.length >= 2
  ) {
    return user.email.slice(0, 2);
  }
  return "PK";
}

const Shell = styled.div<{ $rail: boolean }>`
  min-height: 100vh;
  background: var(--color-bg-primary);
  color: var(--color-text-primary);
  display: flex;
  flex-direction: ${({$rail}) => ($rail ? "row" : "column")};
`;

const Rail = styled.aside`
  width: 17rem;
  flex-shrink: 0;
  align-self: stretch;
  padding: var(--space-3);
  border-right: 1px solid var(--color-border);
  background: var(--color-bg-primary);
`;

const RailCard = styled(Card)`
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  min-height: calc(100vh - var(--space-4));
  padding: var(--space-3);
`;

const RailNavWrap = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  flex: 1;
`;

const BrandMark = styled.img`
  width: 1.15rem;
  height: 1.15rem;
  object-fit: contain;
`;

const SignOutRow = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  margin-top: auto;
`;

const Initials = styled.span`
  font-size: var(--font-size-small);
  font-weight: 700;
  letter-spacing: var(--tracking-eyebrow);
  text-transform: uppercase;
  color: var(--color-text-secondary);
`;

const MobileTop = styled.header`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-3);
  padding: var(--space-3);
  border-bottom: 1px solid var(--color-border);
  background: var(--color-surface);
`;

const Nav = styled.nav<{ $layout: NavLayout }>`
  display: flex;
  flex-direction: ${({$layout}) => ($layout === "rail" ? "column" : "row")};
  align-items: stretch;
  gap: var(--space-1);
  width: 100%;
`;

const NavItem = styled(NavLink)<{$active: boolean; $layout: NavLayout}>`
  position: relative;
  flex: ${({$layout}) => ($layout === "tabs" ? "1" : "0 0 auto")};
  display: inline-flex;
  flex-direction: ${({$layout}) => ($layout === "tabs" ? "column" : "row")};
  align-items: center;
  justify-content: ${({$layout}) =>
    $layout === "tabs" ? "center" : "flex-start"};
  gap: var(--space-2);
  padding: var(--space-2) var(--space-3);
  border-radius: var(--radius-l);
  border: 1px solid
    ${({$active}) => ($active ? "var(--color-accent)" : "transparent")};
  background: ${({$active}) =>
    $active ? "var(--color-accent)" : "transparent"};
  color: ${({$active}) =>
    $active ? "var(--color-text-on-accent)" : "var(--color-text-secondary)"};
  font-weight: 700;
  font-size: var(--font-size-small);
  letter-spacing: var(--tracking-eyebrow);
  text-transform: uppercase;
  text-decoration: none;
  cursor: pointer;

  &:hover {
    background: ${({$active}) =>
      $active ? "var(--color-accent)" : "var(--color-background-subtle)"};
  }

  &:focus-visible {
    outline: 2px solid var(--color-accent);
    outline-offset: 2px;
  }
`;

const TabBar = styled.div`
  position: sticky;
  bottom: 0;
  z-index: 2;
  background: var(--color-surface);
  border-top: 1px solid var(--color-border);
  padding: var(--space-2);
`;

const Main = styled.main`
  width: 100%;
  flex: 1;
  min-width: 0;
  padding: var(--space-4);
  position: relative;
`;

const RouteLoadingState = styled.div`
  min-height: 40vh;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-text-secondary);
  font-size: var(--font-size-base);
`;

function AppNav({
  layout,
  activeId,
}: {
  readonly layout: NavLayout;
  readonly activeId: NavItemId;
}) {
  return (
    <Nav aria-label="App" data-nav-layout={layout} $layout={layout}>
      {NAV_ITEMS.map((item) => {
        const isActive = activeId === item.id;
        return (
          <NavItem
            key={item.id}
            to={item.to}
            end={item.end}
            $active={isActive}
            $layout={layout}
          >
            <item.Icon size={18} aria-hidden="true" />
            {item.label}
          </NavItem>
        );
      })}
    </Nav>
  );
}

function SignOutControl({onSignOut}: {readonly onSignOut: () => void}) {
  return (
    <Button type="button" variant="ghost" onClick={onSignOut}>
      <LogOut size={16} aria-hidden="true" />
      Sign out
    </Button>
  );
}

export const AppShell: React.FC = () => {
  const {user, logout} = useAuth();
  const location = useLocation();
  const isRail = useRailLayout();
  const activeId = activeNavIdBecausePath(location.pathname);
  const initials = initialsBecauseUser(user);
  const layout: NavLayout = isRail ? "rail" : "tabs";

  const onSignOut = () => {
    void logout();
  };

  return (
    <Shell $rail={isRail}>
      {isRail ? (
        <Rail>
          <RailCard>
            <PageHeader title="Pack" subtitle="Travel planner">
              <BrandMark src={logoImage} alt="" />
            </PageHeader>
            <RailNavWrap>
              <MicroLabel>Menu</MicroLabel>
              <AppNav layout={layout} activeId={activeId} />
            </RailNavWrap>
            <SignOutRow>
              <Initials>{initials}</Initials>
              <SignOutControl onSignOut={onSignOut} />
            </SignOutRow>
          </RailCard>
        </Rail>
      ) : (
        <MobileTop>
          <PageHeader title="Pack" subtitle="Travel planner">
            <BrandMark src={logoImage} alt="" />
          </PageHeader>
          <SignOutControl onSignOut={onSignOut} />
        </MobileTop>
      )}

      <Main>
        <Suspense fallback={<RouteLoadingState>Loading…</RouteLoadingState>}>
          <Outlet />
        </Suspense>
      </Main>

      {isRail ? null : (
        <TabBar>
          <AppNav layout={layout} activeId={activeId} />
        </TabBar>
      )}
    </Shell>
  );
};
