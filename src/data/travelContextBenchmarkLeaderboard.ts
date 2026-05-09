export type TravelContextBenchmarkSplit = {
  split: "dev";
  suiteId: "dev";
  scenarioCount: number;
  passedCount: number;
  passRate: number;
  averageScore: number;
  totalWallClockMs: number;
  averageWallClockMs: number;
  totalEstimatedCostUsd: number;
  averageEstimatedCostUsd: number;
  scorePerDollar: number;
  scorePerMinute: number;
};

export type TravelContextBenchmarkEntry = {
  agentId: string;
  label: string;
  executionMode: "aws-sqs-fargate";
  split: TravelContextBenchmarkSplit;
};

export const travelContextBenchmarkLeaderboard = {
  benchmarkVersion: "travel-context-scaffold-v0",
  generatedAt: "2026-05-09T04:00:00.000Z",
  mode: "aws-public-run",
  hiddenEvalStatus: "protocol-only",
  entries: [
    {
      agentId: "openai-compatible:gpt-4.1",
      label: "GPT-4.1",
      executionMode: "aws-sqs-fargate",
      split: {
        split: "dev",
        suiteId: "dev",
        scenarioCount: 20,
        passedCount: 0,
        passRate: 0,
        averageScore: 0.8749999999999998,
        totalWallClockMs: 61367,
        averageWallClockMs: 3068.35,
        totalEstimatedCostUsd: 0.42725399999999997,
        averageEstimatedCostUsd: 0.0213627,
        scorePerDollar: 2.047962102168733,
        scorePerMinute: 0.8555086610067297,
      },
    },
    {
      agentId: "pack-planner:aws-dev-colocated",
      label: "Pack planner",
      executionMode: "aws-sqs-fargate",
      split: {
        split: "dev",
        suiteId: "dev",
        scenarioCount: 20,
        passedCount: 0,
        passRate: 0,
        averageScore: 0.21374999999999997,
        totalWallClockMs: 4972970,
        averageWallClockMs: 248648.5,
        totalEstimatedCostUsd: 1.1703689999999998,
        averageEstimatedCostUsd: 0.058518449999999986,
        scorePerDollar: 0.1826347075153221,
        scorePerMinute: 0.002578941759149964,
      },
    },
  ] satisfies TravelContextBenchmarkEntry[],
};
