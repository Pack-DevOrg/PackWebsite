/**
 * Common Schema Definitions
 *
 * This module provides standardized Zod schemas for common data types
 * used throughout the Pack server application. These are basic, reusable
 * schemas that can be composed into more complex schemas.
 *
 * @module shared/schemas/common
 */

import { z } from "zod";

/**
 * Enum for token providers
 */
export enum TokenProvider {
  Google = "Google",
  Microsoft = "Microsoft",
  Apple = "SignInWithApple",
  Plaid = "Plaid",
  PackDemo = "PackDemo",
}

/**
 * Schema for pagination response metadata
 */
const PaginationMetaSchema = z.object({
  total: z.number().int().nonnegative().optional(),
  hasMore: z.boolean().optional(),
  nextCursor: z.string().optional(),
  prevCursor: z.string().optional(),
  page: z.number().int().positive().optional(),
  totalPages: z.number().int().nonnegative().optional(),
});

/**
 * STANDARDIZED API RESPONSE SCHEMA - Used by ALL Lambda functions
 * 
 * This is the unified response format that all API endpoints must use.
 * It provides consistent error handling and human-readable error messages.
 */
export const StandardApiResponseSchema = z
  .object({
    success: z.boolean(),
    data: z.unknown().optional(),
    error: z.object({
      message: z.string(), // Human-readable error message for UI display
      code: z.string().optional(), // Application-specific error code
      details: z.unknown().optional(), // Additional error context (not shown to users)
    }).optional(),
    metadata: z.object({
      requestId: z.string(),
      timestamp: z.string().datetime(),
      processingTimeMs: z.number().optional(),
      pagination: PaginationMetaSchema.optional(),
    }).optional(),
  })
  .superRefine((val, ctx) => {
    if (!val.success) {
      // Error case - must have error object
      if (!val.error) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Error object must be provided when success is false.",
          path: ["error"],
        });
      }
      if (val.data !== undefined) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Data should not be provided when success is false.",
          path: ["data"],
        });
      }
    } else {
      // Success case - must not have error object
      if (val.error) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Error object should not be provided when success is true.",
          path: ["error"],
        });
      }
    }
  });

/**
 * Schema for date range
 */
export const DateRangeSchema = z
  .object({
    startDate: z.string().datetime(),
    endDate: z.string().datetime(),
  })
  .refine((data) => new Date(data.startDate) <= new Date(data.endDate), {
    message: "End date must be after start date",
    path: ["endDate"],
  });

/**
 * Schema for address
 */
export const AddressSchema = z.object({
  street: z.string(),
  city: z.string(),
  state: z.string().optional(),
  postalCode: z.string(),
  country: z.string().length(2).describe("ISO 3166-1 alpha-2 country code"),
});

/**
 * Schema for money/currency amount
 */
export const MoneySchema = z.object({
  amount: z.number(),
  currency: z.string()
    .length(3, "Currency code must be exactly 3 characters")
    .regex(/^[A-Z]{3}$/, "Currency code must be 3 uppercase letters")
    .describe("ISO 4217 currency code"),
});

/**
 * Schema for ID validation with various patterns
 */
export const IdSchema = z.union([
  z.string().uuid(),
  z.string().regex(/^[a-zA-Z0-9_-]{6,36}$/),
  z
    .string()
    .regex(/^[0-9a-f]{24}$/)
    .describe("MongoDB ObjectId"),
]);

/**
 * Geographic location schema
 */
export const LocationSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
});

// Export TypeScript type definitions derived from the schemas
export type DateRange = z.infer<typeof DateRangeSchema>;
export type Address = z.infer<typeof AddressSchema>;
export type Money = z.infer<typeof MoneySchema>;
export type Id = z.infer<typeof IdSchema>;
export type Location = z.infer<typeof LocationSchema>;
