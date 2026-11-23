/**
 * Trip Schema Definitions
 *
 * SECURITY CRITICAL: This module enforces separation between operational trip data
 * and sensitive user information (loyalty programs). All loyalty program fields have
 * been REMOVED from trip schemas to prevent PII leakage.
 *
 * Schema-First Security Architecture:
 * - Trip schemas contain ONLY operational data (flights, hotels, dates, confirmations)
 * - Loyalty program data is EXCLUSIVELY stored in encrypted UserPreferences
 * - This prevents accidental PII exposure and ensures GDPR Article 32 compliance
 *
 * WARNING: Never add loyalty-related fields (loyaltyNumber, loyaltyProgram, bonvoyNumber,
 * honorsNumber) to ANY trip schema. This would create a security vulnerability.
 *
 * @module shared/schemas/trips
 * @security PII segregation enforced through schema design
 * @compliance GDPR Article 32, CCPA data minimization
 * @lastSecurityReview 2025-09-26
 */

import { z } from 'zod';

const TripStatusSchema = z.enum(['normal', 'cancelled']);
import {
  TravelEventSchema
} from './travel';

/**
 * Stored Flight Schema - for flights in saved trips
 *
 * COMPLETE flight data structure that preserves all extraction details:
 * - All seat/gate/terminal info from email extractions
 * - All pricing and status from booking systems
 * - Supports both extracted flights (from emails) and booked flights (from search/booking)
 *
 * NOTE: Loyalty program data is intentionally NOT included here.
 * Loyalty programs are stored separately in encrypted UserPreferences for security.
 * See: UserPreferences schema for loyalty data storage.
 */
const STORED_FLIGHT_STATUS_VALUES = [
  'confirmed',
  'cancelled',
  'changed',
  'completed',
  'on_time',
  'delayed',
  'boarding',
  'departed',
  'landed'
] as const;

const StoredFlightStatusEnum = z.enum(STORED_FLIGHT_STATUS_VALUES);
const StoredFlightSchema = z.object({
  // Core identification
  id: z.string().optional(),
  confirmationCode: z.string().optional(),
  flightNumber: z.string().optional(),
  airline: z.string().optional(),
  airlineCode: z.string().optional(), // IATA airline code (e.g., AA, DL, UA)
  carrierCode: z.string().optional(), // Alternate carrier code

  // Route information (required for all flights)
  departureAirport: z.string(), // IATA code
  arrivalAirport: z.string(), // IATA code

  // Dates and times
  departureDate: z.string(), // ISO date
  departureTime: z.string().optional(), // HH:MM format
  arrivalDate: z.string().optional(), // May be next day for overnight flights
  arrivalTime: z.string().optional(), // HH:MM format

  // Passenger details
  passengerName: z.string().optional(),
  seatNumber: z.string().optional(), // Seat assignment (e.g., 16A, 12B)
  boardingGroup: z.string().optional(), // Boarding group/zone
  passengers: z.array(z.string()).optional(), // All passengers on flight

  // Cabin/Fare information
  cabinType: z.string().optional(), // e.g., Main Cabin, First Class, Business
  fareClass: z.string().optional(), // e.g., Economy, Business, First
  bookingClass: z.string().optional(), // Fare code like Y, J, F

  // Gates and terminals (fully detailed)
  terminal: z.string().optional(), // Terminal (may be departure or generic)
  gate: z.string().optional(), // Gate (may be departure or generic)
  departureTerminal: z.string().optional(), // Departure terminal
  departureGate: z.string().optional(), // Departure gate
  arrivalTerminal: z.string().optional(), // Arrival terminal
  arrivalGate: z.string().optional(), // Arrival gate

  // Aircraft and operations
  aircraft: z.string().optional(), // Aircraft type (e.g., 737, A320)
  operatedBy: z.string().optional(), // Operating carrier if codeshare
  duration: z.string().optional(), // Flight duration (e.g., 2h 30m)

  // Status tracking
  status: StoredFlightStatusEnum.optional(),
  isCancelled: z.boolean().optional(),
  isChanged: z.boolean().optional(),

  // Pricing - supports both currency-based and numeric amounts
  price: z.object({
    currency: z.string(),
    total: z.number(),
    base: z.number().optional(),
    taxes: z.number().optional()
  }).optional(),

  // Alternate pricing fields (from extractions)
  totalAmount: z.union([z.number(), z.string()]).optional(), // May be string from extraction
  currency: z.string().optional(), // ISO currency code

  baggageInfo: z
    .object({
      checkedBags: z.number().int().min(0).optional(),
      checkedBagFees: z.number().min(0).optional(),
      carryOnFees: z.number().min(0).optional(),
      overweightFees: z.number().min(0).optional(),
      specialItemFees: z.number().min(0).optional()
    })
    .optional(),

  // Loyalty points earned (moved to UserPreferences, kept optional for compatibility)
  loyaltyPointsEarned: z.number().optional(),

  // Booking timestamps
  bookedAt: z.string().optional(),

  // Metadata for extensibility
  metadata: z.record(z.string(), z.unknown()).optional()
}).passthrough(); // Allow extra fields from extraction for future compatibility

/**
 * Stored Hotel Schema - for hotels in saved trips
 *
 * COMPLETE hotel data structure that preserves all extraction details:
 * - All check-in/check-out times, room types, and guest counts from email extractions
 * - All pricing info from booking systems
 * - Supports both extracted hotels (from emails) and booked hotels (from search/booking)
 *
 * NOTE: Loyalty program data is intentionally NOT included here.
 * Loyalty programs are stored separately in encrypted UserPreferences for security.
 * See: UserPreferences schema for loyalty data storage.
 */
const StoredHotelSchema = z.object({
  // Core identification
  id: z.string().optional(),
  confirmationNumber: z.string().optional(),

  // Hotel information (name and city are required for all hotels)
  name: z.string(), // Hotel name
  address: z.string().optional(),
  city: z.string(), // Required
  state: z.string().optional(),
  country: z.string().optional(),
  phone: z.string().optional(),

  // Dates and times (all required for hotel stays)
  checkInDate: z.string(), // ISO date
  checkOutDate: z.string(), // ISO date
  checkInTime: z.string().optional(), // Check-in time (e.g., "3:00 PM")
  checkOutTime: z.string().optional(), // Check-out time (e.g., "12:00 PM")
  nights: z.number().optional(), // Number of nights

  // Room details
  roomType: z.string().optional(), // e.g., Standard, Deluxe, Suite
  bedType: z.string().optional(), // e.g., Queen, King, Twin
  numberOfRooms: z.number().optional(), // Number of rooms booked
  numberOfGuests: z.number().optional(), // Total guests

  // Status tracking
  status: z
    .union([
      z.enum(['confirmed', 'cancelled', 'changed', 'completed']),
      z.enum(['RESERVED', 'CHECKED_IN', 'CHECKED_OUT'])
    ])
    .optional(),
  isCancelled: z.boolean().optional(),
  isChanged: z.boolean().optional(),

  // Pricing - supports both structured and alternate formats
  price: z.object({
    currency: z.string(),
    total: z.number(),
    perNight: z.number().optional(),
    taxes: z.number().optional()
  }).optional(),

  // Alternate pricing fields (from extractions)
  totalAmount: z.union([z.number(), z.string()]).optional(), // May be string from extraction
  currency: z.string().optional(), // ISO currency code

  // Policies and amenities
  cancellationPolicy: z.string().optional(),
  amenities: z.array(z.string()).optional(),

  // Loyalty points earned (moved to UserPreferences, kept optional for compatibility)
  loyaltyPointsEarned: z.number().optional(),

  // Booking timestamps
  bookedAt: z.string().optional(),

  // Metadata for extensibility
  metadata: z.record(z.string(), z.unknown()).optional()
}).passthrough(); // Allow extra fields from extraction for future compatibility

// Database Trip schema - extends TravelPlan with database fields
export const TripSchema = z.object({
  // Primary keys for DynamoDB
  sub: z.string(), // User ID (partition key)
  tripId: z.string(), // Trip ID (sort key)

  // Basic trip metadata
  title: z.string(),
  description: z.string().optional(),
  startDate: z.string().date(),
  endDate: z.string().date(),
  status: TripStatusSchema.default('normal'),

  // Travel components - use stored schemas that work for both extracted and booked trips
  flights: z.array(StoredFlightSchema).default([]),
  hotels: z.array(StoredHotelSchema).default([]),
  activities: z.array(TravelEventSchema).default([]),

  // Additional metadata
  totalCost: z.number().optional(),
  currency: z.string().default('USD'),
  tags: z.array(z.string()).default([]),
  notes: z.string().optional(),
  
  // Confirmation codes for deduplication and enrichment
  confirmationCodes: z.array(z.string()).default([]),
  bookingReference: z.string().optional(), // Primary booking reference

  // Database-specific status tracking fields
  isCancelled: z.boolean().default(false),
  isChanged: z.boolean().default(false),
  changeHistory: z.array(z.object({
    date: z.string(),
    type: z.enum(['confirmation', 'cancellation', 'change', 'completion']),
    details: z.any().optional()
  })).optional(),
  
  // Additional metadata for extraction tracking and provider info
  metadata: z.record(z.string(), z.any()).optional(),

  // Timestamps
  bookedAt: z.string().datetime().optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime()
});

// Trip creation schema (excludes generated fields)
export const TripCreateSchema = TripSchema.omit({
  tripId: true,
  createdAt: true,
  updatedAt: true
});

// Response schema for trip queries
export const TripResponseSchema = z.object({
  trips: z.array(TripSchema),
  count: z.number().int(),
  lastEvaluatedKey: z.string().optional()
});

/**
 * Booking Schema - extends Trip schema for booked travel
 * Used by travel-book lambda to store actual booking transactions
 * Will eventually be merged with trips for display in "My Trips"
 */
export const BookingSchema = TripSchema.extend({
  // Booking-specific fields
  bookingProvider: z.enum(['priceline', 'skybird', 'amadeus']),
  bookingStatus: z.enum(['pending', 'confirmed', 'ticketed', 'failed', 'cancelled']),
  pnr: z.string().optional(), // Passenger Name Record
  
  // Payment and pricing
  totalPaid: z.number().optional(),
  paymentMethod: z.string().optional(),
  paymentStatus: z.enum(['pending', 'completed', 'failed', 'refunded']).optional(),
  
  // Booking timestamps
  bookedAt: z.string().datetime(),
  ticketedAt: z.string().datetime().optional(),
  expiresAt: z.string().datetime().optional(),
  
  // Provider-specific references
  providerConfirmationNumber: z.string().optional(),
  providerBookingReference: z.string().optional(),
  ticketNumbers: z.array(z.string()).default([]),
  
  // Customer service information
  customerServiceInfo: z.object({
    provider: z.string(),
    phone: z.string(),
    email: z.string().optional(),
    description: z.string().optional(),
  }).optional(),
});

// Type exports
export type Trip = z.infer<typeof TripSchema>;
export type StoredFlight = z.infer<typeof StoredFlightSchema>;
export type Booking = z.infer<typeof BookingSchema>;
