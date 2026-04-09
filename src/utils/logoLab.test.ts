import {
  createLogoVariationPlan,
  getDefaultLogoStudioPrompt,
} from "./logoLab";

describe("logoLab", () => {
  it("prioritizes selected presets when building a new variation plan", () => {
    const plan = createLogoVariationPlan({
      companyName: "Pack",
      prompt: getDefaultLogoStudioPrompt(),
      count: 4,
      selectedPresetIds: ["icon-forward", "mascot-badge"],
      refinementNote: "Make it feel tighter and more app-icon ready.",
      requestBrainCluster: false,
    });

    expect(plan.items).toHaveLength(4);
    expect(plan.items[0]?.presetId).toBe("mascot-badge");
    expect(plan.items[1]?.presetId).toBe("icon-forward");
    expect(plan.refinedPrompt).toContain("Pack");
    expect(plan.refinedPrompt).toContain("Iteration note");
  });

  it("creates stable numbered prompts with distinct seeds", () => {
    const plan = createLogoVariationPlan({
      companyName: "Pack",
      prompt: getDefaultLogoStudioPrompt(),
      count: 3,
      selectedPresetIds: [],
      refinementNote: "",
      requestBrainCluster: false,
    });

    expect(plan.items.map((item) => item.number)).toEqual([1, 2, 3]);
    expect(new Set(plan.items.map((item) => item.seed)).size).toBe(3);
    expect(plan.items.every((item) => item.prompt.length > 40)).toBe(true);
  });
});
