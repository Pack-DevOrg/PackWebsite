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
