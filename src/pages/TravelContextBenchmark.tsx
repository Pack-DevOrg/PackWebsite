import styled from "styled-components";
import {
  benchmarkMetricExplanations,
  benchmarkOverview,
  hard100Cases,
  hardestTenShootoutRows,
  latestVerifiedPackRun,
  methodologyNotes,
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

const ScoreCardGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: var(--space-3);

  @media (max-width: 1020px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  @media (max-width: 620px) {
    grid-template-columns: 1fr;
  }
`;

const ScoreCard = styled(Card)<{ $featured?: boolean }>`
  ${({ $featured }) =>
    $featured
      ? `
        grid-column: 1 / -1;
        justify-items: center;
        align-content: center;
        min-height: 270px;
        padding: var(--space-5);
        text-align: center;

        svg {
          width: 44px;
          height: 44px;
        }

        h3 {
          font-size: var(--font-size-2xl);
        }

        p {
          max-width: 760px;
          font-size: var(--font-size-large);
        }
      `
      : ""}
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
    overflow-wrap: anywhere;
  }

  p {
    margin: 0.5rem 0 0;
    color: var(--color-text-secondary);
    font-size: var(--font-size-small);
    line-height: 1.5;
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
  grid-template-columns: repeat(3, minmax(0, 1fr));
  grid-template-rows: repeat(5, auto);
  gap: var(--space-3);
  align-items: stretch;

  @media (max-width: 980px) {
    grid-template-columns: repeat(auto-fit, minmax(270px, 1fr));
  }

  @media (max-width: 360px) {
    grid-template-columns: 1fr;
  }
`;

const ComparisonCard = styled.article`
  display: grid;
  grid-row: span 5;
  grid-template-rows: subgrid;
  gap: var(--space-2);
  min-width: 0;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: var(--border-radius);
  background: rgba(255, 255, 255, 0.035);
  padding: var(--space-3);

  @supports not (grid-template-rows: subgrid) {
    grid-template-rows: auto auto auto minmax(0, 1fr) auto;
  }

  h4 {
    margin: 0;
    color: var(--color-text-primary);
    font-size: var(--font-size-large);
    line-height: 1.25;
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
  display: flex;
  align-items: end;
  min-height: 2.25rem;
  color: var(--color-text-primary);
  font-size: var(--font-size-2xl);
  line-height: 1;
`;

const ComparisonMeta = styled.div`
  display: grid;
  align-content: start;
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
  min-width: 1080px;
  border-collapse: collapse;
  table-layout: fixed;

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
    height: 1px;
    color: var(--color-text-secondary);
    line-height: 1.45;
  }

  th:first-child,
  td:first-child {
    width: 28%;
  }

  th:not(:first-child),
  td:not(:first-child) {
    width: 24%;
  }

  tr:last-child td {
    border-bottom: 0;
  }
`;

const ScoreValue = styled.strong<{ $status?: "pass" | "partial" | "fail" | "unscored" }>`
  display: flex;
  align-items: baseline;
  min-height: 2rem;
  color: ${({ $status }) =>
    $status === "pass"
      ? "rgb(111, 220, 166)"
      : $status === "partial"
        ? "rgb(255, 211, 121)"
        : $status === "fail"
          ? "rgb(255, 132, 132)"
          : $status === "unscored"
            ? "rgb(255, 211, 121)"
            : "var(--color-text-primary)"};
  font-size: var(--font-size-large);
  line-height: 1.15;
`;

const CaseHardReason = styled.span`
  display: block;
  max-width: 18rem;
  margin-top: 0.45rem;
  color: var(--color-text-secondary);
  font-size: var(--font-size-small);
  line-height: 1.45;
`;

const ComponentList = styled.ul`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.3rem;
  margin: 0;
  padding: 0;
  list-style: none;
`;

const ComponentChip = styled.li<{ $status: "pass" | "partial" | "fail" }>`
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 1.35rem;
  border: 1px solid
    ${({ $status }) =>
      $status === "pass"
        ? "rgba(111, 220, 166, 0.3)"
        : $status === "partial"
          ? "rgba(255, 211, 121, 0.28)"
          : "rgba(255, 132, 132, 0.24)"};
  border-radius: 999px;
  background: ${({ $status }) =>
    $status === "pass"
      ? "rgba(111, 220, 166, 0.1)"
      : $status === "partial"
        ? "rgba(255, 211, 121, 0.1)"
        : "rgba(255, 132, 132, 0.08)"};
  color: ${({ $status }) =>
    $status === "pass"
      ? "rgb(111, 220, 166)"
      : $status === "partial"
        ? "rgb(255, 211, 121)"
        : "rgb(255, 132, 132)"};
  padding: 0.1rem 0.42rem;
  font-size: 0.68rem;
  font-weight: 800;
  line-height: 1.4;
  text-align: center;
  white-space: nowrap;
`;

const ModelResultCell = styled.div`
  display: grid;
  grid-template-rows: 2rem 1.25rem 1.25rem 4.65rem minmax(4.25rem, auto);
  align-content: start;
  gap: 0.35rem;
  min-width: 0;
  min-height: 100%;
`;

const ModelMetric = styled.span`
  display: block;
  min-width: 0;
  color: var(--color-text-secondary);
  font-size: var(--font-size-small);
  line-height: 1.35;
`;

const ComponentBreakdownSlot = styled.div`
  display: grid;
  align-content: start;
  min-width: 0;
`;

const ModelResultText = styled.p`
  margin: 0;
  color: var(--color-text-secondary);
  font-size: var(--font-size-small);
  line-height: 1.45;
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
  grid-template-columns: minmax(7.25rem, 1fr) auto;
  gap: 0.45rem var(--space-2);
  align-items: end;

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
  overflow-wrap: anywhere;

  @media (max-width: 520px) {
    text-align: left;
  }
`;

const BarTrack = styled.span`
  display: block;
  grid-column: 1 / -1;
  height: 0.8rem;
  overflow: hidden;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.08);
`;

const BarFill = styled.span<{ $percent: number; $tone: "pack" | "model" }>`
  display: block;
  width: ${({ $percent }) => `${Math.max(0, Math.min(100, $percent))}%`};
  height: 100%;
  border-radius: inherit;
  background: ${({ $tone }) =>
    $tone === "pack"
      ? "linear-gradient(90deg, rgb(111, 220, 166), rgb(243, 210, 122))"
      : "rgba(255, 132, 132, 0.8)"};
`;

const RubricHeader = styled.div`
  display: grid;
  gap: 0.65rem;
  align-items: start;
  justify-items: start;

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
const packShootoutRow = shootoutChartRows.find((row) => row.system === "Pack");

if (!packShootoutRow) {
  throw new Error("Missing Pack shootout chart row");
}

const formatPackRelativeScale = (value: number, baseline: number): string => {
  const multiple = value / baseline;
  return multiple === 1 ? "1x Pack" : `${multiple.toFixed(1)}x Pack`;
};

const metricChartGroups = [
  {
    title: "Cases solved",
    helper: "Final content passes within the selected ten-case hard set.",
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
      "Full model and tool cost for each ten-case hard-set run, with Pack-relative scale.",
    rows: shootoutChartRows.map((row) => ({
      system: row.system,
      label: `${row.costLabel} (${formatPackRelativeScale(row.costUsd, packShootoutRow.costUsd)})`,
      percent: (row.costUsd / maxShootoutCost) * 100,
      tone: row.tone,
    })),
  },
  {
    title: "Runtime",
    helper:
      "Observed wait time for each ten-case hard-set evaluation, with Pack-relative scale.",
    rows: shootoutChartRows.map((row) => ({
      system: row.system,
      label: `${row.runtimeLabel} (${formatPackRelativeScale(row.runtimeMinutes, packShootoutRow.runtimeMinutes)})`,
      percent: (row.runtimeMinutes / maxShootoutRuntime) * 100,
      tone: row.tone,
    })),
  },
];

const hardSetSystemRows = neurosymbolicComparison.rows.map((comparisonRow) => {
  const rubricRow = shootoutRubricRows.find(
    (row) => row.system === comparisonRow.rubricSystem,
  );
  if (!rubricRow) {
    throw new Error(`Missing hard-set rubric row for ${comparisonRow.system}`);
  }

  return {
    comparisonRow,
    rubricRow,
  };
});

const statusForScore = (score: string): "pass" | "partial" | "fail" | "unscored" => {
  if (score === "Not run" || score === "Unscored") {
    return "unscored";
  }

  const numericScore = Number(score);
  if (Number.isFinite(numericScore)) {
    if (numericScore >= 1) {
      return "pass";
    }

    return numericScore > 0 ? "partial" : "fail";
  }

  return "fail";
};

const componentLabels = [
  ["output", "Output 3%"],
  ["evidence", "Evidence 7%"],
  ["constraints", "Details 30%"],
  ["search", "Search 10%"],
  ["final", "Final 50%"],
] as const;

type RubricComponents = (typeof hardestTenShootoutRows)[number]["packComponents"];

const componentScoreValues: Record<RubricComponents[keyof RubricComponents], number> = {
  fail: 0,
  partial: 0.5,
  pass: 1,
};

const componentScoreWeights: Record<keyof RubricComponents, number> = {
  output: 0.03,
  evidence: 0.07,
  constraints: 0.3,
  search: 0.1,
  final: 0.5,
};

const scoreValue = (components: RubricComponents): number => {
  const score = Object.entries(componentScoreWeights).reduce(
    (total, [key, weight]) =>
      total + weight * componentScoreValues[components[key as keyof RubricComponents]],
    0,
  );
  return Math.min(score, components.final === "fail" ? 0.5 : 1);
};

const formatScore = (components: RubricComponents): string =>
  scoreValue(components).toFixed(2);

const ComponentBreakdown = ({ components }: { components: RubricComponents }) => (
  <ComponentList aria-label="Rubric components">
    {componentLabels.map(([key, label]) => (
      <ComponentChip key={key} $status={components[key]}>
        {label}
      </ComponentChip>
    ))}
  </ComponentList>
);

interface CaseModelResultProps {
  readonly cost: string;
  readonly runtime: string;
  readonly components: RubricComponents;
  readonly result: string;
}

const CaseModelResult = ({
  cost,
  runtime,
  components,
  result,
}: CaseModelResultProps) => (
  <ModelResultCell>
    <ScoreValue $status={statusForScore(formatScore(components))}>
      {formatScore(components)}
    </ScoreValue>
    <ModelMetric>Cost: {cost}</ModelMetric>
    <ModelMetric>Runtime: {runtime}</ModelMetric>
    <ComponentBreakdownSlot>
      <ComponentBreakdown components={components} />
    </ComponentBreakdownSlot>
    <ModelResultText>{result}</ModelResultText>
  </ModelResultCell>
);

const finalAnswerScoreCard = scoreCards.find((card) => card.label === "Final Answer");
const supportingScoreCards = scoreCards.filter((card) => card.label !== "Final Answer");

const TravelContextBenchmark = () => (
  <Page>
    <PageSeo
      title="Pack DeeperBench | Travel Agent Benchmark"
      description="Pack DeeperBench is a synthetic benchmark for travel-planning architecture over private context, calendar constraints, public timing, deterministic flight inventory, and deterministic hotel inventory."
      path="/pack-deeperbench"
      robots="noindex, follow"
      schema={[
        {
          "@type": "Dataset",
          name: "Pack DeeperBench",
          description:
            "Synthetic benchmark for evidence-grounded travel planning over household context, calendar constraints, public events, and deterministic travel inventory. Pack's latest hard-100 run passed 93 of 100 cases; selected hard-case baselines are not the official full-corpus score.",
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
        A synthetic benchmark for travel-planning architecture over private
        context, calendar constraints, public timing, deterministic flight
        inventory, and deterministic hotel inventory.
      </Intro>
      <StatusBar>
        <strong>{benchmarkOverview.status}.</strong>
        The reported run covers all 100 hard-corpus cases.
      </StatusBar>
      <MetricGrid>
        <Metric>
          <dt>Hard-100 Pack run</dt>
          <dd>{latestVerifiedPackRun.hard100Composite}</dd>
        </Metric>
        <Metric>
          <dt>Hard-100 cost</dt>
          <dd>{latestVerifiedPackRun.hard100TotalCost}</dd>
        </Metric>
        <Metric>
          <dt>Average case cost</dt>
          <dd>{latestVerifiedPackRun.averageHard100Cost}</dd>
        </Metric>
        <Metric>
          <dt>Average runtime</dt>
          <dd>{latestVerifiedPackRun.averageHard100Runtime}</dd>
        </Metric>
        <Metric>
          <dt>LLM calls</dt>
          <dd>{latestVerifiedPackRun.llmCalls}</dd>
        </Metric>
      </MetricGrid>
    </Header>

    <Section>
      <SectionTitle>Full-Corpus Result</SectionTitle>
      <ResultPanel>
        <ResultHeader>
          <h3>{latestVerifiedPackRun.label}</h3>
          <p>{latestVerifiedPackRun.summary}</p>
        </ResultHeader>
        <ResultGrid>
          <ResultItem>
            <span>Final pass count</span>
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
            <span>LLM calls</span>
            <strong>{latestVerifiedPackRun.llmCalls}</strong>
          </ResultItem>
        </ResultGrid>
      </ResultPanel>
    </Section>

    <Section>
      <SectionTitle>Metric Definitions</SectionTitle>
      <ResultGrid>
        {benchmarkMetricExplanations.map((item) => (
          <ResultItem key={item.label}>
            <span>{item.label}</span>
            <strong>{item.value}</strong>
            <p>{item.body}</p>
          </ResultItem>
        ))}
      </ResultGrid>
    </Section>

    <Section>
      <SectionTitle>Benchmark Scope</SectionTitle>
      <ProtocolList>
        {methodologyNotes.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ProtocolList>
    </Section>

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
        <ComparisonGrid aria-label="Selected hard-case system details">
          {hardSetSystemRows.map(({ comparisonRow, rubricRow }) => (
            <ComparisonCard key={comparisonRow.system}>
              <RubricHeader>
                <h4>{comparisonRow.system}</h4>
                <ComparisonBadge $outcome={comparisonRow.outcome}>
                  {comparisonRow.outcome}
                </ComparisonBadge>
              </RubricHeader>
              <ComparisonCost>{comparisonRow.cost}</ComparisonCost>
              <ComparisonMeta>
                <span>{comparisonRow.costMultiple}</span>
                <span>{comparisonRow.runtime}</span>
                <span>{comparisonRow.calls}</span>
              </ComparisonMeta>
              <FindingText>
                <strong>Summary:</strong> {comparisonRow.takeaway}
              </FindingText>
              <RubricCategoryList>
                {rubricCategories.map((category) => {
                  const value = rubricRow[category.key];
                  const denominator = rubricRow.denominator;
                  return (
                    <RubricCategory key={`${rubricRow.system}-${category.key}`}>
                      <RubricCategoryHeader>
                        <strong>{category.label}</strong>
                        <span>{value}/{denominator}</span>
                      </RubricCategoryHeader>
                      <BarTrack aria-hidden="true">
                        <BarFill $percent={(value / denominator) * 100} $tone={rubricRow.tone} />
                      </BarTrack>
                      <RubricDescription>{category.description}</RubricDescription>
                    </RubricCategory>
                  );
                })}
              </RubricCategoryList>
            </ComparisonCard>
          ))}
        </ComparisonGrid>
        <FindingText>{neurosymbolicComparison.estimateNote}</FindingText>
      </ResultPanel>
    </Section>

    <Section>
      <SectionTitle>Case Results</SectionTitle>
      <SectionText>
        Each row is one of ten especially difficult cases selected from the
        hard-100 corpus as a focused test set. The table reports rubric score,
        cost, runtime, rubric components, and the scored result note for Pack's
        architecture and the frontier-agent baselines on those same cases.
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
                  <CaseHardReason>{row.hardReason}</CaseHardReason>
                </td>
                <td>
                  <CaseModelResult
                    cost={row.packCost}
                    runtime={row.packRuntime}
                    components={row.packComponents}
                    result={row.packResult}
                  />
                </td>
                <td>
                  <CaseModelResult
                    cost={row.gptCost}
                    runtime={row.gptRuntime}
                    components={row.gptComponents}
                    result={row.gptResult}
                  />
                </td>
                <td>
                  <CaseModelResult
                    cost={row.opusCost}
                    runtime={row.opusRuntime}
                    components={row.opusComponents}
                    result={row.opusResult}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </ShootoutTable>
      </TableWrap>
    </Section>

    <Section>
      <SectionTitle>Benchmark Inputs</SectionTitle>
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
      <SectionTitle>Protocol</SectionTitle>
      <ProtocolList>
        {benchmarkOverview.protocol.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ProtocolList>
    </Section>

    <Section>
      <SectionTitle>Rubric</SectionTitle>
      <ScoreCardGrid>
        {supportingScoreCards.map((card) => {
          const Icon = card.icon;
          return (
            <ScoreCard key={card.label}>
              <Icon aria-hidden="true" />
              <h3>{card.label}</h3>
              <p>{card.body}</p>
            </ScoreCard>
          );
        })}
        {finalAnswerScoreCard ? (
          <ScoreCard key={finalAnswerScoreCard.label} $featured>
            <finalAnswerScoreCard.icon aria-hidden="true" />
            <h3>{finalAnswerScoreCard.label}</h3>
            <p>{finalAnswerScoreCard.body}</p>
          </ScoreCard>
        ) : null}
      </ScoreCardGrid>
    </Section>

    <Section>
      <SectionTitle>Hard-100 Corpus Cases</SectionTitle>
      <SectionText>
        The official hard-100 result covers every request listed here.
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
