import {
  benchmarkMetricExplanations,
  benchmarkOverview,
  hard100Cases,
  latestVerifiedPackRun,
} from "./travelContextBenchmark";

describe("travelContextBenchmark public DeeperBench 2.0", () => {
  it("identifies as pack-deeperbench-2.0 not v0", () => {
    expect(benchmarkOverview.version).toBe("pack-deeperbench-2.0");
    expect(benchmarkOverview.version).not.toBe("pack-deeperbench-v0");
  });

  it("does not keep the June-16 v0 93/100 as the live score", () => {
    expect(latestVerifiedPackRun.hard100Composite).not.toBe("93/100");
  });

  it("locks the live composite to corpus size 100 cases · 4×25", () => {
    expect(latestVerifiedPackRun.hard100Composite).toBe("100 cases · 4×25");
  });

  it("does not label corpus size as a pass count", () => {
    const wrapping = benchmarkMetricExplanations.filter(
      (item) => item.value === latestVerifiedPackRun.hard100Composite,
    );
    expect(wrapping.length).toBeGreaterThan(0);
    wrapping.forEach((item) => {
      expect(item.label).not.toBe("Final pass count");
      expect(item.label.toLowerCase()).not.toMatch(/pass count/);
      expect(item.body.toLowerCase()).not.toMatch(
        /final answer matched the expected outcome/,
      );
    });
  });

  it("keeps cost runtime and LLM calls unverified", () => {
    expect(latestVerifiedPackRun.hard100TotalCost).toBe("not yet verified");
    expect(latestVerifiedPackRun.averageHard100Cost).toBe("not yet verified");
    expect(latestVerifiedPackRun.hard100Runtime).toBe("not yet verified");
    expect(latestVerifiedPackRun.averageHard100Runtime).toBe("not yet verified");
    expect(latestVerifiedPackRun.llmCalls).toBe("not yet verified");
  });

  it("ships the 2.0 4x25 public prompts", () => {
    expect(hard100Cases).toHaveLength(100);
    expect(hard100Cases[0]?.number).toBe("db2-t1-001");
    expect(hard100Cases.map((c) => c.number)).toContain("db2-t4-025");
    expect(
      hard100Cases.some((c) => c.title === "@family Japan for about a week."),
    ).toBe(false);
  });
});

describe("travelContextBenchmark exported public copy", () => {
  it("JSON-LD and status copy do not claim a 93/100 pass fraction", async () => {
    const mod = await import("./travelContextBenchmark");
    expect(mod).toHaveProperty("benchmarkDatasetJsonLdDescription");
    expect(mod).toHaveProperty("benchmarkStatusBarNote");
    expect(mod).toHaveProperty("hard100CorpusSizeLabel");
    expect(mod.benchmarkDatasetJsonLdDescription).not.toContain("passed 93 of 100");
    expect(mod.benchmarkDatasetJsonLdDescription).toContain("100 cases · 4×25");
    expect(mod.benchmarkDatasetJsonLdDescription).toMatch(
      /no verified 2\.0 full-run pass count is published/i,
    );
    expect(mod.benchmarkStatusBarNote).not.toContain(
      "The reported run covers all 100 hard-corpus cases.",
    );
    expect(mod.hard100CorpusSizeLabel).not.toBe("Final pass count");
    expect(mod.hard100CorpusSizeLabel.toLowerCase()).not.toMatch(/pass count/);
  });
});
