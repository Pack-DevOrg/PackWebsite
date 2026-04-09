import type { LogoLabGenerateRequest } from "../schemas/labs";

export type LogoVariationPreset = {
  readonly id: string;
  readonly label: string;
  readonly direction: string;
  readonly promptTail: string;
};

export const LOGO_BRANDING_RESEARCH_PRINCIPLES = [
  "Keep one unmistakable dachshund silhouette and one unmistakable suitcase cue; do not let other props or framing devices compete with them.",
  "Bias toward app-icon clarity first: a premium travel mark should read in one glance before any stylistic flourish lands.",
  "Treat the suitcase in the dog's mouth as a hard structural requirement, not an optional accessory or nearby prop.",
  "Preserve negative space and tiny-shape discipline so the mark stays premium, minimal, and legible without clip-art clutter.",
] as const;

export const LOGO_VARIATION_PRESETS: readonly LogoVariationPreset[] = [
  {
    id: "heritage-emblem",
    label: "Luxury Silhouette",
    direction: "A spare premium silhouette with the least possible ornament.",
    promptTail:
      "Keep it ultra-minimal and premium, with the dachshund clearly holding the suitcase in its mouth, no badge framing, no background, and no extra ornament.",
  },
  {
    id: "mascot-badge",
    label: "Soft Character",
    direction: "Cute and warm, but still restrained enough to feel like a premium app mark.",
    promptTail:
      "Use rounded premium shapes, a smiling dachshund, happy eyes, and a suitcase visibly held in the mouth, while staying minimal and background-free.",
  },
  {
    id: "monoline-luxury",
    label: "Monoline Travel",
    direction: "Minimal linework that still reads as a travel symbol instead of a pet-service mascot.",
    promptTail:
      "Build it with elegant monoline contours, one-color restraint, and a dachshund profile whose mouth clearly grips a suitcase handle or body.",
  },
  {
    id: "editorial-crest",
    label: "Negative Space Merge",
    direction: "A refined merge of dog and suitcase through shape integration rather than decoration.",
    promptTail:
      "Integrate the suitcase directly into the dachshund silhouette through clean negative space, but keep the dog visibly holding it in the mouth.",
  },
  {
    id: "playful-caricature",
    label: "Playful Minimal",
    direction: "The cutest branch, but still disciplined enough for an App Store icon.",
    promptTail:
      "Push the expression slightly cuter and happier, but keep forms clean, single-color, minimal, and far away from clip-art energy.",
  },
  {
    id: "stamp-mark",
    label: "Compact Mark",
    direction: "A bold compact mark tuned for small icon sizes and crisp silhouette recognition.",
    promptTail:
      "Build it as a compact silhouette-first mark with a strong dachshund profile and a suitcase shape that reads instantly in the mouth.",
  },
  {
    id: "wordmark-lockup",
    label: "Travel Symbol",
    direction: "A symbol-first direction that prioritizes travel-brand read over pet-brand read.",
    promptTail:
      "Make the suitcase feel like a real travel object and the overall symbol feel like a travel-app identity, not a pet transport logo.",
  },
  {
    id: "icon-forward",
    label: "App Icon Mark",
    direction: "Designed first for app-icon readability and premium consumer-tech polish.",
    promptTail:
      "Optimize it as a premium app-icon mark with immediate readability, minimal detail, no background, and the dog clearly holding the suitcase in its mouth.",
  },
] as const;

export type LogoVariationPlanItem = {
  readonly id: string;
  readonly presetId: string;
  readonly presetLabel: string;
  readonly direction: string;
  readonly prompt: string;
  readonly seed: number;
  readonly number: number;
};

export const getDefaultLogoStudioPrompt = (): string =>
  "Create a premium minimal mark for a travel app called Pack. Use exactly one saffron-gold tone and no background. The subject is a smiling right-facing dachshund holding a small suitcase in its mouth. Keep it cute but restrained, highly legible at iPhone app-icon size, and clearly travel-oriented rather than pet-service oriented.";

const slugify = (value: string): string =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const hashText = (value: string): number => {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) | 0;
  }
  return Math.abs(hash);
};

const buildSelectedDirectionNote = (
  selectedPresetIds: readonly string[],
): string => {
  if (selectedPresetIds.length === 0) {
    return "";
  }

  const selectedLabels = LOGO_VARIATION_PRESETS.filter((preset) =>
    selectedPresetIds.includes(preset.id),
  ).map((preset) => preset.label);

  if (selectedLabels.length === 0) {
    return "";
  }

  return `Lean toward these explored directions from the previous round: ${selectedLabels.join(", ")}. Preserve the strongest shared silhouette cues while still producing distinct options.`;
};

export const buildLogoStudioPrompt = (
  request: Pick<
    LogoLabGenerateRequest,
    "companyName" | "prompt" | "refinementNote" | "selectedPresetIds"
  >,
): string => {
  const companyName = request.companyName.trim() || "Pack";
  const refinement = request.refinementNote.trim();
  const selectedDirectionNote = buildSelectedDirectionNote(
    request.selectedPresetIds,
  );

  return [
    `Brand name: ${companyName}.`,
    request.prompt.trim(),
    "Hard requirements: exactly one dachshund, facing right, smiling, happy eyes, clearly holding a suitcase in its mouth. No pearls. No text. No logo lettering. No background. No badge or sticker framing. No mockups. No photorealism.",
    "Art direction: single-color premium travel-app mark, minimal and modern, with the suitcase reading as a travel cue rather than a pet accessory. Keep the shape language elegant and coherent.",
    selectedDirectionNote,
    refinement.length > 0 ? `Iteration note: ${refinement}` : "",
  ]
    .filter((value) => value.length > 0)
    .join(" ");
};

const orderVariationPresets = (
  selectedPresetIds: readonly string[],
): readonly LogoVariationPreset[] => {
  if (selectedPresetIds.length === 0) {
    return LOGO_VARIATION_PRESETS;
  }

  const selected = LOGO_VARIATION_PRESETS.filter((preset) =>
    selectedPresetIds.includes(preset.id),
  );
  const remaining = LOGO_VARIATION_PRESETS.filter(
    (preset) => !selectedPresetIds.includes(preset.id),
  );
  return [...selected, ...remaining];
};

export const createLogoVariationPlan = (
  request: LogoLabGenerateRequest,
): {
  readonly refinedPrompt: string;
  readonly items: readonly LogoVariationPlanItem[];
} => {
  const refinedPrompt = buildLogoStudioPrompt(request);
  const orderedPresets = orderVariationPresets(request.selectedPresetIds).slice(
    0,
    request.count,
  );
  const baseSeed = hashText(
    [
      request.companyName,
      request.prompt,
      request.refinementNote,
      request.selectedPresetIds.join("|"),
      String(request.count),
    ].join("::"),
  );

  const items = orderedPresets.map((preset, index) => ({
    id: `${slugify(request.companyName)}-${preset.id}-${index + 1}`,
    presetId: preset.id,
    presetLabel: preset.label,
    direction: preset.direction,
    prompt: `${refinedPrompt} ${preset.promptTail}`,
    seed: baseSeed + (index + 1) * 97,
    number: index + 1,
  }));

  return {
    refinedPrompt,
    items,
  };
};
