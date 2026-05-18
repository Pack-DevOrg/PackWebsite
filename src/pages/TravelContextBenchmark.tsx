import React from "react";
import styled from "styled-components";
import {
  benchmarkOverview,
  hard100Cases,
  hardestTenCases,
  latestVerifiedPackRun,
  neurosymbolicComparison,
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

const CaseGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: var(--space-3);
`;

const CaseCard = styled.article`
  display: grid;
  align-content: start;
  gap: var(--space-2);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: var(--border-radius);
  background: rgba(255, 255, 255, 0.035);
  padding: var(--space-3);

  strong {
    color: var(--color-text-primary);
    font-size: var(--font-size-large);
  }

  span {
    width: fit-content;
    border-radius: 999px;
    background: rgba(243, 210, 122, 0.1);
    color: var(--color-accent);
    padding: 0.2rem 0.55rem;
    font-size: var(--font-size-small);
    font-weight: 800;
  }

  p {
    margin: 0;
    color: var(--color-text-secondary);
    line-height: 1.55;
  }
`;

const FullCaseList = styled.div`
  display: grid;
  max-height: 520px;
  overflow: auto;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: var(--border-radius);
  background: rgba(0, 0, 0, 0.18);
`;

const FullCaseRow = styled.article`
  display: grid;
  grid-template-columns: 4rem minmax(0, 1fr);
  gap: var(--space-2);
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  padding: var(--space-3);

  &:last-child {
    border-bottom: 0;
  }

  span {
    color: var(--color-accent);
    font-weight: 800;
  }

  strong {
    display: block;
    color: var(--color-text-primary);
  }

  p {
    margin: 0.35rem 0 0;
    color: var(--color-text-secondary);
    line-height: 1.55;
  }
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

const FindingText = styled.p`
  margin: 0;
  color: var(--color-text-secondary);
  line-height: 1.7;

  strong {
    color: var(--color-text-primary);
  }
`;

const ComparisonGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(230px, 1fr));
  gap: var(--space-3);
`;

const ComparisonCard = styled.article`
  display: grid;
  align-content: start;
  gap: var(--space-2);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: var(--border-radius);
  background: rgba(255, 255, 255, 0.035);
  padding: var(--space-3);

  h4 {
    margin: 0;
    color: var(--color-text-primary);
    font-size: var(--font-size-large);
  }

  p {
    margin: 0;
    color: var(--color-text-secondary);
    line-height: 1.55;
  }
`;

const ComparisonBadge = styled.span<{ $outcome: string }>`
  width: fit-content;
  border: 1px solid
    ${({ $outcome }) =>
      $outcome === "Pass"
        ? "rgba(111, 220, 166, 0.34)"
        : $outcome === "Fail"
          ? "rgba(255, 132, 132, 0.34)"
          : "rgba(243, 210, 122, 0.3)"};
  border-radius: 999px;
  background: ${({ $outcome }) =>
    $outcome === "Pass"
      ? "rgba(111, 220, 166, 0.12)"
      : $outcome === "Fail"
        ? "rgba(255, 132, 132, 0.12)"
        : "rgba(243, 210, 122, 0.1)"};
  color: var(--color-text-primary);
  padding: 0.25rem 0.6rem;
  font-size: var(--font-size-small);
  font-weight: 800;
`;

const ComparisonCost = styled.strong`
  color: var(--color-text-primary);
  font-size: var(--font-size-2xl);
  line-height: 1;
`;

const ComparisonMeta = styled.div`
  display: grid;
  gap: 0.3rem;
  color: var(--color-text-secondary);
  font-size: var(--font-size-small);
`;

const TravelContextBenchmark = () => (
  <Page>
    <PageSeo
      title="Pack DeeperBench | Pack"
      description="Pack's runnable benchmark for evaluating travel agents on noisy household email, calendar context, public timing, flight search, hotel search, runtime, and cost."
      path="/benchmark/travel-context"
      schema={[
        {
          "@type": "Dataset",
          name: "Pack DeeperBench",
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
      <Title>{benchmarkOverview.name}: travel agents should survive the inbox before they book the trip.</Title>
      <Intro>
        Pack DeeperBench measures the complete workflow: extracting a
        household travel history from realistic email and calendar data,
        planning from a short human prompt, and selecting flights and hotels
        from large deterministic inventories.
      </Intro>
      <StatusBar>
        <strong>{benchmarkOverview.officialRunStatus}.</strong>
        Pack passes the representative Japan case for $0.047; the measured raw
        GPT-5.5 agent costs $0.91 and fails the same evidence-grounded case.
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
          <p>{latestVerifiedPackRun.summary}</p>
        </ResultHeader>
        <ResultGrid>
          <ResultItem>
            <span>Hard-100 evidence set</span>
            <strong>{latestVerifiedPackRun.hard100Composite}</strong>
          </ResultItem>
          <ResultItem>
            <span>Hard-100 total cost</span>
            <strong>{latestVerifiedPackRun.hard100TotalCost}</strong>
          </ResultItem>
          <ResultItem>
            <span>Average hard-100 case cost</span>
            <strong>{latestVerifiedPackRun.averageHard100Cost}</strong>
          </ResultItem>
          <ResultItem>
            <span>Raw comparison set</span>
            <strong>{latestVerifiedPackRun.selectedComparisonSet}</strong>
          </ResultItem>
          <ResultItem>
            <span>Planned raw-model run</span>
            <strong>{latestVerifiedPackRun.selectedComparisonScope}</strong>
          </ResultItem>
        </ResultGrid>
      </ResultPanel>
    </Section>

    <Section>
      <SectionTitle>{neurosymbolicComparison.label}</SectionTitle>
      <ResultPanel>
        <ResultHeader>
          <h3>{neurosymbolicComparison.headline}</h3>
          <p>{neurosymbolicComparison.summary}</p>
        </ResultHeader>
        <MetricGrid>
          <Metric>
            <dt>Demo case</dt>
            <dd>{neurosymbolicComparison.measuredCase}</dd>
          </Metric>
          <Metric>
            <dt>Pack corpus evidence</dt>
            <dd>{neurosymbolicComparison.packCorpusResult}</dd>
          </Metric>
          <Metric>
            <dt>Pack hard-100 cost</dt>
            <dd>{neurosymbolicComparison.packCorpusCost}</dd>
          </Metric>
        </MetricGrid>
        <ComparisonGrid>
          {neurosymbolicComparison.rows.map((row) => (
            <ComparisonCard key={row.system}>
              <ComparisonBadge $outcome={row.outcome}>{row.outcome}</ComparisonBadge>
              <h4>{row.system}</h4>
              <ComparisonCost>{row.cost}</ComparisonCost>
              <ComparisonMeta>
                <span>{row.costMultiple} Pack cost</span>
                <span>{row.runtime}</span>
                <span>{row.calls}</span>
              </ComparisonMeta>
              <p>{row.note}</p>
            </ComparisonCard>
          ))}
        </ComparisonGrid>
        <FindingText>
          {neurosymbolicComparison.estimateNote}
        </FindingText>
      </ResultPanel>
    </Section>

    <Section>
      <SectionTitle>Hardest 10 Selected for Raw Runs</SectionTitle>
      <SectionText>
        These are the cases we should run first because they combine private
        inbox discovery, calendar constraints, stale or wrong-owner evidence,
        partial itinerary edits, and cases where the correct answer can be no.
      </SectionText>
      <CaseGrid>
        {hardestTenCases.map((caseItem) => (
          <CaseCard key={caseItem.number}>
            <span>{caseItem.number}</span>
            <strong>{caseItem.title}</strong>
            <p>{caseItem.summary}</p>
            <p>{caseItem.hardestTenReason}</p>
          </CaseCard>
        ))}
      </CaseGrid>
    </Section>

    <Section>
      <SectionTitle>Hard-100 Case Browser</SectionTitle>
      <SectionText>
        The full hard-100 set is shown here for transparency. The chosen 10 are
        a deliberately adversarial subset, not the only hard cases.
      </SectionText>
      <FullCaseList>
        {hard100Cases.map((caseItem) => (
          <FullCaseRow key={caseItem.number}>
            <span>{caseItem.number}</span>
            <div>
              <strong>{caseItem.title}</strong>
              <p>{caseItem.challenge}</p>
              <p>{caseItem.summary}</p>
            </div>
          </FullCaseRow>
        ))}
      </FullCaseList>
    </Section>
  </Page>
);

export default TravelContextBenchmark;
