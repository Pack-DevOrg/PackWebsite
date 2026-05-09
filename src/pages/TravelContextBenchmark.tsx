import React from "react";
import styled from "styled-components";
import { GitBranch } from "lucide-react";
import {
  benchmarkOverview,
  latestVerifiedPackRun,
  phaseCards,
  scoreCards,
} from "@/data/travelContextBenchmark";
import PageSeo, { buildAbsoluteUrl } from "@/seo/pageSeo";

const Page = styled.main`
  width: min(100%, 1180px);
  margin: 0 auto;
  padding: var(--space-4) var(--space-3) var(--space-6);

  @media (min-width: 768px) {
    padding: var(--space-5) var(--space-4) var(--space-7);
  }
`;

const Header = styled.header`
  display: grid;
  gap: var(--space-4);
  margin-bottom: var(--space-5);
`;

const Kicker = styled.p`
  margin: 0;
  color: var(--color-accent);
  font-size: var(--font-size-small);
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
`;

const Title = styled.h1`
  max-width: 900px;
  margin: 0;
  color: var(--color-text-primary);
  font-size: clamp(2.25rem, 5vw, 4.5rem);
  line-height: 1.02;
`;

const Intro = styled.p`
  max-width: 840px;
  margin: 0;
  color: var(--color-text-secondary);
  font-size: var(--font-size-large);
  line-height: 1.7;
`;

const StatusBar = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
  align-items: center;
  border: 1px solid rgba(243, 210, 122, 0.18);
  border-radius: var(--border-radius);
  background: rgba(255, 248, 236, 0.045);
  padding: var(--space-3);
  color: var(--color-text-secondary);
  line-height: 1.6;

  strong {
    color: var(--color-text-primary);
  }
`;

const MetricGrid = styled.dl`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: var(--space-2);
  margin: 0;
`;

const Metric = styled.div`
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: var(--border-radius);
  background: rgba(255, 255, 255, 0.035);
  padding: var(--space-3);

  dt {
    margin: 0 0 0.35rem;
    color: var(--color-text-secondary);
    font-size: var(--font-size-small);
  }

  dd {
    margin: 0;
    color: var(--color-text-primary);
    font-size: var(--font-size-large);
    font-weight: 800;
  }
`;

const Section = styled.section`
  display: grid;
  gap: var(--space-3);
  margin-top: var(--space-5);
`;

const SectionTitle = styled.h2`
  margin: 0;
  color: var(--color-text-primary);
  font-size: var(--font-size-2xl);
`;

const SectionText = styled.p`
  max-width: 860px;
  margin: 0;
  color: var(--color-text-secondary);
  line-height: 1.7;
`;

const CardGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: var(--space-3);
`;

const Card = styled.article`
  display: grid;
  align-content: start;
  gap: var(--space-2);
  min-height: 210px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: var(--border-radius);
  background: rgba(255, 255, 255, 0.035);
  padding: var(--space-4);

  svg {
    width: 28px;
    height: 28px;
    color: var(--color-accent);
  }

  h3 {
    margin: 0;
    color: var(--color-text-primary);
    font-size: var(--font-size-large);
  }

  p {
    margin: 0;
    color: var(--color-text-secondary);
    line-height: 1.6;
  }
`;

const CardMetric = styled.span`
  color: var(--color-accent);
  font-size: var(--font-size-small);
  font-weight: 800;
  text-transform: uppercase;
`;

const ProtocolList = styled.ol`
  display: grid;
  gap: var(--space-2);
  margin: 0;
  padding-left: 1.25rem;
  color: var(--color-text-secondary);
  line-height: 1.7;
`;

const ResultPanel = styled.article`
  display: grid;
  gap: var(--space-3);
  border: 1px solid rgba(243, 210, 122, 0.16);
  border-radius: var(--border-radius);
  background: rgba(0, 0, 0, 0.26);
  padding: var(--space-4);
`;

const ResultHeader = styled.div`
  display: grid;
  gap: var(--space-1);

  h3 {
    margin: 0;
    color: var(--color-text-primary);
    font-size: var(--font-size-xl);
  }

  p {
    margin: 0;
    color: var(--color-text-secondary);
    line-height: 1.6;
  }
`;

const ResultGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: var(--space-2);
`;

const ResultItem = styled.div`
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  padding-top: var(--space-2);

  span {
    display: block;
    color: var(--color-text-secondary);
    font-size: var(--font-size-small);
  }

  strong {
    display: block;
    margin-top: 0.25rem;
    color: var(--color-text-primary);
    font-size: var(--font-size-large);
  }
`;

const CommandBlock = styled.pre`
  overflow-x: auto;
  margin: 0;
  border: 1px solid rgba(243, 210, 122, 0.12);
  border-radius: var(--border-radius);
  background: rgba(0, 0, 0, 0.32);
  color: var(--color-text-primary);
  padding: var(--space-4);
  font-size: var(--font-size-small);
  line-height: 1.7;
`;

const TextLink = styled.a`
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  width: fit-content;
  color: var(--color-accent);
  text-decoration: none;
  font-weight: 700;

  &:hover,
  &:focus-visible {
    text-decoration: underline;
  }

  svg {
    width: 18px;
    height: 18px;
  }
`;

const TravelContextBenchmark = () => (
  <Page>
    <PageSeo
      title="Travel Context Benchmark | Pack"
      description="Pack's runnable benchmark for evaluating travel agents on noisy household email, calendar context, public timing, flight search, hotel search, runtime, and cost."
      path="/benchmark/travel-context"
      schema={[
        {
          "@type": "Dataset",
          name: "Travel Context Benchmark",
          description:
            "Synthetic benchmark for evidence-grounded travel agents over household email, calendar, public events, and deterministic travel inventory.",
          url: buildAbsoluteUrl("/benchmark/travel-context"),
          license: "https://www.apache.org/licenses/LICENSE-2.0",
          creator: {
            "@type": "Organization",
            name: "Pack",
          },
        },
      ]}
    />

    <Header>
      <Kicker>Benchmark {benchmarkOverview.version}</Kicker>
      <Title>Travel agents should survive the inbox before they book the trip.</Title>
      <Intro>
        Travel Context Benchmark measures the complete workflow: extracting a
        household travel history from realistic email and calendar data,
        planning from a short human prompt, and selecting flights and hotels
        from large deterministic inventories.
      </Intro>
      <StatusBar>
        <strong>{benchmarkOverview.officialRunStatus}.</strong>
        The current published page is wired for final Pack and external-provider
        runs, but only verified smoke results are shown until the full 100-case
        run completes.
      </StatusBar>
      <MetricGrid>
        <Metric>
          <dt>Household</dt>
          <dd>{benchmarkOverview.corpus.people} people</dd>
        </Metric>
        <Metric>
          <dt>Inbox</dt>
          <dd>{benchmarkOverview.corpus.totalEmails}</dd>
        </Metric>
        <Metric>
          <dt>Travel items</dt>
          <dd>{benchmarkOverview.corpus.travelEmails}</dd>
        </Metric>
        <Metric>
          <dt>Search inventory</dt>
          <dd>1M + 1M</dd>
        </Metric>
      </MetricGrid>
    </Header>

    <Section>
      <SectionTitle>Benchmark Phases</SectionTitle>
      <SectionText>
        Each phase is scored separately and then rolled into an end-to-end case
        score. Pack runs through its native code path; external systems run
        against the same tool protocol and result schemas.
      </SectionText>
      <CardGrid>
        {phaseCards.map((card) => {
          const Icon = card.icon;
          return (
            <Card key={card.title}>
              <Icon aria-hidden="true" />
              <CardMetric>{card.metric}</CardMetric>
              <h3>{card.title}</h3>
              <p>{card.body}</p>
            </Card>
          );
        })}
      </CardGrid>
    </Section>

    <Section>
      <SectionTitle>Official Protocol</SectionTitle>
      <ProtocolList>
        {benchmarkOverview.protocol.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ProtocolList>
    </Section>

    <Section>
      <SectionTitle>Scoring</SectionTitle>
      <CardGrid>
        {scoreCards.map((card) => {
          const Icon = card.icon;
          return (
            <Card key={card.label}>
              <Icon aria-hidden="true" />
              <h3>{card.label}</h3>
              <p>{card.body}</p>
            </Card>
          );
        })}
      </CardGrid>
    </Section>

    <Section>
      <SectionTitle>Latest Verified Pack Run</SectionTitle>
      <ResultPanel>
        <ResultHeader>
          <h3>{latestVerifiedPackRun.label}</h3>
          <p>{latestVerifiedPackRun.prompt}</p>
        </ResultHeader>
        <ResultGrid>
          <ResultItem>
            <span>Cases</span>
            <strong>{latestVerifiedPackRun.caseCount}</strong>
          </ResultItem>
          <ResultItem>
            <span>Extractor profiles</span>
            <strong>{latestVerifiedPackRun.extractionProfiles}</strong>
          </ResultItem>
          <ResultItem>
            <span>Historical trips</span>
            <strong>{latestVerifiedPackRun.historicalTrips}</strong>
          </ResultItem>
          <ResultItem>
            <span>Flight scan</span>
            <strong>{latestVerifiedPackRun.scannedFlights}</strong>
          </ResultItem>
          <ResultItem>
            <span>Hotel scan</span>
            <strong>{latestVerifiedPackRun.scannedHotels}</strong>
          </ResultItem>
          <ResultItem>
            <span>Total cost</span>
            <strong>{latestVerifiedPackRun.costs.total}</strong>
          </ResultItem>
          <ResultItem>
            <span>Planning accuracy</span>
            <strong>{latestVerifiedPackRun.scores.planningAccuracy}</strong>
          </ResultItem>
          <ResultItem>
            <span>User value</span>
            <strong>{latestVerifiedPackRun.scores.userValue}</strong>
          </ResultItem>
        </ResultGrid>
      </ResultPanel>
    </Section>

    <Section>
      <SectionTitle>Run Path</SectionTitle>
      <CommandBlock>{`cd PackServer
npm run bench:travel-context:pack-extractor-hartwell -- --email-task-concurrency 2 --out-dir tmp/hartwell-pack-real-extractor-full
npm run bench:travel-context:pack-phased-hartwell -- --extraction-dir tmp/hartwell-pack-real-extractor-full --limit 100 --flight-count 1000000 --hotel-count 1000000`}</CommandBlock>
      <TextLink href="https://github.com/Pack-DevOrg" rel="noopener noreferrer" target="_blank">
        <GitBranch aria-hidden="true" />
        Release repository coming next
      </TextLink>
    </Section>
  </Page>
);

export default TravelContextBenchmark;
