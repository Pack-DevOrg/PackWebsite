import React, { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Navigate, useLocation, useParams } from "react-router-dom";
import styled from "styled-components";
import { fetchPublicAirportSecuritySummary } from "@/api/airportSecurity";
import { useI18n } from "@/i18n/I18nProvider";
import { stripLocaleFromPath } from "@/i18n/config";
import NotFoundPage from "@/pages/NotFoundPage";
import PageSeo from "@/seo/pageSeo";
import type { AirportWaitTimePublicAirport } from "@/schemas/airport-security";
import { capturePosthog } from "@/tracking/posthog";
import {
  TSA_AIRPORT_H2S,
  airportFaq,
  airportPageDescription,
  airportPageH1,
  airportPageTitle,
  delaysTodaySentence,
  faaBannerSentence,
  faaKindForLake,
  readFaaStatus,
  readHeldFlights,
} from "@/pages/tsa/tsaAirportCopy";
import { resolveTsaAirportSlug } from "@/pages/tsa/tsaAirportIndex";

const Page = styled.article`
  display: grid;
  gap: var(--space-5);
  padding: var(--space-3);
`;

const Hero = styled.header`
  display: grid;
  gap: 0.8rem;
`;

const Title = styled.h1`
  margin: 0;
  max-width: 58rem;
  color: #fff7e7;
  font-size: clamp(2rem, 5vw, 3.4rem);
  line-height: 1.05;
`;

const Banner = styled.p`
  margin: 0;
  max-width: 50rem;
  color: #fff4cc;
  font-size: 1.05rem;
  line-height: 1.5;
`;

const Section = styled.section`
  display: grid;
  gap: 0.7rem;
`;

const SectionTitle = styled.h2`
  margin: 0;
  color: #fff7e7;
  font-size: 1.35rem;
`;

const Body = styled.p`
  margin: 0;
  max-width: 48rem;
  color: rgba(247, 240, 227, 0.78);
  line-height: 1.55;
`;

const CheckpointList = styled.ul`
  margin: 0;
  padding-left: 1.1rem;
  color: rgba(247, 240, 227, 0.84);
  display: grid;
  gap: 0.35rem;
`;

const FlightTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  color: rgba(247, 240, 227, 0.86);
  font-size: 0.95rem;

  th,
  td {
    text-align: left;
    padding: 0.45rem 0.55rem;
    border-bottom: 1px solid rgba(243, 210, 122, 0.14);
  }
`;

const SearchInput = styled.input`
  width: min(100%, 28rem);
  min-height: 2.7rem;
  border-radius: 999px;
  border: 1px solid rgba(243, 210, 122, 0.2);
  background: rgba(255, 248, 236, 0.06);
  color: #fff7e7;
  padding: 0.55rem 0.9rem;
`;

const FaqQuestion = styled.h3`
  margin: 0;
  color: #fff7e7;
  font-size: 1.02rem;
`;

const BoardLink = styled.a`
  color: #f3d27a;
`;

const TsaAirportPage: React.FC = () => {
  const { airportSlug = "" } = useParams();
  const location = useLocation();
  const { pathFor } = useI18n();
  const resolution = resolveTsaAirportSlug(airportSlug);
  const isClient = typeof window !== "undefined";
  const [flightQuery, setFlightQuery] = useState("");

  const { data, isFetched, isError } = useQuery({
    queryKey: ["public-airport-security-summary"],
    queryFn: fetchPublicAirportSecuritySummary,
    enabled: isClient && resolution.kind === "page",
    staleTime: 5 * 60 * 1000,
    refetchInterval: 5 * 60 * 1000,
  });

  const liveAirport: AirportWaitTimePublicAirport | undefined =
    resolution.kind === "page"
      ? data?.airports.find(
          (airport) =>
            airport.airportCode.toUpperCase() === resolution.airport.airportCode,
        )
      : undefined;

  const airportName =
    liveAirport?.airportName ??
    (resolution.kind === "page" ? resolution.airport.airportName : "");
  const iata =
    resolution.kind === "page" ? resolution.airport.airportCode.toUpperCase() : "";
  const status = readFaaStatus(liveAirport);
  const heldFlights = readHeldFlights(liveAirport);
  const observations = liveAirport?.snapshot?.observations ?? [];
  const faq = useMemo(
    () =>
      resolution.kind === "page"
        ? airportFaq({
            airportName,
            iata,
            hasLiveSnapshot: Boolean(liveAirport),
            status,
            observations,
          })
        : [],
    [airportName, iata, liveAirport, observations, resolution.kind, status],
  );
  const faaKind = liveAirport ? faaKindForLake(status) : "unknown";

  useEffect(() => {
    if (resolution.kind !== "page" || (!isFetched && !isError)) {
      return;
    }
    capturePosthog("tsa.airport-page.view", { iata, faaKind });
  }, [faaKind, iata, isError, isFetched, resolution.kind]);

  if (resolution.kind === "unknown") {
    return <NotFoundPage />;
  }

  const strippedPath = stripLocaleFromPath(location.pathname).replace(/\/$/, "") || "/";
  if (strippedPath !== resolution.canonicalPath) {
    return <Navigate to={pathFor(resolution.canonicalPath)} replace />;
  }

  const banner = liveAirport
    ? faaBannerSentence(iata, status)
    : `Checking the live FAA status for ${iata}.`;
  const visibleFlights = (heldFlights ?? []).filter((flight) => {
    const query = flightQuery.trim().toLowerCase();
    if (!query) {
      return true;
    }
    return `${flight.flight} ${flight.airline} ${flight.status}`.toLowerCase().includes(query);
  });

  return (
    <Page>
      <PageSeo
        title={airportPageTitle(airportName, iata)}
        description={airportPageDescription(airportName, iata)}
        path={resolution.canonicalPath}
        schema={[
          {
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: faq.map((item) => ({
              "@type": "Question",
              name: item.question,
              acceptedAnswer: {
                "@type": "Answer",
                text: item.answer,
              },
            })),
          },
        ]}
      />
      <Hero>
        <Title>{airportPageH1(airportName)}</Title>
        <Banner data-testid="faa-banner">{banner}</Banner>
        <BoardLink href={pathFor("/tsa")}>All airport TSA wait times</BoardLink>
      </Hero>
      <Section>
        <SectionTitle>{TSA_AIRPORT_H2S[0]}</SectionTitle>
        {observations.length > 0 ? (
          <CheckpointList>
            {observations.map((observation, index) => (
              <li key={`${observation.locationDisplayName}-${index}`}>
                {[observation.terminalDisplayName, observation.checkpointDisplayName ?? observation.locationDisplayName]
                  .filter(Boolean)
                  .join(" ")}
                {": "}
                {observation.displayWaitText
                  ?? (typeof observation.exactWaitMinutes === "number"
                    ? `${observation.exactWaitMinutes} min`
                    : "Unknown")}
              </li>
            ))}
          </CheckpointList>
        ) : (
          <Body>Checkpoint waits appear here when this airport publishes them.</Body>
        )}
      </Section>
      <Section>
        <SectionTitle>{TSA_AIRPORT_H2S[1]}</SectionTitle>
        <Body>{liveAirport ? delaysTodaySentence(airportName, iata, status) : banner}</Body>
      </Section>
      <Section>
        <SectionTitle>{TSA_AIRPORT_H2S[2]}</SectionTitle>
        <Body>{banner}</Body>
      </Section>
      <Section>
        <SectionTitle>{TSA_AIRPORT_H2S[3]}</SectionTitle>
        {heldFlights && heldFlights.length > 0 ? (
          <FlightTable>
            <thead>
              <tr>
                <th>Flight</th>
                <th>Airline</th>
                <th>Scheduled</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {heldFlights.map((flight) => (
                <tr key={`${flight.direction ?? "flight"}-${flight.flight}-${flight.scheduledTime}`}>
                  <td>{flight.flight}</td>
                  <td>{flight.airline}</td>
                  <td>{flight.scheduledTime}</td>
                  <td>{flight.status}</td>
                </tr>
              ))}
            </tbody>
          </FlightTable>
        ) : (
          <Body>No held departures or arrivals are listed for this airport right now.</Body>
        )}
      </Section>
      <Section>
        <SectionTitle>{TSA_AIRPORT_H2S[4]}</SectionTitle>
        <SearchInput
          aria-label="Search flight status"
          value={flightQuery}
          placeholder="Flight number"
          onChange={(event) => setFlightQuery(event.target.value)}
        />
        {visibleFlights.length > 0 ? (
          <Body>
            {visibleFlights.map((flight) => `${flight.flight} ${flight.status}`).join(". ")}
          </Body>
        ) : (
          <Body>No matching flight status is in the held-flight list for this airport.</Body>
        )}
      </Section>
      <Section aria-label="Airport status questions">
        {faq.map((item) => (
          <div key={item.question}>
            <FaqQuestion>{item.question}</FaqQuestion>
            <Body>{item.answer}</Body>
          </div>
        ))}
      </Section>
    </Page>
  );
};

export default TsaAirportPage;
