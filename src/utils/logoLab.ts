import type { LogoLabGenerateRequest } from "../schemas/labs";

export type LogoVariationPreset = {
  readonly id: string;
  readonly label: string;
  readonly direction: string;
  readonly promptTail: string;
};

export const LOGO_BRANDING_RESEARCH_PRINCIPLES = [
  "Keep one unmistakable mascot silhouette and repeat it consistently instead of reinventing the character every time.",
  "Constrain the palette and preserve negative space so the mark stays legible at favicon, app-icon, and wordmark sizes.",
  "Choose one illustration voice, then vary composition and attitude inside that system rather than mixing unrelated styles.",
  "Bias toward small-size readability first: clear suitcase shape, readable dachshund body, and premium contrast before ornament.",
] as const;

export const LOGO_VARIATION_PRESETS: readonly LogoVariationPreset[] = [
  {
    id: "heritage-emblem",
    label: "Heritage Emblem",
    direction: "A premium seal that feels established and collectible.",
    promptTail:
      "Build it as a heritage emblem with a centered dachshund mascot, restrained gold details, crisp icon geometry, and luxury travel-brand balance.",
  },
  {
    id: "mascot-badge",
    label: "Mascot Badge",
    direction: "Cute but organized, like a polished app icon or sticker badge.",
    promptTail:
      "Build it as a cute mascot badge with rounded shapes, a friendly dachshund face, a clearly readable suitcase, and strong icon clarity.",
  },
  {
    id: "monoline-luxury",
    label: "Monoline Luxury",
    direction: "Minimal linework that still reads as a travel brand, not a pet shop.",
    promptTail:
      "Build it with elegant monoline contours, minimal fills, upscale restraint, and a dachshund-suitcase silhouette that still reads instantly at small sizes.",
  },
  {
    id: "editorial-crest",
    label: "Editorial Crest",
    direction: "A refined crest for premium travel identity and brand-system pages.",
    promptTail:
      "Build it as an editorial crest with strong symmetry, subtle gold framing, polished typography space, and a poised dachshund carrying travel intent.",
  },
  {
    id: "playful-caricature",
    label: "Playful Caricature",
    direction: "Highest-cuteness version without losing sophistication.",
    promptTail:
      "Push the caricature slightly more playful and charming, with expressive proportions, a warm premium attitude, and no childish clip-art energy.",
  },
  {
    id: "stamp-mark",
    label: "Stamp Mark",
    direction: "A bold compact mark that could stamp luggage tags, receipts, or app onboarding.",
    promptTail:
      "Build it as a compact stamp-style mark with high contrast, simplified forms, a strong dachshund profile, and clean suitcase recognition.",
  },
  {
    id: "wordmark-lockup",
    label: "Wordmark Lockup",
    direction: "A system-ready logo lockup where the mascot and the Pack name belong together.",
    promptTail:
      "Compose it as a logo lockup with the mascot integrated beside or above the Pack wordmark, leaving room for brand-system use across web and app.",
  },
  {
    id: "icon-forward",
    label: "Icon Forward",
    direction: "Designed first for app, tab, and social avatars.",
    promptTail:
      "Optimize it as an icon-forward mark with bold silhouette contrast, minimal small details, and immediate readability in a square crop.",
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
  "Create a logo for a company called Pack. Use a black-and-gold palette. The core mascot is a dachshund carrying or interacting with a suitcase. Keep it cute and characterful, but polished enough to feel like a premium travel brand. Prioritize a clean silhouette, icon legibility, and a logo system that can work on app icons, a website header, and merch.";

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
    "Brand system constraints: single dachshund mascot, black and gold only, no extra props beyond travel cues, premium travel feel, clean small-size readability, transparent or plain background, no mockups, no photo-realism, no watermark, no extra text beyond the Pack name when needed.",
    "Design intent: resemble a real identity exploration from a strong branding team, with coherent shape language and a repeatable mascot system.",
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
