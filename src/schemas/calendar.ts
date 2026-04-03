/**
 * Calendar Schema Definitions
 * 
 * Centralized calendar schemas used across all calendar-related services.
 * 
 * @module shared/schemas/calendar
 */

import { z } from 'zod';
import { ApiResponseSchema, DateRangeSchema, TokenProvider } from './common';
import { PaginationSchema } from './common';

/**
 * Timezone normalization result schema
 */
export const TimezoneNormalizationSchema = z.object({
    timezone: z.string(),      // IANA timezone identifier (e.g., 'America/New_York')
    offset: z.string(),       // UTC offset (e.g., '-05:00')
    abbreviation: z.string(), // Timezone abbreviation (e.g., 'EST')
    isDST: z.boolean(),       // Whether DST is in effect
    confidence: z.number().min(0).max(1), // Confidence in timezone normalization
    source: z.enum(['explicit', 'inferred', 'default'])
});

/**
 * Calendar event attendee schema
 */
export const CalendarAttendeeSchema = z.object({
    email: z.string().email(),
    name: z.string().optional(),
    status: z.enum(['accepted', 'declined', 'tentative', 'needsAction']).optional(),
    organizer: z.boolean().default(false),
});

/**
 * Calendar event schema with enhanced timezone support
 */
export const CalendarEventSchema = z.object({
    id: z.string(),
    provider: z.nativeEnum(TokenProvider),
    summary: z.string().default(''),
    description: z.string().optional(),
    location: z.string().optional(),
    startTime: z.string().datetime(), // Should include timezone info
    endTime: z.string().datetime(),   // Should include timezone info
    isAllDay: z.boolean().default(false),
    timezone: z.string().default('UTC'), // Now required with UTC default
    timezoneNormalized: TimezoneNormalizationSchema.optional(), // Normalized timezone info when available
    status: z.enum(['confirmed', 'tentative', 'cancelled']).default('confirmed'),
    attendees: z.array(CalendarAttendeeSchema).default([]),
    organizer: CalendarAttendeeSchema.optional(),
    recurrence: z.array(z.string()).optional(),
    visibility: z.enum(['default', 'public', 'private', 'confidential']).default('default'),
    calendarId: z.string().optional(),
});

/**
 * Calendar search parameters
 */
export const CalendarSearchParamsSchema = z.object({
    searchTerms: z.array(z.string()).optional(),
    summary: z.string().optional(),
    location: z.string().optional(),
    attendeeEmail: z.string().email().optional(),
    startDate: z.string().date().optional(),
    endDate: z.string().date().optional(),
    calendarIds: z.array(z.string()).optional(),
    status: z.enum(['confirmed', 'tentative', 'cancelled']).optional(),
    showDeleted: z.boolean().default(false),
    maxResults: z.number().int().positive().max(1000).default(25),
    contentReduction: z.enum(['full', 'minimal', 'llm-optimized']).default('llm-optimized'),
}).refine(
    data => {
        // Must have either search terms OR date range or other search criteria
        const hasSearchTerms = data.searchTerms && data.searchTerms.length > 0;
        const hasDateRange = data.startDate && data.endDate;
        const hasOtherCriteria = data.summary || data.location || data.attendeeEmail;
        return hasSearchTerms || hasDateRange || hasOtherCriteria;
    },
    {
        message: "Must provide search terms, date range, or other search criteria",
        path: ["searchTerms"]
    }
).refine(
    data => {
        // If both dates provided, validate order
        if (data.startDate && data.endDate) {
            return new Date(data.startDate) <= new Date(data.endDate);
        }
        return true;
    },
    {
        message: "End date must be after start date",
        path: ["endDate"]
    }
);

/**
 * Calendar fetch request schema
 */
export const CalendarFetchRequestSchema = z.object({
    searchParams: CalendarSearchParamsSchema,
    providers: z.array(z.nativeEnum(TokenProvider)).optional(),
    pagination: PaginationSchema.optional(),
    correlationId: z.string().optional(),
});

/**
 * Calendar fetch response schema
 */
export const CalendarFetchResponseSchema = ApiResponseSchema.extend({
    events: z.array(CalendarEventSchema).default([]),
    nextPageTokens: z.record(z.string(), z.string()).optional(),
    totalCount: z.number().int().nonnegative().optional(),
    processingTimeMs: z.number().int().nonnegative().optional(),
});

// Type exports
export type TimezoneNormalization = z.infer<typeof TimezoneNormalizationSchema>;
export type CalendarAttendee = z.infer<typeof CalendarAttendeeSchema>;
export type CalendarEvent = z.infer<typeof CalendarEventSchema>;
export type CalendarSearchParams = z.infer<typeof CalendarSearchParamsSchema>;
export type CalendarFetchRequest = z.infer<typeof CalendarFetchRequestSchema>;
export type CalendarFetchResponse = z.infer<typeof CalendarFetchResponseSchema>;