/**
 * Common Schema Definitions
 *
 * This module provides standardized Zod schemas for common data types
 * used throughout the DoneAIServer application. These are basic, reusable
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
  DoneAIDemo = "DoneAIDemo",
}

/**
 * Schema for pagination parameters
 */
export const PaginationParamsSchema = z.object({
  limit: z.number().int().positive().max(100).default(10),
  cursor: z.string().optional(),
  page: z.number().int().positive().optional(),
});

/**
 * Schema for pagination response metadata
 */
export const PaginationMetaSchema = z.object({
  total: z.number().int().nonnegative().optional(),
  hasMore: z.boolean().optional(),
  nextCursor: z.string().optional(),
  prevCursor: z.string().optional(),
  page: z.number().int().positive().optional(),
  totalPages: z.number().int().nonnegative().optional(),
});

/**
 * Schema for standardized API response metadata.
 * Combines request/processing info with optional pagination details.
 */
export const StandardMetadataSchema = z.object({
  requestId: z.string().optional(),
  processingTimeMs: z.number().optional(),
  timestamp: z.string().datetime().optional(), // ISO 8601 datetime string
  pagination: PaginationMetaSchema.optional(), // PaginationMetaSchema is defined before this block
});

/**
 * Schema for standardized API error details.
 */
export const StandardErrorDetailSchema = z.object({
  message: z.string(),
  code: z.string().optional(), // Application-specific error code (e.g., 'VALIDATION_ERROR', 'NOT_FOUND')
  // issues: z.array(z.any()).optional(), // Can be used for detailed validation errors, like Zod issues
});

/**
 * Basic API response schema (for backward compatibility)
 */
export const ApiResponseSchema = z.object({
  success: z.boolean(),
  data: z.unknown().optional(),
  error: z.string().optional(),
  metadata: StandardMetadataSchema.optional(),
});

/**
 * Consolidated API response schema for both success and error responses.
 * - For success (success: true): 'data' may be present, 'error' must be absent.
 * - For error (success: false): 'error' must be present, 'data' must be absent.
 */
export const ConsolidatedApiResponseSchema = z
  .object({
    success: z.boolean(),
    data: z.unknown().optional(),
    error: StandardErrorDetailSchema.optional(),
    metadata: StandardMetadataSchema.optional(),
  })
  .superRefine((val, ctx) => {
    if (!val.success) {
      // Error case
      if (!val.error) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message:
            "Error details (error object) must be provided when success is false.",
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
      // Success case (val.success is true)
      if (val.error) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message:
            "Error details (error object) should not be provided when success is true.",
          path: ["error"],
        });
      }
    }
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
 * Schema for geographic coordinates
 */
export const GeoCoordinatesSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
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

/**
 * Pagination options
 */
export const PaginationSchema = z.object({
  pageToken: z.string().optional(),
  pageSize: z.number().int().positive().max(1000).default(50),
  maxItems: z.number().int().positive().optional(),
});

// Export TypeScript type definitions derived from the schemas
export type DateRange = z.infer<typeof DateRangeSchema>;
export type GeoCoordinates = z.infer<typeof GeoCoordinatesSchema>;
export type Address = z.infer<typeof AddressSchema>;
export type Money = z.infer<typeof MoneySchema>;
export type Id = z.infer<typeof IdSchema>;
export type Location = z.infer<typeof LocationSchema>;
export type Pagination = z.infer<typeof PaginationSchema>;
export type PaginationParams = z.infer<typeof PaginationParamsSchema>;
export type PaginationMeta = z.infer<typeof PaginationMetaSchema>;

export type StandardMetadata = z.infer<typeof StandardMetadataSchema>;
export type StandardErrorDetail = z.infer<typeof StandardErrorDetailSchema>;
export type ApiResponse = z.infer<typeof ApiResponseSchema>;

/**
 * Generic type for the consolidated API response.
 * Provides type safety for 'data' and 'error' fields based on 'success' status.
 */
export type ConsolidatedApiResponse<T = unknown> =
  | { success: true; data?: T; error?: never; metadata?: StandardMetadata }
  | {
      success: false;
      data?: never;
      error: StandardErrorDetail;
      metadata?: StandardMetadata;
    };

/**
 * STANDARD API RESPONSE TYPE - Used by ALL Lambda functions
 * 
 * Generic type that provides type safety for all API responses.
 * Ensures consistent error handling and human-readable error messages.
 */
export type StandardApiResponse<T = unknown> =
  | {
      success: true;
      data?: T;
      error?: never;
      metadata?: {
        requestId: string;
        timestamp: string;
        processingTimeMs?: number;
        pagination?: PaginationMeta;
      };
    }
  | {
      success: false;
      data?: never;
      error: {
        message: string; // Human-readable error message for UI display
        code?: string; // Application-specific error code
        details?: unknown; // Additional error context (not shown to users)
      };
      metadata?: {
        requestId: string;
        timestamp: string;
        processingTimeMs?: number;
        pagination?: PaginationMeta;
      };
    };
