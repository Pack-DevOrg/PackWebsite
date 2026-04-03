import { z } from "zod";

const DateOnlyStringSchema = z
  .string()
  .regex(/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/);

export const SharedTravelFlightChunkSchema = z.object({
  id: z.string(),
  type: z.literal("flight"),
  origin: z.string(),
  destination: z.string(),
  date: DateOnlyStringSchema,
  departureTime: z.string().optional(),
  arrivalTime: z.string().optional(),
  airline: z.string().optional(),
  flightNumber: z.string().optional(),
});

export const SharedTravelHotelChunkSchema = z.object({
  id: z.string(),
  type: z.literal("hotel"),
  location: z.string(),
  checkIn: DateOnlyStringSchema,
  checkOut: DateOnlyStringSchema.optional(),
  name: z.string().optional(),
  nights: z.number().int().positive().optional(),
  eventList: z.array(z.unknown()).optional(),
});

export const SharedTravelFlightOutlineChunkSchema = z.object({
  id: z.string(),
  type: z.literal("flightOutline"),
  origin: z.string(),
  destination: z.string(),
  date: DateOnlyStringSchema,
  earliestDeparture: z.string().optional(),
  latestDeparture: z.string().optional(),
  earliestArrival: z.string().optional(),
  latestArrival: z.string().optional(),
  alreadyBooked: z.boolean().default(false),
});

export const SharedTravelHotelOutlineChunkSchema = z.object({
  id: z.string(),
  type: z.literal("hotelOutline"),
  location: z.string(),
  checkIn: DateOnlyStringSchema,
  checkOut: DateOnlyStringSchema.optional(),
  nights: z.number().int().positive(),
  eventList: z.array(z.unknown()).optional(),
});

export const SharedTravelOutlineChunkSchema = z.union([
  SharedTravelFlightOutlineChunkSchema,
  SharedTravelHotelOutlineChunkSchema,
]);

export const SharedTravelChunkSchema = z.union([
  SharedTravelFlightChunkSchema,
  SharedTravelHotelChunkSchema,
  SharedTravelFlightOutlineChunkSchema,
  SharedTravelHotelOutlineChunkSchema,
]);

export const SharedTravelPlanSchema = z.object({
  shareId: z.string(),
  title: z.string(),
  description: z.string().optional(),
  chunks: z.array(SharedTravelChunkSchema),
  outlineChunks: z.array(SharedTravelOutlineChunkSchema).default([]),
  thumbnailUrl: z.string().url().optional(),
  sharedBy: z.string().optional(),
  createdAt: z.string().datetime(),
  expiresAt: z.string().datetime(),
  ttl: z.number().int().optional(),
  userId: z.string().optional(),
  viewCount: z.number().int().default(0),
});

export type SharedTravelPlan = z.infer<typeof SharedTravelPlanSchema>;

export const CreateSharedTravelPlanRequestSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(500).optional(),
  chunks: z.array(z.any()).default([]),
  outlineChunks: z.array(z.any()).default([]),
  sharedBy: z.string().optional(),
  expirationDays: z.number().int().min(1).max(90).default(30),
});

export type CreateSharedTravelPlanRequest = z.infer<typeof CreateSharedTravelPlanRequestSchema>;

export const CreateSharedTravelPlanResponseSchema = z.object({
  success: z.boolean(),
  shareId: z.string(),
  shareUrl: z.string().url(),
  expiresAt: z.string().datetime(),
  error: z.string().optional(),
});

export type CreateSharedTravelPlanResponse = z.infer<typeof CreateSharedTravelPlanResponseSchema>;

export const SharedTravelDataSchema = z.object({
  version: z.literal("1.0"),
  title: z.string(),
  description: z.string().optional(),
  chunks: z.array(SharedTravelChunkSchema),
  outlineChunks: z.array(SharedTravelOutlineChunkSchema).default([]),
  createdAt: z.string().datetime(),
  sharedBy: z.string().optional(),
});

export type SharedTravelChunk = z.infer<typeof SharedTravelChunkSchema>;
export type SharedTravelOutlineChunk = z.infer<typeof SharedTravelOutlineChunkSchema>;
export type SharedTravelData = z.infer<typeof SharedTravelDataSchema>;

export const SharedTravelPlanErrorCodeSchema = z.enum([
  "NOT_FOUND",
  "EXPIRED",
  "RATE_LIMITED",
  "INVALID",
]);

export type SharedTravelPlanErrorCode = z.infer<typeof SharedTravelPlanErrorCodeSchema>;

export const GetSharedTravelPlanResponseSchema = z.object({
  success: z.boolean(),
  data: SharedTravelDataSchema.optional(),
  error: z.string().optional(),
  errorCode: SharedTravelPlanErrorCodeSchema.optional(),
});

export type GetSharedTravelPlanResponse = z.infer<typeof GetSharedTravelPlanResponseSchema>;
