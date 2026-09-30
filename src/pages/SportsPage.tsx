import styled from "styled-components";
import {Helmet} from "react-helmet-async";
import {useQuery} from "@tanstack/react-query";
import {SportsBoard} from "@/components/sports/SportsBoard";
import {useApiClient} from "@/api/useApiClient";
import {readUserSportsView} from "@/api/sportsView";
import {useAuth} from "@/auth/AuthContext";
import {PageHeader} from "@/components/ui/Chrome";

const Page = styled.main`
  display: grid;
  gap: var(--space-4);
  padding: var(--space-3) 0 var(--space-5);
`;

const StatusCopy = styled.p`
  margin: 0;
  color: var(--color-text-secondary);
  font-size: var(--font-size-base);
`;

export function SportsPage() {
  const {status} = useAuth();
  const apiClient = useApiClient();
  const isAuthenticated = status === "authenticated";
  const sportsQuery = useQuery({
    queryKey: ["user-sports-view"],
    enabled: isAuthenticated,
    retry: false,
    queryFn: () => readUserSportsView(apiClient),
  });

  let body = <StatusCopy>Loading your sports.</StatusCopy>;
  if (!isAuthenticated) {
    body = <StatusCopy>Sign in to see your teams.</StatusCopy>;
  } else if (sportsQuery.isError) {
    body = <StatusCopy>Sports is unavailable right now.</StatusCopy>;
  } else if (sportsQuery.data !== undefined) {
    body = <SportsBoard view={sportsQuery.data} />;
  }

  return (
    <>
      <Helmet>
        <title>Sports | Pack</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>
      <Page>
        <PageHeader
          title="Sports"
          subtitle="Your teams, scores, and fantasy matchups."
          discColor="var(--color-accent)">
          S
        </PageHeader>
        {body}
      </Page>
    </>
  );
}
