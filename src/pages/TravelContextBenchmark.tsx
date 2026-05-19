import styled from "styled-components";
import {
  benchmarkOverview,
  hard100Cases,
  hardestTenShootoutRows,
  latestVerifiedPackRun,
  neurosymbolicComparison,
  phaseCards,
  rubricCategories,
  scoreCards,
  shootoutChartRows,
  shootoutRubricRows,
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

const FullCaseList = styled.div`
  display: grid;
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

const TableWrap = styled.div`
  overflow: auto;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: var(--border-radius);
  background: rgba(0, 0, 0, 0.18);
`;

const ShootoutTable = styled.table`
  width: 100%;
  min-width: 920px;
  border-collapse: collapse;

  th,
  td {
    border-bottom: 1px solid rgba(255, 255, 255, 0.08);
    padding: 0.85rem;
    text-align: left;
    vertical-align: top;
  }

  th {
    color: var(--color-text-primary);
    font-size: var(--font-size-small);
    text-transform: uppercase;
  }

  td {
    color: var(--color-text-secondary);
    line-height: 1.45;
  }

  tr:last-child td {
    border-bottom: 0;
  }
`;

const ScoreValue = styled.strong<{ $status?: "pass" | "fail" | "unscored" }>`
  display: block;
  color: ${({ $status }) =>
    $status === "pass"
      ? "rgb(111, 220, 166)"
      : $status === "fail"
        ? "rgb(255, 132, 132)"
        : $status === "unscored"
          ? "rgb(255, 211, 121)"
        : "var(--color-text-primary)"};
  font-size: var(--font-size-large);
`;

const CostNote = styled.span`
  display: block;
  margin-top: 0.2rem;
  color: var(--color-text-secondary);
  font-size: var(--font-size-small);
`;

const ChartGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: var(--space-3);
`;

const ChartBlock = styled.div`
  display: grid;
  gap: var(--space-2);
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  padding-top: var(--space-3);

  h4 {
    margin: 0;
    color: var(--color-text-primary);
    font-size: var(--font-size-large);
  }
`;

const BarList = styled.div`
  display: grid;
  gap: var(--space-2);
`;

const BarRow = styled.div`
  display: grid;
  grid-template-columns: minmax(7.25rem, 0.7fr) minmax(7rem, 1fr) 4.75rem;
  gap: var(--space-2);
  align-items: center;

  @media (max-width: 520px) {
    grid-template-columns: 1fr;
    gap: 0.35rem;
  }
`;

const BarLabel = styled.span`
  color: var(--color-text-primary);
  font-size: var(--font-size-small);
  font-weight: 800;
`;

const BarValue = styled.span`
  color: var(--color-text-secondary);
  font-size: var(--font-size-small);
  font-weight: 700;
  text-align: right;

  @media (max-width: 520px) {
    text-align: left;
  }
`;

const BarTrack = styled.span`
  display: block;
  height: 0.8rem;
  overflow: hidden;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.08);
`;

const BarFill = styled.span<{ $percent: number; $tone: "pack" | "raw" }>`
  display: block;
  width: ${({ $percent }) => `${Math.max(0, Math.min(100, $percent))}%`};
  height: 100%;
  border-radius: inherit;
  background: ${({ $tone }) =>
    $tone === "pack"
      ? "linear-gradient(90deg, rgb(111, 220, 166), rgb(243, 210, 122))"
      : "rgba(255, 132, 132, 0.8)"};
`;

const RubricGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: var(--space-3);
`;

const RubricCard = styled.article`
  display: grid;
  gap: var(--space-2);
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  padding-top: var(--space-3);
`;

const RubricHeader = styled.div`
  display: flex;
  justify-content: space-between;
  gap: var(--space-2);
  align-items: baseline;

  h4 {
    margin: 0;
    color: var(--color-text-primary);
    font-size: var(--font-size-large);
  }

  strong {
    color: var(--color-accent);
  }
`;

const RubricCategoryList = styled.div`
  display: grid;
  gap: 0.75rem;
`;

const RubricCategory = styled.div`
  display: grid;
  gap: 0.35rem;
`;

const RubricCategoryHeader = styled.div`
  display: flex;
  justify-content: space-between;
  gap: var(--space-2);
  color: var(--color-text-secondary);
  font-size: var(--font-size-small);

  strong {
    color: var(--color-text-primary);
  }
`;

const RubricDescription = styled.span`
  color: var(--color-text-secondary);
  font-size: var(--font-size-small);
  line-height: 1.45;
`;

const maxShootoutCost = Math.max(...shootoutChartRows.map((row) => row.costUsd));
const maxShootoutRuntime = Math.max(...shootoutChartRows.map((row) => row.runtimeMinutes));

const metricChartGroups = [
  {
    title: "Cases solved",
    helper: "Final content passes on the selected hard cases.",
    rows: shootoutChartRows.map((row) => ({
      system: row.system,
      label: row.solvedLabel,
      percent: (row.solved / row.attempted) * 100,
      tone: row.tone,
    })),
  },
  {
    title: "Total spend",
    helper:
      "Pack shows measured metered spend; raw agents show fresh no-cache estimated spend.",
    rows: shootoutChartRows.map((row) => ({
      system: row.system,
      label: row.costLabel,
      percent: (row.costUsd / maxShootoutCost) * 100,
      tone: row.tone,
    })),
  },
  {
    title: "Runtime",
    helper: "Observed runtime across all ten selected cases.",
    rows: shootoutChartRows.map((row) => ({
      system: row.system,
      label: row.runtimeLabel,
      percent: (row.runtimeMinutes / maxShootoutRuntime) * 100,
      tone: row.tone,
    })),
  },
];

const statusForScore = (score: string): "pass" | "fail" | "unscored" => {
  if (score === "Not run" || score === "Unscored") {
    return "unscored";
  }

  if (score === "1.00" || score.includes("1.00")) {
    return "pass";
  }

  return "fail";
};

const TravelContextBenchmark = () => (
  <Page>
    <PageSeo
      title="Pack DeeperBench | Travel Agent Benchmark"
      description="Pack DeeperBench is a synthetic benchmark for travel agents over private email, calendar context, flight search, hotel search, runtime, and model cost."
      path="/pack-deeperbench"
      schema={[
        {
          "@type": "Dataset",
          name: "Pack DeeperBench",
          description:
            "Synthetic benchmark for evidence-grounded travel agents over household email, calendar, public events, and deterministic travel inventory.",
          url: buildAbsoluteUrl("/pack-deeperbench"),
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
      <Title>Pack DeeperBench</Title>
      <Intro>
        Evaluation results for travel-planning systems on synthetic private
        email, calendar, flight-search, and hotel-search tasks.
      </Intro>
      <StatusBar>
        <strong>Hardest-10 comparison.</strong>
        Pack exact rerun: 0/10 final content pass for $2.76 fresh-estimated
        spend in 5m31s planning + search. GPT-5.5 xhigh: 2/10 for $86.60
        fresh-run estimated spend. Opus 4.7: 2/10 manual content pass,
        0/10 schema-valid, for $17.15.
      </StatusBar>
      <MetricGrid>
        <Metric>
          <dt>Hard-100 Pack run</dt>
          <dd>{latestVerifiedPackRun.hard100Composite}</dd>
        </Metric>
        <Metric>
          <dt>Pack exact rerun</dt>
          <dd>{neurosymbolicComparison.packCorpusResult}</dd>
        </Metric>
        <Metric>
          <dt>Pack exact rerun cost</dt>
          <dd>{neurosymbolicComparison.packCorpusCost}</dd>
        </Metric>
        <Metric>
          <dt>Raw content pass</dt>
          <dd>GPT 2/10; Opus 2/10</dd>
        </Metric>
        <Metric>
          <dt>Raw schema-valid</dt>
          <dd>GPT 9/10; Opus 0/10</dd>
        </Metric>
      </MetricGrid>
    </Header>

    <Section>
      <SectionTitle>{neurosymbolicComparison.label}</SectionTitle>
      <ResultPanel>
        <ResultHeader>
          <h3>{neurosymbolicComparison.headline}</h3>
          <p>{neurosymbolicComparison.summary}</p>
        </ResultHeader>
        <ChartGrid aria-label="Comparison metric charts">
          {metricChartGroups.map((group) => (
            <ChartBlock key={group.title}>
              <h4>{group.title}</h4>
              <FindingText>{group.helper}</FindingText>
              <BarList>
                {group.rows.map((row) => (
                  <BarRow key={`${group.title}-${row.system}`}>
                    <BarLabel>{row.system}</BarLabel>
                    <BarTrack aria-hidden="true">
                      <BarFill $percent={row.percent} $tone={row.tone} />
                    </BarTrack>
                    <BarValue>{row.label}</BarValue>
                  </BarRow>
                ))}
              </BarList>
            </ChartBlock>
          ))}
        </ChartGrid>
        <RubricGrid aria-label="Shared rubric category scores">
          {shootoutRubricRows.map((row) => (
            <RubricCard key={row.system}>
              <RubricHeader>
                <h4>{row.system}</h4>
                <strong>{row.finalPass}/{row.denominator} pass</strong>
              </RubricHeader>
              <RubricCategoryList>
                {rubricCategories.map((category) => {
                  const value = row[category.key];
                  const denominator = row.denominator;
                  return (
                    <RubricCategory key={`${row.system}-${category.key}`}>
                      <RubricCategoryHeader>
                        <strong>{category.label}</strong>
                        <span>{value}/{denominator}</span>
                      </RubricCategoryHeader>
                      <BarTrack aria-hidden="true">
                        <BarFill $percent={(value / denominator) * 100} $tone={row.tone} />
                      </BarTrack>
                      <RubricDescription>{category.description}</RubricDescription>
                    </RubricCategory>
                  );
                })}
              </RubricCategoryList>
              <FindingText>{row.note}</FindingText>
            </RubricCard>
          ))}
        </RubricGrid>
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
        <FindingText>{neurosymbolicComparison.estimateNote}</FindingText>
        <FindingText>
          Scores judge plan content, not only schemas. The first gate asks
          whether the answer is readable enough to score. Schema validity is
          still reported separately because production agents need reliable
          machine-readable output.
        </FindingText>
      </ResultPanel>
    </Section>

    <Section>
      <SectionTitle>Hardest-10 Case Results</SectionTitle>
      <SectionText>
        Each row is one selected hard case. A final score of 1.00 means the
        case passed all content gates. Opus rows use manual content scores
        because every Opus answer was readable but off-schema. Pack rows use
        the May 19 exact-case rerun, not the earlier stale per-case values.
      </SectionText>
      <TableWrap>
        <ShootoutTable>
          <thead>
            <tr>
              <th>Case</th>
              <th>Pack</th>
              <th>GPT-5.5 xhigh</th>
              <th>Claude Opus 4.7 max-thinking</th>
            </tr>
          </thead>
          <tbody>
            {hardestTenShootoutRows.map((row) => (
              <tr key={row.number}>
                <td>
                  <strong>{row.number}. {row.title}</strong>
                </td>
                <td>
                  <ScoreValue $status={statusForScore(row.packScore)}>{row.packScore}</ScoreValue>
                  <CostNote>Planner cost: {row.packCost}</CostNote>
                  <CostNote>Runtime: {row.packRuntime}</CostNote>
                  <CostNote>{row.packResult}</CostNote>
                </td>
                <td>
                  <ScoreValue $status={statusForScore(row.gptScore)}>{row.gptScore}</ScoreValue>
                  <CostNote>Cost: {row.gptCost}</CostNote>
                  <CostNote>Runtime: {row.gptRuntime}</CostNote>
                  <CostNote>{row.gptResult}</CostNote>
                </td>
                <td>
                  <ScoreValue $status={statusForScore(row.opusScore)}>{row.opusScore}</ScoreValue>
                  <CostNote>Cost: {row.opusCost}</CostNote>
                  <CostNote>Runtime: {row.opusRuntime}</CostNote>
                  <CostNote>{row.opusResult}</CostNote>
                </td>
              </tr>
            ))}
          </tbody>
        </ShootoutTable>
      </TableWrap>
    </Section>

    <Section>
      <SectionTitle>What The Test Includes</SectionTitle>
      <SectionText>
        The benchmark combines private inbox context, calendar context, and
        deterministic flight and hotel inventory.
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
      <SectionTitle>Rules</SectionTitle>
      <ProtocolList>
        {benchmarkOverview.protocol.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ProtocolList>
    </Section>

    <Section>
      <SectionTitle>How A Case Passes</SectionTitle>
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
      <SectionTitle>Full Pack Run</SectionTitle>
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
            <span>Hard-100 runtime</span>
            <strong>{latestVerifiedPackRun.hard100Runtime}</strong>
          </ResultItem>
          <ResultItem>
            <span>Average hard-100 runtime</span>
            <strong>{latestVerifiedPackRun.averageHard100Runtime}</strong>
          </ResultItem>
          <ResultItem>
            <span>Raw comparison set</span>
            <strong>{latestVerifiedPackRun.selectedComparisonSet}</strong>
          </ResultItem>
          <ResultItem>
            <span>Hardest-10 Pack runtime</span>
            <strong>{latestVerifiedPackRun.selectedComparisonRuntime}</strong>
          </ResultItem>
          <ResultItem>
            <span>Comparison set</span>
            <strong>{latestVerifiedPackRun.selectedComparisonScope}</strong>
          </ResultItem>
        </ResultGrid>
      </ResultPanel>
    </Section>

    <Section>
      <SectionTitle>Hard-100 Case Browser</SectionTitle>
      <SectionText>
        The ten-case comparison is drawn from this full set of 100 hard travel
        requests.
      </SectionText>
      <FullCaseList>
        {hard100Cases.map((caseItem) => (
          <FullCaseRow key={caseItem.number}>
            <span>{caseItem.number}</span>
            <div>
              <strong>{caseItem.title}</strong>
            </div>
          </FullCaseRow>
        ))}
      </FullCaseList>
    </Section>
  </Page>
);

export default TravelContextBenchmark;
