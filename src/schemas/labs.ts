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

export const VideoLabGenerateRequestSchema = z.object({
  templateId: z.string().trim().min(1),
  count: z.number().int().min(1).max(8).default(2),
  autoSubtitles: z.boolean().default(false),
  subtitleBurn: z.boolean().default(false),
});

export type VideoLabGenerateRequest = z.infer<
  typeof VideoLabGenerateRequestSchema
>;

export const VideoLabTemplateSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  tags: z.array(z.string()),
  channelLabel: z.string(),
});

export type VideoLabTemplate = z.infer<typeof VideoLabTemplateSchema>;

export const VideoLabVariantSchema = z.object({
  id: z.string(),
  slug: z.string(),
  title: z.string(),
  description: z.string(),
  tags: z.array(z.string()),
  localPath: z.string(),
  previewUrl: z.string(),
  fileUrl: z.string(),
  templateId: z.string(),
  fileName: z.string(),
});

export type VideoLabVariant = z.infer<typeof VideoLabVariantSchema>;

export const VideoLabGroupSchema = z.object({
  slug: z.string(),
  templateId: z.string(),
  title: z.string(),
  description: z.string(),
  tags: z.array(z.string()),
  channelLabel: z.string(),
  featuredVideoSlug: z.string().nullable(),
  variants: z.array(VideoLabVariantSchema),
});

export type VideoLabGroup = z.infer<typeof VideoLabGroupSchema>;

export const VideoLabManifestSchema = z.object({
  projectDir: z.string(),
  exportsDir: z.string(),
  generatedAt: z.string(),
  templates: z.array(VideoLabTemplateSchema),
  groups: z.array(VideoLabGroupSchema),
});

export type VideoLabManifest = z.infer<typeof VideoLabManifestSchema>;

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

const PlannerCorpusReviewOptionRowSchema = z
  .object({
    label: z.string().nullable().optional(),
    title: z.string().nullable().optional(),
    location: z.string().nullable().optional(),
    cityCode: z.string().nullable().optional(),
    cityName: z.string().nullable().optional(),
    countryCode: z.string().nullable().optional(),
    gatewayAirportIata: z.string().nullable().optional(),
    candidateType: z.string().nullable().optional(),
    startDate: z.string().nullable().optional(),
    endDate: z.string().nullable().optional(),
    timezone: z.string().nullable().optional(),
    selectionSignals: z.array(z.string()).default([]),
  })
  .passthrough();

export type PlannerCorpusReviewOptionRow = z.infer<
  typeof PlannerCorpusReviewOptionRowSchema
>;

const PlannerCorpusPendingUserInputSchema = z
  .object({
    id: z.string().optional(),
    kind: z.string().optional(),
    title: z.string().optional(),
    prompt: z.string().optional(),
    itemTypes: z.array(z.string()).default([]),
    itemTitles: z.array(z.string()).default([]),
    optionLabels: z.array(z.string()).default([]),
    optionTitles: z.array(z.string()).default([]),
    optionDates: z.array(z.string()).default([]),
    optionRows: z.array(PlannerCorpusReviewOptionRowSchema).default([]),
    items: z.array(z.unknown()).default([]),
    options: z.array(z.unknown()).default([]),
  })
  .passthrough();

export type PlannerCorpusPendingUserInput = z.infer<
  typeof PlannerCorpusPendingUserInputSchema
>;

const PlannerCorpusOutlineRowSchema = z
  .object({
    type: z.string().optional(),
    id: z.string().optional(),
    title: z.string().nullable().optional(),
    location: z.string().nullable().optional(),
    cityCode: z.string().nullable().optional(),
    origin: z.string().nullable().optional(),
    destination: z.string().nullable().optional(),
    date: z.string().nullable().optional(),
    departureDate: z.string().nullable().optional(),
    checkIn: z.string().nullable().optional(),
    checkOut: z.string().nullable().optional(),
    eventTitles: z.array(z.string()).default([]),
    eventDistanceSummary: z.unknown().nullable().optional(),
  })
  .passthrough();

export type PlannerCorpusOutlineRow = z.infer<
  typeof PlannerCorpusOutlineRowSchema
>;

const PlannerCorpusContextSchema = z
  .object({
    location: z.string().nullable().optional(),
    startDate: z.string().nullable().optional(),
    endDate: z.string().nullable().optional(),
    passengerCount: z.number().optional(),
    eventTitles: z.array(z.string()).default([]),
    contextTitles: z.array(z.string()).default([]),
    syntheticTitles: z.array(z.string()).default([]),
    eventRows: z.array(z.unknown()).default([]),
  })
  .passthrough();

export const PlannerCorpusReviewResultSchema = z
  .object({
    caseId: z.string(),
    message: z.string().optional(),
    tags: z.array(z.string()).default([]),
    status: z.string().optional(),
    currentStep: z.string().nullable().optional(),
    shortOverview: z.string().nullable().optional(),
    passed: z.boolean().optional(),
    expectationPassed: z.boolean().nullable().optional(),
    rubricPassed: z.boolean().nullable().optional(),
    processingDurationMs: z.number().nullable().optional(),
    error: z.string().nullable().optional(),
    resultError: z.string().nullable().optional(),
    noTravelReason: z.string().nullable().optional(),
    searchNote: z.string().nullable().optional(),
    context: PlannerCorpusContextSchema.nullable().optional(),
    canonicalContext: z.unknown().nullable().optional(),
    pendingUserInput: PlannerCorpusPendingUserInputSchema.nullable().optional(),
    outlineRows: z.array(PlannerCorpusOutlineRowSchema).default([]),
    timelineItems: z.array(z.string()).default([]),
    expectationFailures: z.array(z.unknown()).default([]),
    rubricFindings: z.array(z.unknown()).default([]),
    outlineTravelability: z.unknown().nullable().optional(),
    outlineQuality: z.unknown().nullable().optional(),
    llmMetrics: z.unknown().nullable().optional(),
  })
  .passthrough();

export type PlannerCorpusReviewResult = z.infer<
  typeof PlannerCorpusReviewResultSchema
>;

export const PlannerCorpusReviewAggregateSchema = z
  .object({
    totalCaseCount: z.number().int().optional(),
    caseCount: z.number().int().optional(),
    passedCount: z.number().int().optional(),
    failedCount: z.number().int().optional(),
    expectationFailedCount: z.number().int().optional(),
    rubricFailedCount: z.number().int().optional(),
    completedCount: z.number().int().optional(),
    pendingCount: z.number().int().optional(),
    referenceDate: z.string().optional(),
    generatedAt: z.string().optional(),
    startedAt: z.string().optional(),
    completedAt: z.string().optional(),
    outDir: z.string().optional(),
    corpus: z.string().optional(),
    evaluationMode: z.string().optional(),
    executionMode: z.string().optional(),
    results: z.array(PlannerCorpusReviewResultSchema),
  })
  .passthrough();

export type PlannerCorpusReviewAggregate = z.infer<
  typeof PlannerCorpusReviewAggregateSchema
>;
