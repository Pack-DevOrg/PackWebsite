import { z } from "zod";

export const LogoLabGenerateRequestSchema = z.object({
  companyName: z.string().trim().min(1).max(80).default("Pack"),
  prompt: z.string().trim().min(24).max(2000),
  count: z.number().int().min(1).max(8).default(6),
  selectedPresetIds: z.array(z.string().trim().min(1)).max(8).default([]),
  refinementNote: z.string().trim().max(600).default(""),
  requestBrainCluster: z.boolean().default(false),
});

export type LogoLabGenerateRequest = z.infer<
  typeof LogoLabGenerateRequestSchema
>;

export const LogoLabVariantSchema = z.object({
  id: z.string(),
  presetId: z.string(),
  presetLabel: z.string(),
  direction: z.string(),
  prompt: z.string(),
  seed: z.number().int(),
  number: z.number().int().min(1),
  generatedImagePath: z.string(),
  previewUrl: z.string(),
  fileUrl: z.string(),
});

export type LogoLabVariant = z.infer<typeof LogoLabVariantSchema>;

export const LogoLabRunSchema = z.object({
  runId: z.string(),
  companyName: z.string(),
  prompt: z.string(),
  refinedPrompt: z.string(),
  count: z.number().int().min(1).max(8),
  generatedAt: z.string(),
  selectedPresetIds: z.array(z.string()),
  warnings: z.array(z.string()).default([]),
  researchPrinciples: z.array(z.string()),
  variants: z.array(LogoLabVariantSchema),
});

export type LogoLabRun = z.infer<typeof LogoLabRunSchema>;

const TravelDetailReviewLocationSchema = z.object({
  label: z.string(),
  cityCode: z.string().nullable().optional(),
  cityName: z.string().nullable().optional(),
});

const TravelDetailReviewTimingSchema = z.object({
  startDate: z.string().nullable().optional(),
  endDate: z.string().nullable().optional(),
});

const TravelDetailReviewGroundingSchema = z.object({
  locationGrounded: z.boolean().optional(),
  timeGrounded: z.boolean().optional(),
});

const TravelDetailReviewProductsSchema = z.object({
  flight: z.string().optional(),
  lodging: z.string().optional(),
  car: z.string().optional(),
  activity: z.string().optional(),
});

export const TravelDetailReviewOutputSchema = z
  .object({
    legId: z.string().optional(),
    title: z.string().optional(),
    querySubstring: z.string().optional(),
    isOptional: z.boolean().optional(),
    kind: z.string().optional(),
    location: TravelDetailReviewLocationSchema.optional(),
    timing: TravelDetailReviewTimingSchema.optional(),
    events: z.array(z.unknown()).default([]),
    grounding: TravelDetailReviewGroundingSchema.optional(),
    products: TravelDetailReviewProductsSchema.optional(),
    constraintStrength: z.enum(["soft", "hard"]).optional(),
    searchTermList: z.array(z.string()).optional(),
    onlineSearchQuery: z.string().nullable().optional(),
    llmSearchQueryList: z.array(z.string()).optional(),
    apiSearchFilterList: z.array(z.unknown()).optional(),
    thematicTags: z.array(z.string()).optional(),
  })
  .passthrough();

export type TravelDetailReviewOutput = z.infer<
  typeof TravelDetailReviewOutputSchema
>;

export const TravelDetailReviewStageSchema = z.object({
  stage: z.string(),
  output: z.unknown().optional(),
});

export const TravelDetailReviewLegSchema = z.object({
  legId: z.string(),
  title: z.string(),
  kind: z.string(),
  stages: z.array(TravelDetailReviewStageSchema).default([]),
});

export const TravelDetailReviewArtifactSchema = z.object({
  caseId: z.string(),
  message: z.string(),
  legs: z.array(TravelDetailReviewLegSchema).default([]),
});

export const TravelDetailReviewResultSchema = z.object({
  caseId: z.string(),
  passed: z.boolean(),
  error: z.string().optional(),
  artifact: TravelDetailReviewArtifactSchema.optional(),
});

export type TravelDetailReviewResult = z.infer<
  typeof TravelDetailReviewResultSchema
>;

export const TravelDetailReviewAggregateSchema = z.object({
  totalCases: z.number().int(),
  passedCount: z.number().int(),
  failedCount: z.number().int(),
  results: z.array(TravelDetailReviewResultSchema),
});

export type TravelDetailReviewAggregate = z.infer<
  typeof TravelDetailReviewAggregateSchema
>;
