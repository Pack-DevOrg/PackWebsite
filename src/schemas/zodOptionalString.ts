/**
 * Clean Zod utility for optional string fields in forms
 * Transforms empty strings to undefined so they're treated as "not provided"
 * instead of triggering validation errors
 */

import { z } from 'zod';

/**
 * Creates an optional string field that transforms empty strings to undefined
 * This is the clean solution for HTML form fields that send "" instead of undefined
 * 
 * @param schema - The string schema with validation rules
 * @returns A schema that treats empty strings as undefined (not provided)
 */
export function optionalString<T extends z.ZodString>(schema: T) {
  return z
    .union([schema, z.literal(""), z.null()])
    .transform((value: string | null) => {
      if (value === "" || value === null) return undefined;
      return value;
    })
    .optional();
}

/**
 * Pre-configured optional string schemas for common use cases
 */
export const optionalStringSchemas = {
  name: () => optionalString(z.string().min(1, "Name cannot be empty").max(100)),
  email: () => optionalString(z.string().email("Please enter a valid email")),
  phone: () => optionalString(z.string().min(1, "Phone number cannot be empty")),
  text: (minLength = 1, maxLength = 1000, message = "Field cannot be empty") => 
    optionalString(z.string().min(minLength, message).max(maxLength)),
};