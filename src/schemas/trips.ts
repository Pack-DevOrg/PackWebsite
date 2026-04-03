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

export const TripStatusSchema = z.enum(['normal', 'cancelled']);
export type TripStatus = z.infer<typeof TripStatusSchema>;
import {
  TravelEventSchema
} from './travel';

// Re-export travel types we need
export {
  type TravelPlan,
  type TravelEvent
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
export const STORED_FLIGHT_STATUS_VALUES = [
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

export const StoredFlightStatusEnum = z.enum(STORED_FLIGHT_STATUS_VALUES);
export type StoredFlightStatus = z.infer<typeof StoredFlightStatusEnum>;

export const StoredFlightSchema = z.object({
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
export const StoredHotelSchema = z.object({
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

// Trip update schema (all fields optional except keys)
export const TripUpdateSchema = z.object({
  sub: z.string(),
  tripId: z.string(),
  title: z.string().optional(),
  description: z.string().optional(),
  startDate: z.string().date().optional(),
  endDate: z.string().date().optional(),
  status: TripStatusSchema.optional(),
  flights: z.array(StoredFlightSchema).optional(),
  hotels: z.array(StoredHotelSchema).optional(),
  activities: z.array(TravelEventSchema).optional(),
  totalCost: z.number().optional(),
  currency: z.string().optional(),
  tags: z.array(z.string()).optional(),
  notes: z.string().optional(),
  confirmationCodes: z.array(z.string()).optional(),
  bookingReference: z.string().optional(),
  bookedAt: z.string().datetime().optional(),
  updatedAt: z.string().datetime().optional()
});

// Query schema for filtering trips
export const TripQuerySchema = z.object({
  status: TripStatusSchema.optional(),
  startDate: z.string().date().optional(),
  endDate: z.string().date().optional(),
  limit: z.number().int().min(1).optional(), // Made optional, removed max limit to show all trips
  lastEvaluatedKey: z.string().optional()
});

// Response schema for trip queries
export const TripResponseSchema = z.object({
  trips: z.array(TripSchema),
  count: z.number().int(),
  lastEvaluatedKey: z.string().optional()
});

/**
 * Flight segment extracted from emails - simpler than FlightChunk
 * This is what parsers actually output
 */
export const ExtractedFlightSegmentSchema = z.object({
  flightNumber: z.string().optional(),
  airline: z.string().optional(),
  carrier: z.string().optional(),
  departureAirport: z.string().optional(),
  arrivalAirport: z.string().optional(),
  departureTime: z.string().optional(),
  arrivalTime: z.string().optional(),
  departureDate: z.string().optional(),
  arrivalDate: z.string().optional(),
  bookedAt: z.string().optional(),
  seatNumber: z.string().optional(),
  gate: z.string().optional(),
  terminal: z.string().optional(),
  status: z.string().optional(),
  
  // Additional structured fields
  departure: z.object({
    airport: z.string().optional(),
    date: z.string().optional(),
    time: z.string().optional(),
    terminal: z.string().optional(),
    gate: z.string().optional(),
  }).optional(),
  arrival: z.object({
    airport: z.string().optional(),
    date: z.string().optional(),
    time: z.string().optional(),
    terminal: z.string().optional(),
    gate: z.string().optional(),
  }).optional(),
  origin: z.string().optional(),
  destination: z.string().optional(),
  
  // Service & Comfort Fields - EXTRACTED FROM PRODUCTION EMAILS
  fareClass: z.string().optional(),        // "Economy Plus (T)"
  cabinType: z.string().optional(),        // "Economy Plus"
  aircraft: z.string().optional(),         // "Boeing 737-800"
  aircraftType: z.string().optional(),     // Alternative field name
  duration: z.string().optional(),         // "2h 23m"
  flightDuration: z.string().optional(),   // Alternative field name
  mealService: z.string().optional(),      // "Snack for purchase"
  
  // Operations Fields  
  operatedBy: z.string().optional(),       // "Mesa Airlines"
  bookingClass: z.string().optional(),     // "T"
  fareType: z.string().optional(),         // JetBlue uses this
  
  // Boarding Fields
  boardingGroup: z.string().optional(),    // "Group 2"
  boardingTime: z.string().optional(),     // "10:35 AM"
  seatType: z.string().optional(),         // "Window, Extra Legroom"
  checkInStatus: z.string().optional(),    // "Checked In"
  
  // Pricing fields (loyalty moved to UserPreferences)
  milesEarned: z.string().optional(),      // "1,234"
  segmentMiles: z.string().optional(),     // "1,234"
  
  // Baggage
  baggageAllowance: z.object({
    carryOn: z.string().optional(),
    checked: z.string().optional(),
    fees: z.object({
      firstBag: z.string().optional(),
      secondBag: z.string().optional(),
      carryOnFree: z.boolean().optional(),
    }).optional()
  }).optional(),
  
  // Status & Upgrades
  upgrades: z.array(z.string()).optional(), // ["First Class Available"]
  specialRequests: z.array(z.string()).optional(), // ["Wheelchair assistance"]
});

/**
 * Hotel booking extracted from emails - simpler than HotelChunk
 * This is what parsers actually output
 */
export const ExtractedHotelBookingSchema = z.object({
  hotelName: z.string().optional(),
  checkInDate: z.string().optional(),
  checkOutDate: z.string().optional(),
  confirmationNumber: z.string().optional(),
  roomType: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  country: z.string().optional(),
  
  // Additional fields extracted from production emails
  numberOfNights: z.number().optional(),       // 3
  checkInTime: z.string().optional(),         // "3:00 PM"
  checkOutTime: z.string().optional(),        // "12:00 PM"
  guestName: z.string().optional(),           // "John Doe"
  
  // Hotel Details
  hotelAddress: z.string().optional(),        // Full address
  hotelPhone: z.string().optional(),          // "+1-555-1234"
  ratePlan: z.string().optional(),            // "AAA Rate", "Corporate Rate"
  
  // Pricing
  totalCost: z.string().optional(),           // "$450.00"
  perNightRate: z.string().optional(),        // "$150.00"
  taxes: z.string().optional(),               // "$45.00"
  currency: z.string().optional(),            // "USD"
  
  // Policies
  cancellationPolicy: z.string().optional(),  // "Free cancellation until..."
  guaranteeMethod: z.string().optional(),     // "Credit Card"
  
  // Loyalty Programs removed - moved to UserPreferences
  
  // Contact & Management
  contactInfo: z.object({
    phone: z.string().optional(),
    email: z.string().optional(),
  }).optional(),
  manageBookingUrl: z.string().optional(),    // Link to manage booking
  modificationUrl: z.string().optional(),     // Link to modify
  
  // Additional Services
  specialServices: z.array(z.string()).optional(), // ["Early check-in", "Airport shuttle"]
  specialRequests: z.array(z.string()).optional(), // ["High floor", "Away from elevator"]
  additionalServices: z.object({
    parking: z.string().optional(),
    housekeeping: z.string().optional(),
    other: z.array(z.string()).optional(),
  }).optional(),
  
  // Payment Details
  paymentDetails: z.object({
    cardType: z.string().optional(),         // "Visa"
    lastFourDigits: z.string().optional(),   // "1234"
    amount: z.string().optional(),           // "$450.00"
    currency: z.string().optional(),         // "USD"
  }).optional(),
  
  // Room Details
  numberOfRooms: z.number().optional(),       // 1
  guestsPerRoom: z.number().optional(),       // 2
  bookedAt: z.string().optional(),
});

/**
 * Car rental extracted from emails
 * This is what parsers actually output
 */
export const ExtractedCarRentalSchema = z.object({
  confirmationNumber: z.string().optional(),
  provider: z.string().optional(),            // "Avis", "Hertz", "Enterprise"
  
  // Pickup Details
  pickupLocation: z.object({
    name: z.string().optional(),
    address: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    zipCode: z.string().optional(),
    country: z.string().optional(),
    phone: z.string().optional(),
    code: z.string().optional(),             // Airport code or location code
  }).optional(),
  pickupDateTime: z.string().optional(),
  
  // Dropoff Details
  dropoffLocation: z.object({
    name: z.string().optional(),
    address: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    zipCode: z.string().optional(),
    country: z.string().optional(),
    phone: z.string().optional(),
    code: z.string().optional(),
    sameAsPickup: z.boolean().optional(),
  }).optional(),
  dropoffDateTime: z.string().optional(),
  
  // Rental Details
  rentalDays: z.number().optional(),
  vehicleDetails: z.object({
    category: z.string().optional(),         // "Economy", "Midsize", "SUV"
    model: z.string().optional(),            // "Toyota Corolla or similar"
    type: z.string().optional(),             // "4-door sedan"
    features: z.array(z.string()).optional(), // ["Automatic", "AC", "Bluetooth"]
  }).optional(),
  
  // Renter Information
  renter: z.object({
    name: z.string().optional(),
    email: z.string().optional(),
    // loyaltyNumber removed - moved to UserPreferences
    driversLicense: z.string().optional(),
  }).optional(),
  
  // Pricing
  pricing: z.object({
    dailyRate: z.string().optional(),
    totalRate: z.string().optional(),
    baseRate: z.string().optional(),
    taxes: z.string().optional(),
    fees: z.string().optional(),
    totalAmount: z.string().optional(),
    currency: z.string().optional(),
    rateCode: z.string().optional(),
  }).optional(),
  
  // Policies
  policies: z.object({
    fuelPolicy: z.string().optional(),
    cancellationPolicy: z.string().optional(),
    ageRequirements: z.string().optional(),
  }).optional(),
});

/**
 * Extracted booking data schema - what parsers actually output
 * This is the common format all parsers should use
 */
export const ExtractedBookingDataSchema = z.object({
  provider: z.string(),
  type: z.enum(['flight', 'hotel', 'car', 'activity']),
  confirmationCode: z.string().optional(),
  passengerName: z.string().optional(),
  flights: z.array(ExtractedFlightSegmentSchema).optional(),
  hotels: z.array(ExtractedHotelBookingSchema).optional(),
  carRentals: z.array(ExtractedCarRentalSchema).optional(), // Added car rentals
  seatNumber: z.string().optional(),
  ticketNumber: z.string().optional(),
  ttn: z.string().optional(), // Trusted Traveler Number
  metadata: z.record(z.string(), z.unknown()).optional(),
});

/**
 * Parser result schema - ensures all parsers return consistent structure
 */
export const ParserResultSchema = z.object({
  confirmationCode: z.string(),
  provider: z.string(),
  type: z.enum(['flight', 'hotel', 'car_rental', 'government', 'activity']),
  rawData: z.record(z.string(), z.unknown()).optional(),
  // Extended fields from extraction (loyalty data moved to UserPreferences)
  passengerName: z.string().optional(),
  flights: z.array(ExtractedFlightSegmentSchema).optional(),
  hotels: z.array(ExtractedHotelBookingSchema).optional(),
  carRentals: z.array(ExtractedCarRentalSchema).optional(), // Added car rentals
  seatNumber: z.string().optional(),
  ticketNumber: z.string().optional(),
  ttn: z.string().optional(),
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

// Booking creation schema (excludes generated fields)
export const BookingCreateSchema = BookingSchema.omit({
  tripId: true, // Will use bookingId instead
  createdAt: true,
  updatedAt: true
});

// Booking update schema
export const BookingUpdateSchema = z.object({
  sub: z.string(),
  bookingId: z.string(),
  bookingStatus: z.enum(['pending', 'confirmed', 'ticketed', 'failed', 'cancelled']).optional(),
  pnr: z.string().optional(),
  paymentStatus: z.enum(['pending', 'completed', 'failed', 'refunded']).optional(),
  ticketedAt: z.string().datetime().optional(),
  ticketNumbers: z.array(z.string()).optional(),
  updatedAt: z.string().datetime().optional()
});

// Type exports
export type Trip = z.infer<typeof TripSchema>;
export type TripCreate = z.infer<typeof TripCreateSchema>;
export type TripUpdate = z.infer<typeof TripUpdateSchema>;
export type TripQuery = z.infer<typeof TripQuerySchema>;
export type TripResponse = z.infer<typeof TripResponseSchema>;
export type StoredFlight = z.infer<typeof StoredFlightSchema>;
export type StoredHotel = z.infer<typeof StoredHotelSchema>;
export type ExtractedFlightSegment = z.infer<typeof ExtractedFlightSegmentSchema>;
export type ExtractedHotelBooking = z.infer<typeof ExtractedHotelBookingSchema>;
export type ExtractedCarRental = z.infer<typeof ExtractedCarRentalSchema>;
export type ExtractedBookingData = z.infer<typeof ExtractedBookingDataSchema>;
export type ParserResult = z.infer<typeof ParserResultSchema>;
export type Booking = z.infer<typeof BookingSchema>;
export type BookingCreate = z.infer<typeof BookingCreateSchema>;
export type BookingUpdate = z.infer<typeof BookingUpdateSchema>;

// ==========================================================================
// Schema-Safe Defaults Factory for Trips
// ==========================================================================

/**
 * ✅ SCHEMA-DRIVEN: Automatic defaults generation from schema definitions
 * Uses Zod's built-in parsing with embedded defaults - no manual value maintenance
 */
export function createSchemaTripDefaults(sub: string, tripId: string, title: string = 'New Trip'): Trip {
  const now = new Date().toISOString();
  const today = new Date().toISOString().split('T')[0]; // ISO date format (YYYY-MM-DD)
  
  // ✅ AUTOMATIC: Zod parses partial data and applies nested schema defaults
  const schemaDefaults = TripSchema.parse({
    sub,
    tripId,
    title,
    startDate: today,
    endDate: today,
    createdAt: now,
    updatedAt: now,
    // All other fields will use their schema defaults:
    // status: 'normal' (default)
    // flights: [] (default)
    // hotels: [] (default) 
    // activities: [] (default)
    // currency: 'USD' (default)
    // tags: [] (default)
    // confirmationCodes: [] (default)
    // isCancelled: false (default)
    // isChanged: false (default)
  });
  
  return schemaDefaults;
}

/**
 * EMERGENCY: Minimal trip defaults for catastrophic failure scenarios
 */
export function createEmergencyTripDefaults(sub: string, tripId: string): Trip {
  const now = new Date().toISOString();
  const today = new Date().toISOString().split('T')[0];
  
  return {
    sub,
    tripId,
    title: 'Trip',
    description: undefined,
    startDate: today,
    endDate: today,
    status: 'normal',
    flights: [],
    hotels: [],
    activities: [],
    totalCost: undefined,
    currency: 'USD',
    tags: [],
    notes: undefined,
    confirmationCodes: [],
    bookingReference: undefined,
    isCancelled: false,
    isChanged: false,
    changeHistory: undefined,
    metadata: undefined,
    createdAt: now,
    updatedAt: now
  };
}
