import { Suspense, lazy, useCallback, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import styled, { keyframes } from "styled-components";
import { Sparkles, Wand2, Plane, Loader2, Search, TrendingUp, Clock } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/auth/AuthContext";
import { useApiClient } from "@/api/useApiClient";
import { deleteTrip, fetchTrips } from "@/api/trips";
import type { Trip } from "@/api/trips";
import { useIsomorphicLayoutEffect } from "@/hooks/useIsomorphicLayoutEffect";
import { useMountEffect } from "@/hooks/useMountEffect";
import { useI18n } from "@/i18n/I18nProvider";
import { dedupeTripsById, uniquePastTripsByTitle } from "@/utils/tripDedup";

const LazyUpcomingTripCard = lazy(async () => {
  const module = await import("@/components/app/UpcomingTripCard");
  return {default: module.UpcomingTripCard};
});

const LazyEnhancedTripCard = lazy(async () => {
  const module = await import("@/components/app/EnhancedTripCard");
  return {default: module.EnhancedTripCard};
});

const LazyTravelStatsOverview = lazy(async () => {
  const module = await import("@/components/app/TravelStatsOverview");
  return {default: module.TravelStatsOverview};
});

const isPhotoDerivedTrip = (trip: Trip): boolean => {
  if (trip.tripId.startsWith("photo:")) {
    return true;
  }

  const metadata = trip.metadata;
  if (!metadata || typeof metadata !== "object") {
    return false;
  }

  return (metadata as Record<string, unknown>).photoDerived === true;
};

const getTripYear = (trip: Trip): number | null => {
  const candidates = [trip.startDate, trip.endDate, trip.createdAt];

  for (const candidate of candidates) {
    if (typeof candidate !== "string" || candidate.length < 4) {
      continue;
    }
    const year = Number.parseInt(candidate.slice(0, 4), 10);
    if (Number.isFinite(year) && year >= 1900 && year <= 3000) {
      return year;
    }
  }

  return null;
};

const PageContainer = styled.div`
  display: grid;
  gap: clamp(1.75rem, 3vw, 2.5rem);

  @media (min-width: 1101px) {
    margin-top: -10px;
  }
`;

const HeaderSection = styled.section`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1.5rem;
  flex-wrap: wrap;
  padding: clamp(1rem, 2.2vw, 1.35rem);
  border-radius: 28px;
  border: 1px solid var(--color-border);
  background:
    radial-gradient(circle at 0% 0%, rgba(231, 35, 64, 0.12), transparent 28%),
    radial-gradient(circle at 100% 0%, rgba(243, 210, 122, 0.1), transparent 40%),
    linear-gradient(135deg, rgba(22, 17, 13, 0.84), rgba(27, 21, 16, 0.78));
  box-shadow: var(--shadow-soft);
  backdrop-filter: blur(18px);
`;

const Greeting = styled.div`
  display: grid;
  gap: 0.4rem;

  h2 {
    margin: 0;
    font-size: clamp(1.6rem, 2.6vw, 2.1rem);
    letter-spacing: -0.03em;
    line-height: 0.98;
  }

  p {
    margin: 0;
    font-size: 1rem;
    color: var(--color-text-secondary);
  }
`;

const Actions = styled.div`
  display: inline-flex;
  gap: 0.85rem;
  flex-wrap: wrap;
`;

const SecondaryAction = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  padding: 0.7rem 1.35rem;
  border-radius: 999px;
  border: 1px solid var(--color-border);
  background: var(--color-surface);
  color: ${({ theme }) => theme?.colors?.neutral?.gray050 ?? "#ffffff"};
  font-weight: 500;
  cursor: pointer;
  transition: transform 0.15s ease, border 0.15s ease;

  &:hover {
    transform: translateY(-1px);
    border-color: var(--color-border-medium);
  }
`;

const TabsContainer = styled.div`
  position: relative;
  display: flex;
  gap: 0.5rem;
  padding: 0.38rem;
  background: var(--color-surface);
  border-radius: 999px;
  border: 1px solid var(--color-border);
`;

const TabButton = styled.button<{ $active?: boolean }>`
  position: relative;
  flex: 1;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.8rem 1.2rem;
  border-radius: 999px;
  border: none;
  background: transparent;
  color: ${({ $active }) =>
    $active ? "#120d08" : "var(--color-text-secondary)"};
  font-weight: ${({ $active }) => ($active ? 700 : 600)};
  font-size: 0.84rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  cursor: pointer;
  transition: color 0.2s ease, background 0.2s ease;
  overflow: hidden;
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

const TabHighlight = styled.span`
  position: absolute;
  top: 0;
  left: 0;
  bottom: 0;
  border-radius: 999px;
  background: linear-gradient(135deg, #f3d27a 0%, #ebbe58 100%);
  box-shadow: 0 14px 30px rgba(243, 210, 122, 0.18);
  pointer-events: none;
  z-index: 0;
  width: 0;
  transform: translateX(0);
  transition: transform 160ms ease-out, width 160ms ease-out;

  @media (prefers-reduced-motion: reduce) {
    transition: none;
  }
`;

const SearchRow = styled.div`
  width: 100%;
  display: flex;
  flex-wrap: wrap;
  gap: 1.25rem;
  align-items: center;
  justify-content: space-between;
`;

const SearchContainer = styled.div`
  position: relative;
  width: 100%;
  max-width: 500px;
`;

const SearchInput = styled.input`
  width: 100%;
  padding: 0.875rem 1.25rem 0.875rem 3rem;
  border-radius: 999px;
  border: 1px solid var(--color-border);
  background: rgba(255, 248, 236, 0.06);
  color: ${({ theme }) => theme?.colors?.neutral?.gray050 ?? "#ffffff"};
  font-size: 0.95rem;
  transition: border 0.2s ease;

  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme?.colors?.brand?.primary ?? "#f0c62d"};
  }

  &::placeholder {
    color: ${({ theme }) => theme?.colors?.neutral?.gray200 ?? "#d5d6dc"};
    opacity: 0.6;
  }
`;

const SearchIcon = styled(Search)`
  position: absolute;
  left: 1.1rem;
  top: 50%;
  transform: translateY(-50%);
  width: 18px;
  height: 18px;
  color: ${({ theme }) => theme?.colors?.neutral?.gray200 ?? "#d5d6dc"};
  pointer-events: none;
`;

const GradientLegend = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 0.75rem;
  min-width: 0;
  flex: 1;
  max-width: 320px;

  @media (max-width: 768px) {
    max-width: 100%;
    width: 100%;
  }
`;

const GradientLabel = styled.span`
  font-size: 0.75rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--color-text-secondary);
`;

const GradientBar = styled.span`
  flex: 1;
  height: 0.72rem;
  border-radius: 999px;
  background:
    linear-gradient(
      90deg,
      rgba(231, 35, 64, 0.9) 0%,
      rgba(245, 84, 40, 0.88) 16%,
      rgba(255, 152, 0, 0.84) 34%,
      rgba(240, 198, 45, 0.8) 50%,
      rgba(69, 177, 224, 0.82) 68%,
      rgba(33, 150, 243, 0.88) 84%,
      rgba(31, 94, 210, 0.92) 100%
    ),
    linear-gradient(90deg, rgba(18, 18, 18, 0.96) 0%, rgba(44, 44, 44, 0.9) 100%);
  border: 1px solid rgba(255, 255, 255, 0.22);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.16),
    inset 0 0 14px rgba(0, 0, 0, 0.22),
    0 6px 18px rgba(9, 12, 22, 0.24);
`;

const SectionHeading = styled.div`
  display: flex;
  align-items: center;
  gap: 0.65rem;
  font-weight: 700;
  font-size: 1.05rem;
  letter-spacing: -0.01em;

  span {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 34px;
    height: 34px;
    border-radius: 50%;
    background: rgba(243, 210, 122, 0.12);
    color: ${({ theme }) => theme?.colors?.brand?.primary ?? "#f3d27a"};
  }
`;

const YearFilterRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-top: 0.75rem;
  margin-bottom: 0.95rem;
`;

const YearFilterButton = styled.button<{ $active: boolean }>`
  border: 1px solid
    ${({ $active }) =>
      $active ? "rgba(240, 198, 45, 0.45)" : "rgba(255, 255, 255, 0.14)"};
  background: ${({ $active }) =>
    $active
      ? "linear-gradient(135deg, rgba(240, 198, 45, 0.2), rgba(245, 159, 11, 0.14))"
      : "rgba(255, 248, 236, 0.04)"};
  color: ${({ $active }) =>
    $active ? "#f8fafc" : "rgba(226, 232, 240, 0.85)"};
  border-radius: 999px;
  padding: 0.38rem 0.82rem;
  font-size: 0.78rem;
  letter-spacing: 0.03em;
  cursor: pointer;
  transition: border-color 0.18s ease, background 0.18s ease, transform 0.18s ease;

  &:hover {
    transform: translateY(-1px);
    border-color: rgba(240, 198, 45, 0.28);
  }
`;

const TripGrid = styled.div<{
  $singleColumn?: boolean;
  $columns?: number;
}>`
  display: grid;
  gap: 1.8rem;
  grid-template-columns: ${({ $singleColumn, $columns }) => {
    if ($singleColumn) {
      return "minmax(0, 1fr)";
    }
    if ($columns && $columns > 1) {
      return `repeat(${$columns}, minmax(0, 1fr))`;
    }
    return "repeat(auto-fit, minmax(320px, 1fr))";
  }};

  @media (max-width: 1280px) {
    grid-template-columns: ${({ $singleColumn, $columns }) => {
      if ($singleColumn) {
        return "minmax(0, 1fr)";
      }
      if ($columns && $columns >= 3) {
        return "repeat(2, minmax(0, 1fr))";
      }
      return "repeat(auto-fit, minmax(280px, 1fr))";
    }};
  }

  @media (max-width: 768px) {
    grid-template-columns: ${({ $singleColumn }) =>
      $singleColumn ? "minmax(0, 1fr)" : "minmax(0, 1fr)"};
  }
`;

const TripGridItem = styled.div`
  display: flex;
  width: 100%;
  padding: 0.2rem;
`;

const EmptyState = styled.div`
  padding: clamp(1.75rem, 3vw, 2.5rem);
  border-radius: 24px;
  border: 1px dashed var(--color-border);
  background: rgba(255, 248, 236, 0.035);
  text-align: center;
  display: grid;
  gap: 0.75rem;
  color: ${({ theme }) => theme?.colors?.neutral?.gray200 ?? "#d5d6dc"};
`;

const StatsFallback = styled(EmptyState)`
  margin-top: 2rem;
`;

const CardGridFallback = styled(TripGrid)`
  margin-top: 0;
`;

const CardLoadingShell = styled(EmptyState)`
  width: 100%;
  min-height: 320px;
`;

const spin = keyframes`
  to { transform: rotate(360deg); }
`;

const LoadingIcon = styled(Loader2)`
  width: 18px;
  height: 18px;
  animation: ${spin} 0.9s linear infinite;
`;

type TabType = "upcoming" | "statistics" | "past";

const TAB_ITEMS: Array<{ id: TabType; label: string }> = [
  { id: "upcoming", label: "Upcoming" },
  { id: "statistics", label: "Statistics" },
  { id: "past", label: "Past Trips" },
];

const isUpcoming = (trip: Trip): boolean => {
  const end = new Date(`${trip.endDate}T23:59:59Z`).getTime();
  return end >= Date.now();
};

export const EnhancedTripsPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { pathFor, t } = useI18n();
  const apiClient = useApiClient();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<TabType>("upcoming");
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedPastRow, setExpandedPastRow] = useState<number | null>(null);
  const [selectedStatsYear, setSelectedStatsYear] = useState<string>("all");
  const tabRefs = useRef<Partial<Record<TabType, HTMLButtonElement | null>>>(
    {}
  );
  const [highlightPosition, setHighlightPosition] = useState<{
    width: number;
    left: number;
  } | null>(null);
  const updateHighlightPositionRef = useRef<() => void>(() => undefined);

  const updateHighlightPosition = useCallback(() => {
    const node = tabRefs.current[activeTab];
    if (!node) {
      return;
    }

    const nextPosition = {
      width: node.offsetWidth,
      left: node.offsetLeft,
    };

    setHighlightPosition((previous) => {
      if (
        previous &&
        previous.width === nextPosition.width &&
        previous.left === nextPosition.left
      ) {
        return previous;
      }
      return nextPosition;
    });
  }, [activeTab]);
  updateHighlightPositionRef.current = updateHighlightPosition;

  useIsomorphicLayoutEffect(() => {
    updateHighlightPosition();
  }, [updateHighlightPosition]);

  useMountEffect(() => {
    const handleResize = () => {
      updateHighlightPositionRef.current();
    };

    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  });

  const tripsQuery = useQuery({
    queryKey: ["trips"],
    queryFn: () => fetchTrips(apiClient),
    staleTime: 1000 * 60 * 5,
  });

  const deleteTripMutation = useMutation({
    mutationFn: (tripId: string) => deleteTrip(apiClient, tripId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["trips"] });
    },
  });

  const dedupedTrips = useMemo(
    () => dedupeTripsById(tripsQuery.data ?? []),
    [tripsQuery.data]
  );

  const visibleTrips = useMemo(
    () => dedupedTrips.filter((trip) => !isPhotoDerivedTrip(trip)),
    [dedupedTrips]
  );

  const upcomingTrips = useMemo(
    () =>
      visibleTrips
        .filter((trip) => isUpcoming(trip))
        .filter((trip) =>
          searchQuery
            ? trip.title.toLowerCase().includes(searchQuery.toLowerCase())
            : true
        )
        .sort(
          (a, b) =>
            new Date(`${a.startDate}T00:00:00Z`).getTime() -
            new Date(`${b.startDate}T00:00:00Z`).getTime()
        ),
    [visibleTrips, searchQuery]
  );

  const pastTrips = useMemo(
    () =>
      uniquePastTripsByTitle(
        visibleTrips
          .filter((trip) => !isUpcoming(trip))
          .filter((trip) =>
            searchQuery
              ? trip.title.toLowerCase().includes(searchQuery.toLowerCase())
              : true
          )
      ).sort(
        (a, b) =>
          new Date(`${b.startDate}T00:00:00Z`).getTime() -
          new Date(`${a.startDate}T00:00:00Z`).getTime()
      ),
    [visibleTrips, searchQuery]
  );

  const statsYears = useMemo(() => {
    const years = new Set<number>();
    visibleTrips.forEach((trip) => {
      const year = getTripYear(trip);
      if (year != null) {
        years.add(year);
      }
    });
    return Array.from(years).sort((a, b) => b - a);
  }, [visibleTrips]);

  const effectiveSelectedStatsYear = useMemo(() => {
    if (selectedStatsYear === "all") {
      return "all";
    }
    return statsYears.some((year) => String(year) === selectedStatsYear)
      ? selectedStatsYear
      : "all";
  }, [selectedStatsYear, statsYears]);

  const statsTrips = useMemo(() => {
    if (effectiveSelectedStatsYear === "all") {
      return visibleTrips;
    }
    return visibleTrips.filter(
      (trip) => String(getTripYear(trip) ?? "") === effectiveSelectedStatsYear
    );
  }, [visibleTrips, effectiveSelectedStatsYear]);

  return (
    <PageContainer>
      <HeaderSection>
        <Greeting>
          <h2>
            {user?.givenName
              ? `Welcome back, ${user.givenName}`
              : t("app.travelHub")}
          </h2>
          <p>{t("app.travelHubSubtitle")}</p>
        </Greeting>
        <Actions>
          <SecondaryAction onClick={() => navigate(pathFor("/faq"))}>
            <Wand2 size={18} />
            {t("common.learnWorkspace")}
          </SecondaryAction>
        </Actions>
      </HeaderSection>

      <TabsContainer>
        {highlightPosition ? (
          <TabHighlight
            role="presentation"
            style={{
              width: `${highlightPosition.width}px`,
              transform: `translateX(${highlightPosition.left}px)`,
            }}
          />
        ) : null}
        {TAB_ITEMS.map((tab) => (
          <TabButton
            key={tab.id}
            type="button"
            ref={(node) => {
              tabRefs.current[tab.id] = node;
            }}
            $active={activeTab === tab.id}
            onClick={() => {
              if (tab.id !== "past") {
                setExpandedPastRow(null);
              }
              setActiveTab(tab.id);
            }}
          >
            {tab.label}
          </TabButton>
        ))}
      </TabsContainer>

      {activeTab !== "statistics" && (
        activeTab === "past" ? (
          <SearchRow>
            <SearchContainer>
              <SearchIcon />
              <SearchInput
                type="text"
                placeholder="Search trips by name, destination..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </SearchContainer>
            <GradientLegend>
              <GradientLabel>Short hop</GradientLabel>
              <GradientBar />
              <GradientLabel>Epic journey</GradientLabel>
            </GradientLegend>
          </SearchRow>
        ) : (
          <SearchContainer>
            <SearchIcon />
            <SearchInput
              type="text"
              placeholder="Search trips by name, destination..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </SearchContainer>
        )
      )}

      {activeTab === "upcoming" && (
        <section>
          <SectionHeading>
            <span>
              <Sparkles size={18} />
            </span>
            Upcoming journeys
          </SectionHeading>
          {upcomingTrips.length === 0 ? (
            <EmptyState>
              <strong>
                {searchQuery
                  ? "No trips match your search."
                  : "No upcoming trips yet."}
              </strong>
              <span>
                {searchQuery
                  ? "Try a different search term."
                  : "Connect your email and calendar so Pack can automatically organize your upcoming trips."}
              </span>
            </EmptyState>
          ) : (
            <Suspense
              fallback={
                <CardGridFallback $columns={3}>
                  {upcomingTrips.slice(0, 6).map((trip) => (
                    <TripGridItem key={trip.tripId}>
                      <CardLoadingShell>
                        <LoadingIcon />
                        <span>Loading trip details…</span>
                      </CardLoadingShell>
                    </TripGridItem>
                  ))}
                </CardGridFallback>
              }
            >
              <TripGrid $columns={3}>
                {upcomingTrips.map((trip) => (
                  <TripGridItem key={trip.tripId}>
                    <LazyUpcomingTripCard
                      trip={trip}
                      onClick={() => {}}
                      onDelete={(tripId) => deleteTripMutation.mutate(tripId)}
                    />
                  </TripGridItem>
                ))}
              </TripGrid>
            </Suspense>
          )}
        </section>
      )}

      {activeTab === "statistics" && (
        <section>
          <SectionHeading>
            <span>
              <TrendingUp size={18} />
            </span>
            Travel statistics
          </SectionHeading>
          {visibleTrips.length > 0 ? (
            <YearFilterRow>
              <YearFilterButton
                type="button"
                $active={effectiveSelectedStatsYear === "all"}
                onClick={() => setSelectedStatsYear("all")}
              >
                All years
              </YearFilterButton>
              {statsYears.map((year) => (
                <YearFilterButton
                  key={year}
                  type="button"
                  $active={effectiveSelectedStatsYear === String(year)}
                  onClick={() => setSelectedStatsYear(String(year))}
                >
                  {year}
                </YearFilterButton>
              ))}
            </YearFilterRow>
          ) : null}
          {visibleTrips.length === 0 ? (
            <EmptyState style={{ marginTop: "2rem" }}>
              <strong>No travel data yet.</strong>
              <span>
                Connect your travel sources to see your personalized travel statistics.
              </span>
            </EmptyState>
          ) : statsTrips.length === 0 ? (
            <EmptyState style={{ marginTop: "2rem" }}>
              <strong>No travel data for {effectiveSelectedStatsYear}.</strong>
              <span>Choose a different year or select All years.</span>
            </EmptyState>
          ) : (
            <Suspense
              fallback={
                <StatsFallback>
                  <LoadingIcon />
                  <span>Loading your travel statistics…</span>
                </StatsFallback>
              }
            >
              <LazyTravelStatsOverview trips={statsTrips} />
            </Suspense>
          )}
        </section>
      )}

      {activeTab === "past" && (
        <section>
          <SectionHeading>
            <span>
              <Plane size={18} />
            </span>
            Past adventures
          </SectionHeading>
          {pastTrips.length === 0 ? (
            <EmptyState>
              <strong>
                {searchQuery
                  ? "No trips match your search."
                  : "Your travel history awaits."}
              </strong>
              <span>
                {searchQuery
                  ? "Try a different search term."
                  : "Connect your email and Pack will rebuild your trip archive with real confirmations."}
              </span>
            </EmptyState>
          ) : (
            <Suspense
              fallback={
                <CardGridFallback $columns={3}>
                  {pastTrips.slice(0, 6).map((trip) => (
                    <TripGridItem key={trip.tripId}>
                      <CardLoadingShell>
                        <LoadingIcon />
                        <span>Loading trip details…</span>
                      </CardLoadingShell>
                    </TripGridItem>
                  ))}
                </CardGridFallback>
              }
            >
              <TripGrid $columns={3}>
                {pastTrips.map((trip) => (
                  <TripGridItem key={trip.tripId}>
                    <LazyEnhancedTripCard
                      trip={trip}
                      onClick={() => {}}
                      isPast
                      expandedRowKey={expandedPastRow}
                      onToggleRow={(rowKey) =>
                        setExpandedPastRow((prev) =>
                          prev === rowKey ? null : rowKey
                        )
                      }
                    />
                  </TripGridItem>
                ))}
              </TripGrid>
            </Suspense>
          )}
        </section>
      )}

      {tripsQuery.isLoading ? (
        <EmptyState>
          <LoadingIcon />
          <span>Loading your trips…</span>
        </EmptyState>
      ) : null}
    </PageContainer>
  );
};
