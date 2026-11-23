import { z } from "zod";
import { TimelineChunkSchema } from "./travel";

const JobStatusEnum = z.enum(["queued", "processing", "completed", "failed", "cancelled"]);
const JobStepStatusEnum = z.enum(["processing", "completed", "failed"]);
const ProgressItemStatusEnum = z.enum(["pending", "processing", "completed", "failed"]);
const JobTypeEnum = z.enum([
  "travel_planning",
  "travel_search",
  "travel_extraction",
  "preference_extraction",
  "calendar_add",
  "uber_service",
  "content_rejection",
  "guided_task",
]);

export const DiscoveryLogEntrySchema = z.object({
  id: z.string(),
  recordedAt: z.string().datetime(),
  type: z.enum(["discovery", "warning", "error", "milestone"]),
  icon: z.string().optional(),
  message: z.string(),
  details: z
    .object({
      count: z.number().optional(),
      dateRange: z
        .object({
          start: z.string().datetime().optional(),
          end: z.string().datetime().optional(),
        })
        .optional(),
      entities: z.array(z.string()).optional(),
      confidence: z.number().min(0).max(1).optional(),
      metadata: z.record(z.string(), z.unknown()).optional(),
    })
    .optional(),
});

const ProgressItemSchema = z.object({
  id: z.string(),
  label: z.string(),
  status: ProgressItemStatusEnum,
  order: z.number().int().nonnegative(),
  startedAt: z.string().datetime().optional(),
  completedAt: z.string().datetime().optional(),
  error: z.string().optional(),
  progress: z.number().min(0).max(100).optional(),
});

export const JobStatusResponseSchema = z.object({
  jobId: z.string().uuid(),
  status: JobStatusEnum,
  jobType: JobTypeEnum,
  currentStep: z.string().optional(),
  stepStatus: JobStepStatusEnum.optional(),
  stepDetails: z.string().optional(),
  result: z.unknown().optional(),
  error: z.string().optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  // Backward-compatible: some backend responses still send `progress` as a number.
  progress: z
    .union([
      z.number().min(0).max(100),
      z.object({
        currentStep: z.string().optional(),
        stepStatus: JobStepStatusEnum.optional(),
        stepDetails: z.string().optional(),
        completedSteps: z.array(z.string()).optional(),
        totalSteps: z.number().optional(),
        percentComplete: z.number().min(0).max(100).optional(),
      }),
    ])
    .optional(),
  progressItems: z.array(ProgressItemSchema).optional(),
  discoveryLog: z.array(DiscoveryLogEntrySchema).optional(),
});

export const TravelJobResultSchema = z.object({
  success: z.boolean().default(true),
  timelineItems: z.array(TimelineChunkSchema).default([]),
  timelineVariant: z.enum(["outline", "plan"]).default("plan"),
  smartSorted: z.record(z.string(), z.array(z.unknown()).default([])).optional(),
  priceSorted: z.record(z.string(), z.array(z.unknown()).default([])).optional(),
  planMetadata: z.unknown().optional(),
  metadata: z.unknown().optional(),
  warnings: z.array(z.string()).optional(),
  errors: z.array(
    z.object({
      type: z.string(),
      message: z.string(),
      details: z.unknown().optional(),
    })
  ).optional(),
});

