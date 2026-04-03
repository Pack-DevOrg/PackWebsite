/**
 * Travel Planner Schema Definitions - Enhanced for Amadeus Integration
 *
 * Centralized travel schemas used across all travel-related services.
 * Updated to capture comprehensive flight and hotel data from Amadeus APIs.
 * Fixed to match backend response structure and uses only real common schemas.
 *
 * @module shared/schemas/travel
 */

import { z } from "zod";
import {
  GeoCoordinatesSchema,
  StandardMetadataSchema,
  PaginationSchema,
  StandardApiResponseSchema,
  type GeoCoordinates,
  type Address,
  type Money,
  type StandardMetadata,
  type StandardApiResponse,
  type Id,
  type Pagination,
} from "./common";
import { TimezoneNormalizationSchema } from "./calendar";
import {
  AirlineLoyaltyProgramSchema,
  HotelLoyaltyProgramSchema,
  TravelerProfileSchema,
  type AirlineLoyaltyProgram,
  type HotelLoyaltyProgram,
} from "./travel-preferences";

// ==========================================================================
// IATA Code Validation
// ==========================================================================

/**
 * IATA airport code schema with validation
 * Uses basic format validation - full airport validation should be done in business logic
 */
export const IATACodeSchema = z.string()
  .length(3, "IATA code must be exactly 3 characters")
  .regex(/^[A-Za-z]{3}$/, "IATA code must contain only letters")
  .transform(str => str.toUpperCase());

/**
 * City or IATA code schema - accepts either a city name or IATA code
 */
export const CityOrIATASchema = z.string()
  .min(2, "City name or IATA code must be at least 2 characters")
  .max(50, "City name or IATA code must be at most 50 characters")
  .transform(str => str.trim());

// ==========================================================================
// Email Extraction Result Schema
// ==========================================================================

/**
 * Travel email extraction result schema
 * Used by the travel extraction pipeline to represent extracted travel data
 */
const ExtractionTrustedTravelerSchema = z.object({
  knownTravelerNumber: z.string().optional(),
  redressNumber: z.string().optional()
}).passthrough();

const ExtractionLoyaltyProgramSchema = z.object({
  programName: z.string().optional(),
  memberNumber: z.string().optional(),
  memberName: z.string().optional(),
  status: z.string().optional(),
  tier: z.string().optional(),
  statusExpiration: z.string().optional(),
  pointsBalance: z.union([z.number(), z.string()]).optional(),
  rawPointsBalance: z.string().optional(),
  provider: z.string().optional(),
  airline: z.string().optional(),
  hotel: z.string().optional(),
  type: z.string().optional(),
  frequency: z.number().optional(),
  isMasked: z.boolean().optional(),
  sources: z.array(z.string()).optional()
}).passthrough();

const ExtractionFlightSchema = z.object({
  airline: z.string().optional(),
  carrier: z.string().optional(),
  flightNumber: z.string().optional(),
  confirmationCode: z.string().optional(),
  departureAirport: z.string().optional(),
  arrivalAirport: z.string().optional(),
  departureDate: z.string().optional(),
  arrivalDate: z.string().optional(),
  departureTime: z.string().optional(),
  arrivalTime: z.string().optional(),
  bookedAt: z.string().optional(),
  cabinType: z.string().optional(),
  fareClass: z.string().optional(),
  bookingClass: z.string().optional(),
  seatNumber: z.string().optional(),
  passengers: z.array(z.string()).optional(),
  passengerName: z.string().optional(),
  boardingGroup: z.string().optional(),
  boardingTime: z.string().optional(),
  seatType: z.string().optional(),
  checkInStatus: z.string().optional(),
  status: z.string().optional(),
  isCancelled: z.boolean().optional(),
  isChanged: z.boolean().optional(),
  terminal: z.string().optional(),
  gate: z.string().optional(),
  departureTerminal: z.string().optional(),
  departureGate: z.string().optional(),
  arrivalTerminal: z.string().optional(),
  arrivalGate: z.string().optional(),
  origin: z.string().optional(),
  destination: z.string().optional(),
  duration: z.string().optional(),
  flightDuration: z.string().optional(),
  operatedBy: z.string().optional(),
  aircraft: z.string().optional(),
  aircraftType: z.string().optional(),
  fareType: z.string().optional(),
  loyaltyProgram: z.string().optional(),
  loyaltyNumber: z.string().optional(),
  loyaltyPointsEarned: z.union([z.number(), z.string()]).optional(),
  milesEarned: z.string().optional(),
  segmentMiles: z.string().optional(),
  totalAmount: z.union([z.number(), z.string()]).optional(),
  currency: z.string().optional(),
  baggageAllowance: z.object({
    carryOn: z.string().optional(),
    checked: z.string().optional(),
    fees: z.object({
      firstBag: z.string().optional(),
      secondBag: z.string().optional(),
      carryOnFree: z.boolean().optional()
    }).optional()
  }).optional(),
  upgrades: z.array(z.string()).optional(),
  specialRequests: z.array(z.string()).optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
  departure: z.object({
    airport: z.string().optional(),
    date: z.string().optional(),
    time: z.string().optional(),
    terminal: z.string().optional(),
    gate: z.string().optional()
  }).optional(),
  arrival: z.object({
    airport: z.string().optional(),
    date: z.string().optional(),
    time: z.string().optional(),
    terminal: z.string().optional(),
    gate: z.string().optional()
  }).optional()
}).passthrough();

const ExtractionHotelSchema = z.object({
  hotelName: z.string().optional(),
  name: z.string().optional(),
  confirmationNumber: z.string().optional(),
  confirmationCode: z.string().optional(),
  address: z.string().optional(),
  hotelAddress: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  country: z.string().optional(),
  phone: z.string().optional(),
  hotelPhone: z.string().optional(),
  checkInDate: z.string().optional(),
  checkOutDate: z.string().optional(),
  checkInTime: z.string().optional(),
  checkOutTime: z.string().optional(),
  numberOfNights: z.number().optional(),
  nights: z.number().optional(),
  roomType: z.string().optional(),
  bedType: z.string().optional(),
  numberOfRooms: z.number().optional(),
  numberOfGuests: z.number().optional(),
  guestsPerRoom: z.number().optional(),
  guestName: z.string().optional(),
  guests: z.array(z.string()).optional(),
  status: z.string().optional(),
  isCancelled: z.boolean().optional(),
  isChanged: z.boolean().optional(),
  totalCost: z.union([z.number(), z.string()]).optional(),
  perNightRate: z.union([z.number(), z.string()]).optional(),
  taxes: z.union([z.number(), z.string()]).optional(),
  currency: z.string().optional(),
  loyaltyProgram: z.string().optional(),
  loyaltyNumber: z.string().optional(),
  loyaltyPointsEarned: z.union([z.number(), z.string()]).optional(),
  ratePlan: z.string().optional(),
  cancellationPolicy: z.string().optional(),
  amenities: z.array(z.string()).optional(),
  specialServices: z.array(z.string()).optional(),
  specialRequests: z.array(z.string()).optional(),
  additionalServices: z.record(z.string(), z.unknown()).optional(),
  contactInfo: z.object({
    phone: z.string().optional(),
    email: z.string().optional()
  }).optional(),
  manageBookingUrl: z.string().optional(),
  modificationUrl: z.string().optional(),
  metadata: z.record(z.string(), z.unknown()).optional()
}).passthrough();

export const ExtractionResultSchema = z.object({
  emailId: z.string(),
  confirmationCode: z.string().optional(),
  provider: z.string().optional(),
  providerSlug: z.string().optional(),
  passengerName: z.string().optional(),
  type: z.enum(['flight', 'hotel', 'car', 'activity', 'government']).optional(),
  flight: ExtractionFlightSchema.optional(),
  hotel: ExtractionHotelSchema.optional(),
  carRental: z.record(z.string(), z.unknown()).optional(),
  loyaltyProgram: z.string().optional(),
  loyaltyNumber: z.string().optional(),
  loyaltyPrograms: z.array(ExtractionLoyaltyProgramSchema).optional(),
  flights: z.array(ExtractionFlightSchema).optional(),
  hotels: z.array(ExtractionHotelSchema).optional(),
  carRentals: z.array(z.record(z.string(), z.unknown())).optional(),
  needsSupplementalData: z.boolean().optional(),
  hasIncompleteFlightData: z.boolean().optional(),
  supplementalReason: z.string().optional(),
  supplementalFields: z.array(z.string()).optional(),
  totalAmount: z.union([z.number(), z.string()]).optional(),
  currency: z.string().optional(),
  marketingFlag: z.enum(['none', 'marketing']).optional(),
  isMarketing: z.boolean().optional(),
  trustedTraveler: ExtractionTrustedTravelerSchema.optional(),
  debug: z.object({
    rawXml: z.string().optional(),
    rawResult: z.unknown().optional(),
    augmentedXml: z.string().optional(),
    augmentedParsed: z.unknown().optional()
  }).optional()
}).passthrough();

export type ExtractionResult = z.infer<typeof ExtractionResultSchema>;

// ==========================================================================
// User Profile Data Schemas - Top-Level Entities
// ==========================================================================

/**
 * Trusted Traveler Program Extraction Schema
 *
 * Uses the existing TravelerProfileSchema.travelDocuments.trustedTraveler structure
 * from travel-preferences.ts for consistency. This is the extraction wrapper that
 * adds metadata for tracking.
 */
export const TrustedTravelerDataSchema = TravelerProfileSchema.shape.travelDocuments
  .removeDefault() // Remove default wrapper to access underlying object schema
  .shape.trustedTraveler
  .removeDefault() // Remove default wrapper to access underlying object schema
  .extend({
    // Add extraction metadata
    lastSeenInEmail: z.string(), // Email ID where this was extracted
    extractedAt: z.string(), // ISO timestamp when extracted
  });

export type TrustedTravelerData = z.infer<typeof TrustedTravelerDataSchema>;

/**
 * Parallel Extraction Output Schema
 *
 * Represents the complete output from email extraction with parallel systems:
 * - System 1: Trip-specific data (flights, hotels, confirmations)
 * - System 2: User profile data (loyalty programs, trusted traveler status)
 *
 * Design Philosophy:
 * - Extraction should identify BOTH trips AND user profile data in parallel
 * - Trips go to UserTrips table
 * - User profile data goes to UserPreferences table
 * - Uses existing AirlineLoyaltyProgramSchema and HotelLoyaltyProgramSchema for consistency
 * - No data transformation or inference needed - direct storage
 */
export const ParallelExtractionOutputSchema = z.object({
  // System 1: Trip extraction (time-bounded events)
  trips: z.array(ExtractionResultSchema),

  // System 2: User profile extraction (persistent user attributes)
  // Using existing schemas from travel-preferences.ts for consistency
  airlineLoyaltyPrograms: z.array(AirlineLoyaltyProgramSchema).default([]),
  hotelLoyaltyPrograms: z.array(HotelLoyaltyProgramSchema).default([]),
  trustedTravelerData: TrustedTravelerDataSchema.optional(),

  // Overall extraction metadata
  extractionTimestamp: z.string(), // ISO timestamp
  emailsProcessed: z.number(), // Count of emails processed
  confidence: z.number().min(0).max(1).optional(), // Overall confidence
});

export type ParallelExtractionOutput = z.infer<typeof ParallelExtractionOutputSchema>;

// ==========================================================================
// Base Travel Event Schema
// ==========================================================================

/**
 * Event availability status during travel
 */
export const EventAvailabilityStatusSchema = z.enum([
  'available',        // Event is in the destination city - user can attend
  'unavailable',      // Event is elsewhere (home city, different city, or timing conflict) - user will miss it
  'uncertain'         // Event location unclear - needs user clarification
]);

/**
 * Flexible travel event address schema used for timeline events.
 * Allows partial address data because upstream sources often provide
 * incomplete details (e.g., missing postal code or country).
 */
export const TravelEventAddressSchema = z.object({
  street: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  postalCode: z.string().optional(),
  country: z.string().optional(),
});

/**
 * Base travel event schema with comprehensive context and timezone support
 * Now aligned with the unified event structure
 */
const BaseTravelEventSchema = z.object({
  // Core identification
  id: z.string(),
  type: z.enum(["calendar", "email", "web_search", "synthetic"]).default("calendar"),
  source: z.enum([
    "google",
    "microsoft",
    "web_search",
    "query",
    "local_calendar",
  ]).default("query"),
  
  // Event details
  title: z.string(), // Event name/title (unified field, was 'name')
  description: z.string().optional(),
  
  // Location information
  location: z.string().nullable().optional(), // Human-readable location (primary field)
  address: z.union([
    TravelEventAddressSchema,
    z.string(), // Raw address string when parsing structured data isn't possible
  ]).nullable().optional(),
  cityCode: z.string().optional(), // IATA city code
  cityName: z.string().optional(), // Human-readable city name
  
  // Timing information
  date: z.string().date().optional(), // Legacy field for backward compatibility
  time: z.string().optional(), // Legacy field for backward compatibility
  startDate: z.string().nullable().optional(), // ISO date (YYYY-MM-DD) - nullable for empty XML tags
  startTime: z.string().datetime({ offset: true }).nullable().optional(), // ISO datetime with timezone
  endDate: z.string().nullable().optional(), // ISO date (YYYY-MM-DD) - nullable for empty XML tags
  endTime: z.string().datetime({ offset: true }).nullable().optional(), // ISO datetime with timezone
  isAllDay: z.boolean().default(false),
  timezone: z.string().default('UTC'), // IANA timezone identifier
  timezoneNormalized: TimezoneNormalizationSchema.optional(), // Normalized timezone info
  
  // Event classification
  eventType: z.enum([
    "flight",
    "hotel",
    "meeting",
    "conference",
    "concert",
    "festival",
    "personal",
    "other"
  ]).default("other"),
  isPublic: z.boolean().default(false), // Public event vs private
  isAnchor: z.boolean().default(false), // Main event anchoring the trip
  
  // Additional metadata
  confidence: z.number().min(0).max(1).optional(), // Confidence in event details
  requiresTravel: z.boolean().optional(), // Whether event requires travel from home
  availabilityStatus: EventAvailabilityStatusSchema.optional(), // Whether user can attend
  
  // Original data reference
  originalData: z.record(z.string(), z.unknown()).optional(), // Original calendar/email/API response
});

// ==========================================================================
// Availability Analysis Schemas
// ==========================================================================

/**
 * Suggested travel window with confidence and reasoning
 */
export const SuggestedTravelWindowSchema = z.object({
  startDate: z.string().date(), // ISO date (YYYY-MM-DD)
  endDate: z.string().date(), // ISO date (YYYY-MM-DD)
  confidence: z.enum(['high', 'medium', 'low']), // Confidence in this suggestion
  reason: z.string(), // Human-readable reason (e.g., "3-day weekend available", "seasonal recommendation")
  durationDays: z.number().int().positive(), // Number of days in this window
  gapType: z.enum(['weekend', 'short_break', 'week_long', 'extended']).optional(), // Type of calendar gap
});

/**
 * Distance and travel analysis for a destination
 */
export const DistanceAnalysisSchema = z.object({
  travelDuration: z.string(), // Human-readable duration (e.g., "8-hour flight", "2-hour drive")
  travelMode: z.enum(['flight', 'drive', 'train', 'mixed']).optional(), // Primary travel mode
  recommendedStayLength: z.string(), // Recommended stay duration (e.g., "4-5 days minimum")
  accessibility: z.enum(['high', 'medium', 'low']), // How easy it is to reach
  distanceNotes: z.string().optional(), // Additional context about travel logistics
});

/**
 * Seasonal travel recommendations for a destination
 */
export const SeasonalRecommendationsSchema = z.object({
  bestMonths: z.array(z.string()), // Array of month names (e.g., ["March", "April", "May"])
  weatherNotes: z.string(), // Weather information (e.g., "Mild temperatures, low rainfall")
  crowdingNotes: z.string().optional(), // Tourist season info (e.g., "Shoulder season, fewer crowds")
  seasonalEvents: z.array(z.string()).default([]), // Notable seasonal events or festivals
  priceSeasonality: z.enum(['peak', 'shoulder', 'low']).optional(), // Price season indicator
});

/**
 * Comprehensive availability analysis for location-based queries without specific dates
 */
export const AvailabilityAnalysisSchema = z.object({
  analysisDate: z.string().datetime(), // When this analysis was performed
  suggestedWindows: z.array(SuggestedTravelWindowSchema), // Recommended travel windows
  distanceAnalysis: DistanceAnalysisSchema, // Travel logistics and duration analysis
  seasonalRecommendations: SeasonalRecommendationsSchema, // Best times to visit
  calendarGapsFound: z.number().int().nonnegative(), // Number of suitable calendar gaps identified
  analysisConfidence: z.enum(['high', 'medium', 'low']), // Overall confidence in analysis
  fallbackReason: z.string().optional(), // If analysis was limited, why (e.g., "Limited calendar access")
});

// Add availability analysis to the base schema
export const TravelEventSchema = BaseTravelEventSchema.extend({
  // Availability analysis for synthetic events without dates
  availabilityAnalysis: AvailabilityAnalysisSchema.optional(),
});

// ==========================================================================
// Travel Outline Schemas
// ==========================================================================

/**
 * Flight outline schema
 *
 * IMPORTANT: The `date` field represents the TARGET ARRIVAL DATE at the destination,
 * not the departure date. This aligns with user intent: "I want to arrive in Vegas on Nov 7th
 * for my hotel check-in." The flight search service handles the conversion by searching
 * flights departing on both the target date and the day before (to capture red-eye flights).
 */
export const FlightOutlineSchema = z.object({
  type: z.literal("flightOutline"),
  id: z.string(),
  origin: z.string(),
  destination: z.string(),
  date: z.string().date(), // Target ARRIVAL date (not departure!)
  earliestDeparture: z.string().optional(), // HH:MM format for preferred earliest departure time
  latestArrival: z.string().optional(), // HH:MM format for preferred latest arrival time
  alreadyBooked: z.boolean().default(false),
  sequenceId: z.number().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

/**
 * Hotel outline schema
 */
export const HotelOutlineSchema = z.object({
  type: z.literal("hotelOutline"),
  id: z.string(),
  location: z.string(),
  cityCode: z.string(), // Keep for event clustering and LLM output
  geoCode: z.array(GeoCoordinatesSchema).min(1).optional(), // Optional initially, added by outline generator
  nights: z.number().int().positive(),
  checkIn: z.string().date(),
  checkOut: z.string().date().optional(),
  eventList: z.array(TravelEventSchema).default([]),
  allEventsInDateRange: z.array(TravelEventSchema).default([]), // ALL events during travel period for context
  alreadyBooked: z.boolean().default(false),
  sequenceId: z.number().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

// ==========================================================================
// Flight Schemas (Amadeus Integration)
// ==========================================================================

/**
 * Aircraft information schema
 */
export const AircraftSchema = z.object({
  code: z.string(),
  name: z.string().optional(),
});

const CabinEnum = z.enum(["ECONOMY", "PREMIUM_ECONOMY", "BUSINESS", "FIRST"]);

const Co2EmissionSchema = z.object({
  weight: z.number(),
  weightUnit: z.string(),
  cabin: CabinEnum.optional(),
  efficiencyClass: z.string().optional(),
});

const AncillarySegmentSchema = z.object({
  segmentId: z.string(),
  cabin: CabinEnum.optional(),
  fareBasis: z.string().optional(),
  brandedFare: z.string().optional(),
  class: z.string().optional(),
});

const AncillaryPriceSchema = z.object({
  currency: z.string(),
  total: z.string(),
  base: z.string().optional(),
  taxes: z
    .array(
      z.object({
        amount: z.string(),
        code: z.string().optional(),
      })
    )
    .optional(),
});

const AncillaryServiceSchema = z.object({
  id: z.string().optional(),
  type: z.string(),
  segmentIds: z.array(z.string()).optional(),
  segments: z.array(AncillarySegmentSchema).optional(),
  travelerIds: z.array(z.string()).default([]),
  price: AncillaryPriceSchema,
  description: z.string().optional(),
});

// ==========================================================================
// Duffel Available Services Schemas
// ==========================================================================

/**
 * Duffel Available Service Metadata Schema
 * Contains additional information about the service (e.g., seat designator, baggage dimensions)
 */
export const DuffelServiceMetadataSchema = z.object({
  designator: z.string().optional(), // Seat designator like "14B"
  name: z.string().optional(), // Human-readable name like "Exit row seat"
  type: z.string().optional(), // Additional type info
  maximum_length: z.union([z.number(), z.string()]).optional(),
  maximum_height: z.union([z.number(), z.string()]).optional(),
  maximum_width: z.union([z.number(), z.string()]).optional(),
  maximum_weight: z.union([z.number(), z.string()]).optional(),
});

/**
 * Duffel Available Service Schema
 * Represents a single ancillary service (baggage, seat) with real pricing from Duffel API
 * @see https://duffel.com/docs/api/offers/get-available-services
 */
export const DuffelAvailableServiceSchema = z.object({
  id: z.string(),
  type: z.enum(['baggage', 'seat', 'cancel_for_any_reason', 'meal']),
  total_amount: z.string(),
  total_currency: z.string(),
  maximum_quantity: z.number().int().min(0).optional(),
  segment_ids: z.array(z.string()).optional(),
  passenger_ids: z.array(z.string()).optional(),
  metadata: DuffelServiceMetadataSchema.optional(),
});

/**
 * Duffel Available Services Response Schema
 * Response from GET /air/offers/{offer_id}/available_services
 */
export const DuffelAvailableServicesResponseSchema = z.object({
  data: z.object({
    services: z.array(DuffelAvailableServiceSchema),
  }),
});

export type DuffelServiceMetadata = z.infer<typeof DuffelServiceMetadataSchema>;
export type DuffelAvailableService = z.infer<typeof DuffelAvailableServiceSchema>;
export type DuffelAvailableServicesResponse = z.infer<typeof DuffelAvailableServicesResponseSchema>;

export const SeatAvailabilityCategorySchema = z.object({
  type: z.enum(['window', 'aisle', 'middle', 'extra_legroom', 'unknown']),
  count: z.number().int().nonnegative(),
  minPrice: z.number().nonnegative().optional(),
  maxPrice: z.number().nonnegative().optional(),
});

export const SeatAvailabilityCabinSchema = z.object({
  cabinClass: z.string(),
  seatTypes: z.array(SeatAvailabilityCategorySchema),
});

export const SeatAvailabilitySummarySchema = z.object({
  totalSeats: z.number().int().nonnegative(),
  categories: z.array(SeatAvailabilityCategorySchema),
  currency: z.string().length(3).optional(),
  cabins: z.array(SeatAvailabilityCabinSchema).optional(),
});

// ==========================================================================
// Duffel Accommodation (Stays API) Schemas
// ==========================================================================

/**
 * Duffel Accommodation Location Schema
 */
export const DuffelAccommodationLocationSchema = z.object({
  geographic_coordinates: z.object({
    latitude: z.number(),
    longitude: z.number(),
  }),
  city_name: z.string().optional(),
  country_code: z.string().optional(),
});

/**
 * Duffel Accommodation Amenity Schema
 */
export const DuffelAccommodationAmenitySchema = z.object({
  type: z.string(),
  name: z.string(),
});

/**
 * Duffel Accommodation Photo Schema
 */
export const DuffelAccommodationPhotoSchema = z.object({
  url: z.string().url(),
  category: z.string().optional(),
});

/**
 * Duffel Accommodation Room Rate Schema
 */
export const DuffelAccommodationRateSchema = z.object({
  id: z.string(),
  total_amount: z.string(),
  total_currency: z.string(),
  payment_type: z.enum(['at_property', 'pay_later', 'guarantee', 'deposit']).optional(),
  cancellation_timeline: z.object({
    refundable: z.boolean(),
    deadline: z.string().optional(),
  }).optional(),
  available_rooms: z.number().int().min(0).optional(),
  board_type: z.enum(['room_only', 'breakfast', 'half_board', 'full_board', 'all_inclusive']).optional(),
});

/**
 * Duffel Accommodation Room Schema
 */
export const DuffelAccommodationRoomSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  bed_configurations: z.array(z.object({
    type: z.string(),
    count: z.number().int().min(1),
  })).optional(),
  max_guests: z.number().int().min(1).optional(),
  rates: z.array(DuffelAccommodationRateSchema),
});

/**
 * Duffel Accommodation Schema
 * @see https://duffel.com/docs/api/v2/accommodation
 */
export const DuffelAccommodationSchema = z.object({
  id: z.string(),
  name: z.string(),
  location: DuffelAccommodationLocationSchema,
  rating: z.number().min(0).max(5).optional(),
  review_score: z.number().min(0).max(10).optional(),
  amenities: z.array(DuffelAccommodationAmenitySchema).optional(),
  photos: z.array(DuffelAccommodationPhotoSchema).optional(),
  rooms: z.array(DuffelAccommodationRoomSchema).optional(),
  check_in_time: z.string().optional(),
  check_out_time: z.string().optional(),
});

/**
 * Duffel Accommodation Search Response Schema
 */
export const DuffelAccommodationSearchResponseSchema = z.object({
  data: z.array(DuffelAccommodationSchema),
  meta: z.object({
    limit: z.number().int(),
    after: z.string().optional(),
    before: z.string().optional(),
  }).optional(),
});

export type DuffelAccommodationLocation = z.infer<typeof DuffelAccommodationLocationSchema>;
export type DuffelAccommodationAmenity = z.infer<typeof DuffelAccommodationAmenitySchema>;
export type DuffelAccommodationPhoto = z.infer<typeof DuffelAccommodationPhotoSchema>;
export type DuffelAccommodationRate = z.infer<typeof DuffelAccommodationRateSchema>;
export type DuffelAccommodationRoom = z.infer<typeof DuffelAccommodationRoomSchema>;
export type DuffelAccommodation = z.infer<typeof DuffelAccommodationSchema>;
export type DuffelAccommodationSearchResponse = z.infer<typeof DuffelAccommodationSearchResponseSchema>;

const TravelerLoyaltyProgramSchema = z.object({
  programOwner: z.string(),
  id: z.string(),
  tier: z.string().optional(),
});

/**
 * Amadeus flight segment schema
 */
export const FlightSegmentSchema = z.object({
  id: z.string(),
  departure: z.object({
    iataCode: IATACodeSchema,
    terminal: z.string().optional(),
    at: z.string(), // Accept any datetime format from Amadeus API
  }),
  arrival: z.object({
    iataCode: IATACodeSchema,
    terminal: z.string().optional(),
    at: z.string(), // Accept any datetime format from Amadeus API
  }),
  carrierCode: z.string(),
  number: z.string(),
  aircraft: AircraftSchema.optional(),
  operating: z
    .object({
      carrierCode: z.string(),
      flightNumber: z.string().optional(),
    })
    .optional(),
  duration: z.string(), // ISO 8601 duration format (e.g., "PT3H20M")
  numberOfStops: z.number().int().nonnegative(),
  blacklistedInEU: z.boolean().optional(),
  cabin: CabinEnum.optional(),
  co2Emissions: z.array(Co2EmissionSchema).optional(),
});

/**
 * Flight itinerary schema
 */
export const FlightItinerarySchema = z.object({
  duration: z.string(), // ISO 8601 duration format
  segments: z.array(FlightSegmentSchema),
});

/**
 * Flight price breakdown schema - uses MoneySchema as base
 */
export const FlightPriceSchema = z.object({
  currency: z.string(),
  total: z.string(),
  base: z.string(),
  billingCurrency: z.string().optional(),
  fees: z
    .array(
      z.object({
        amount: z.string(),
        type: z.string(),
      })
    )
    .default([]),
  grandTotal: z.string().optional(),
  margin: z.string().optional(),
  additionalServices: z
    .array(
      z.object({
        amount: z.string(),
        type: z.string(),
      })
    )
    .optional()
    .default([]),
  taxes: z
    .array(
      z.object({
        amount: z.string(),
        code: z.string(),
      })
    )
    .optional()
    .default([]),
  refundableTaxes: z.string().optional(),
});

/**
 * Enhanced flight option schema with comprehensive Amadeus data
 */
export const FlightOptionSchema = z.object({
  id: z.string(),
  source: z.enum(["GDS", "NDC", "MOCK"]).default("GDS"),
  instantTicketingRequired: z.boolean().default(false),
  nonHomogeneous: z.boolean().default(false),
  oneWay: z.boolean(),
  lastTicketingDate: z.string().date().optional(),
  lastTicketingDateTime: z.string().optional(), // Accept any datetime format
  numberOfBookableSeats: z.number().int().nonnegative().optional(),
  itineraries: z.array(FlightItinerarySchema),
  price: FlightPriceSchema,
  originalIndex: z.number().int().nonnegative().optional(), // For preserving timeline order
  outlineId: z.string().optional(), // ID of the original outline item this option belongs to
  pricingOptions: z
    .object({
      fareType: z.array(z.string()).optional(),
      includedCheckedBagsOnly: z.boolean().optional(),
      refundableFare: z.boolean().optional(),
      noRestrictionFare: z.boolean().optional(),
      noPenaltyFare: z.boolean().optional(),
    })
    .optional(),
  services: z.array(AncillaryServiceSchema).optional(),
  availableServices: z.array(DuffelAvailableServiceSchema).optional(), // Duffel ancillary services with real pricing
  co2Emissions: z.array(Co2EmissionSchema).optional(),
  seatAvailability: SeatAvailabilitySummarySchema.optional(),
  fareDetailsBySegment: z
    .array(
      z.object({
        segmentId: z.string(),
        cabin: CabinEnum,
        fareBasis: z.string().optional(),
        brandedFare: z.string().optional(),
        class: z.string().optional(),
        includedCheckedBags: z
          .object({
            quantity: z.number().int().nonnegative().optional(),
            weight: z.number().optional(),
            weightUnit: z.string().optional(),
          })
          .optional(),
      })
    )
    .optional(),
  travelerPricings: z
    .array(
      z.object({
        travelerId: z.string(),
        fareOption: z.enum([
          "STANDARD",
          "INCLUSIVE_TOUR",
          "SPANISH_MELILLA_RESIDENT",
          "SPANISH_CEUTA_RESIDENT",
          "SPANISH_CANARY_RESIDENT",
          "SPANISH_BALEARIC_RESIDENT",
        ]),
        travelerType: z.enum([
          "ADULT",
          "CHILD",
          "SENIOR",
          "YOUNG",
          "HELD_INFANT",
          "SEATED_INFANT",
          "STUDENT",
        ]),
        associatedAdultId: z.string().optional(),
        price: FlightPriceSchema,
        fareDetailsBySegment: z
          .array(
            z.object({
              segmentId: z.string(),
              cabin: CabinEnum,
              fareBasis: z.string().optional(),
              brandedFare: z.string().optional(),
              class: z.string().optional(),
              additionalServices: z.array(AncillaryServiceSchema).optional(),
            })
          )
          .optional(),
        loyaltyPrograms: z.array(TravelerLoyaltyProgramSchema).optional(),
        additionalServices: z.array(AncillaryServiceSchema).optional(),
      })
    )
    .optional(),
  validatingAirlineCodes: z.array(z.string()).optional(),
  choiceProbability: z.string().optional(), // From Flight Choice Prediction API
  fareRules: z.unknown().optional(),
  rankingReason: z.string().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

// ==========================================================================
// Hotel Schemas (Amadeus Integration)
// ==========================================================================

/**
 * Hotel address schema - based on common AddressSchema
 */
export const HotelAddressSchema = z.object({
  lines: z.array(z.string()).optional(),
  postalCode: z.string(),
  cityName: z.string(), // Different field name for hotels
  countryCode: z.string().length(2),
  stateCode: z.string().optional(),
});

/**
 * Hotel contact schema
 */
export const HotelContactSchema = z.object({
  phone: z.string().optional(),
  fax: z.string().optional(),
  email: z.string().email().optional(),
});

/**
 * Hotel media schema
 */
export const HotelMediaSchema = z.object({
  uri: z.string().url(),
  category: z.string().optional(),
  description: z.string().optional(),
  dimensions: z
    .object({
      height: z.number().int().positive().optional(),
      width: z.number().int().positive().optional(),
    })
    .optional(),
});

/**
 * Hotel amenity schema
 */
export const HotelAmenitySchema = z.object({
  code: z.string(),
  text: z.string(),
  category: z.string().optional(),
});

/**
 * Hotel price breakdown schema - similar to MoneySchema but with hotel-specific fields
 */
export const HotelPriceSchema = z.object({
  currency: z.string(),
  base: z.string().optional(),
  total: z.string(),
  sellingTotal: z.string().optional(),
  taxes: z
    .array(
      z.object({
        amount: z.string(),
        currency: z.string(),
        code: z.string().optional(),
        percentage: z.string().optional(),
        included: z.boolean().optional(),
        description: z.string().optional(),
        pricingFrequency: z.string().optional(), // "PER_NIGHT", "PER_STAY"
        pricingMode: z.string().optional(), // "PER_PRODUCT", "PER_PERSON"
      })
    )
    .optional()
    .default([]),
  markups: z
    .array(
      z.object({
        amount: z.string(),
        currency: z.string(),
      })
    )
    .optional()
    .default([]),
  variations: z
    .object({
      average: z
        .object({
          base: z.string().optional(),
          total: z.string(),
        })
        .optional(),
      changes: z
        .array(
          z.object({
            startDate: z.string().date(),
            endDate: z.string().date(),
            base: z.string().optional(),
            total: z.string(),
          })
        )
        .optional(),
    })
    .optional(),
});

/**
 * Hotel policies schema
 */
export const HotelPoliciesSchema = z.object({
  paymentPolicy: z.enum(["GUARANTEE", "DEPOSIT", "NONE"]).optional(),
  guarantee: z
    .object({
      description: z.string().optional(),
      acceptedPayments: z
        .object({
          creditCards: z.array(z.string()).optional(),
          methods: z
            .array(z.enum(["CREDIT_CARD", "TRAVEL_AGENT_ID"]))
            .optional(),
        })
        .optional(),
    })
    .optional(),
  deposit: z
    .object({
      amount: z.string().optional(),
      deadline: z.string().optional(), // Accept any datetime format
      description: z.string().optional(),
      acceptedPayments: z
        .object({
          creditCards: z.array(z.string()).optional(),
          methods: z
            .array(z.enum(["CREDIT_CARD", "TRAVEL_AGENT_ID"]))
            .optional(),
        })
        .optional(),
    })
    .optional(),
  prepay: z
    .object({
      amount: z.string().optional(),
      deadline: z.string().optional(), // Accept any datetime format
      description: z.string().optional(),
      acceptedPayments: z
        .object({
          creditCards: z.array(z.string()).optional(),
          methods: z
            .array(z.enum(["CREDIT_CARD", "TRAVEL_AGENT_ID"]))
            .optional(),
        })
        .optional(),
    })
    .optional(),
  holdTime: z
    .object({
      deadline: z.string().optional(), // Accept any datetime format
    })
    .optional(),
  cancellation: z
    .object({
      deadline: z.string().optional(), // Accept any datetime format
      amount: z.string().optional(),
      type: z.enum(["FULL_STAY", "NIGHTS"]).optional(),
      numberOfNights: z.number().int().optional(),
      percent: z.string().optional(),
      description: z.string().optional(),
    })
    .optional(),
  checkInOut: z
    .object({
      checkIn: z.string().optional(), // Accept any time format string
      checkOut: z.string().optional(), // Accept any time format string
    })
    .optional(),
});

/**
 * Hotel commission schema
 */
export const HotelCommissionSchema = z.object({
  percentage: z.string().optional(),
  amount: z.string().optional(),
  description: z.string().optional(),
});

/**
 * Enhanced hotel option schema with comprehensive Amadeus data
 */
export const HotelOptionSchema = z.object({
  id: z.string(),
  chainCode: z.string().optional(),
  dupeId: z.number().int().optional(),
  name: z.string(),
  hotelId: z.string(), // Amadeus hotel ID
  // Marks whether this option comes from a live provider or deterministic mock generation.
  dataSource: z.enum(["LIVE", "MOCK"]).default("LIVE"),
  iataCode: z.string().optional(),
  geoCode: GeoCoordinatesSchema.optional(), // Using common schema
  address: HotelAddressSchema.optional(),
  contact: HotelContactSchema.optional(),
  originalIndex: z.number().int().nonnegative().optional(), // For preserving timeline order
  outlineId: z.string().optional(), // ID of the original outline item this option belongs to
  description: z
    .object({
      text: z.string(),
      lang: z.string().optional(),
    })
    .optional(),
  amenities: z.array(HotelAmenitySchema).optional().default([]),
  media: z.array(HotelMediaSchema).optional().default([]),
  rating: z.number().min(0).max(5).optional(),
  awards: z
    .array(
      z.object({
        provider: z.string(),
        rating: z.string(),
      })
    )
    .optional(),
  lastUpdate: z.string().optional(), // Accept any datetime format

  // Offer-specific data (from Hotel Search API)
  available: z.boolean().default(true),
  offers: z
    .array(
      z.object({
        id: z.string(),
        checkInDate: z.string().date(),
        checkOutDate: z.string().date(),
        rateCode: z.string().optional(),
        rateFamilyEstimated: z
          .object({
            code: z.string(),
            type: z.string(),
          })
          .optional(),
        category: z.string().optional(),
        description: z
          .object({
            text: z.string(),
            lang: z.string().optional(),
          })
          .optional(),
        commission: HotelCommissionSchema.optional(),
        boardType: z.string().optional(), // "ROOM_ONLY", "BREAKFAST", "HALF_BOARD", "FULL_BOARD", "ALL_INCLUSIVE"
        room: z
          .object({
            type: z.string().optional(),
            typeEstimated: z
              .object({
                category: z.string().optional(),
                beds: z.number().int().optional(),
                bedType: z.string().optional(),
              })
              .optional(),
            description: z
              .object({
                text: z.string(),
                lang: z.string().optional(),
              })
              .optional(),
          })
          .optional(),
        guests: z.object({
          adults: z.number().int().positive(),
          childAges: z.array(z.number().int()).optional(),
        }),
        price: HotelPriceSchema,
        policies: HotelPoliciesSchema.optional(),
        self: z.string().url().optional(), // Link to the specific offer
      })
    )
    .optional()
    .default([]),

  // Distance from search point
  distance: z
    .object({
      value: z.number().nonnegative(),
      unit: z.enum(["KM", "MI"]),
    })
    .optional(),
  rankingReason: z.string().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

// ==========================================================================
// Travel Chunk Schemas (With Booking Options)
// ==========================================================================

/**
 * Flight chunk schema (with booking options)
 */
export const FlightChunkSchema = z.object({
  type: z.literal("flight"),
  id: z.string(),
  origin: z.string(),
  destination: z.string(),
  date: z.string().date(),
  returnDate: z.string().date().optional(),
  departureTime: z.string().optional(), // Accept any time format string
  arrivalTime: z.string().optional(), // Accept any time format string
  returnDepartureTime: z.string().optional(), // Accept any time format string
  returnArrivalTime: z.string().optional(), // Accept any time format string
  confirmationCode: z.string().optional(), // Support confirmation codes for deduplication
  flightNumber: z.string().optional(), // Support flight numbers
  airline: z.string().optional(), // Support airline names
  
  // Enhanced flight experience data
  seatPreferences: z.object({
    currentSeat: z.string().optional(), // "14A", "12F" - actual assigned seat
    preferredType: z.enum(['window', 'aisle', 'middle']).optional(),
    upgradeStatus: z.string().optional(), // "complimentary", "paid", "requested"
    specialSeating: z.array(z.enum(['exit_row', 'bulkhead', 'accessible', 'extra_legroom'])).optional(),
  }).optional(),
  
  baggageInfo: z.object({
    checkedBags: z.number().int().min(0).default(0),
    checkedBagFees: z.number().min(0).optional(), // Total fees paid for checked bags
    carryOnFees: z.number().min(0).optional(), // Fees for carry-on (budget airlines)
    overweightFees: z.number().min(0).optional(), // Additional fees for overweight bags
    specialItemFees: z.number().min(0).optional(), // Fees for sports equipment, etc.
  }).optional(),
  
  mealPreferences: z.array(z.enum([
    'vegetarian', 'vegan', 'kosher', 'halal', 'gluten_free', 
    'diabetic', 'low_sodium', 'child_meal', 'no_meal'
  ])).optional(),
  
  fareDetails: z.object({
    bookingClass: z.string().optional(), // 'Y', 'B', 'M', 'H', 'Q', 'V', 'W', etc.
    fareType: z.enum(['basic', 'main', 'premium', 'business', 'first']).optional(),
    refundable: z.boolean().optional(),
    changeFeePolicy: z.string().optional(), // Description of change fees
    baseFare: z.number().optional(), // Base fare amount (excluding taxes)
    taxesAndFees: z.number().optional(), // Taxes and fees amount
  }).optional(),
  
  options: z.array(FlightOptionSchema).min(1, "At least one flight option is required"),
  provider: z.string().optional(),
  providerId: z.string().optional(),
  sequenceId: z.number().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

/**
 * Hotel chunk schema (with booking options)
 */
export const HotelChunkSchema = z.object({
  type: z.literal("hotel"),
  id: z.string(),
  location: z.string(),
  cityCode: z.string(),
  checkIn: z.string().date(),
  checkOut: z.string().date(),
  nights: z.number().int().positive(),
  eventTitle: z.string().optional(),
  
  // Enhanced hotel experience data
  roomDetails: z.object({
    roomNumber: z.string().optional(), // "1205", "Suite 1A" - actual room assigned
    bedType: z.enum(['king', 'queen', 'twin', 'double', 'sofa_bed', 'murphy_bed']).optional(),
    bedCount: z.number().int().min(1).optional(), // Number of beds in room
    smokingRoom: z.boolean().optional(),
    accessibleRoom: z.boolean().optional(),
    roomType: z.string().optional(), // "Standard", "Deluxe", "Suite", "Ocean View"
    floorNumber: z.number().int().optional(),
  }).optional(),
  
  servicePreferences: z.object({
    parkingRequired: z.boolean().optional(),
    parkingFees: z.number().min(0).optional(), // Daily parking fee
    earlyCheckin: z.boolean().optional(),
    earlyCheckinTime: z.string().optional(), // "2:00 PM" if different from standard
    lateCheckout: z.boolean().optional(),
    lateCheckoutTime: z.string().optional(), // "1:00 PM" if different from standard
    wifiUpgrade: z.boolean().optional(), // Premium wifi upgrade
    roomService: z.boolean().optional(), // Room service availability/usage
  }).optional(),
  
  hotelAmenities: z.object({
    breakfast: z.enum(['complimentary', 'paid', 'continental', 'full', 'none']).optional(),
    breakfast_cost: z.number().min(0).optional(), // Cost if paid breakfast
    fitness_center: z.boolean().optional(),
    pool: z.boolean().optional(),
    spa: z.boolean().optional(),
    business_center: z.boolean().optional(),
    pet_friendly: z.boolean().optional(),
    shuttle_service: z.boolean().optional(), // Airport/local shuttle
  }).optional(),
  
  specialRequests: z.array(z.enum([
    'high_floor', 'low_floor', 'quiet_room', 'connecting_rooms', 
    'crib', 'rollaway_bed', 'late_arrival', 'early_departure',
    'anniversary', 'honeymoon', 'birthday', 'business_travel'
  ])).optional(),
  
  options: z.array(HotelOptionSchema).min(1, "At least one hotel option is required"),
  provider: z.string().optional(),
  providerId: z.string().optional(),
  sequenceId: z.number().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

// ==========================================================================
// Union Schemas
// ==========================================================================

export const TimelineOutlineChunkSchema = z.discriminatedUnion("type", [
  FlightOutlineSchema,
  HotelOutlineSchema,
]);

export const TimelinePlanChunkSchema = z.discriminatedUnion("type", [
  FlightChunkSchema,
  HotelChunkSchema,
]);

export const TimelineChunkSchema = z.union([
  FlightOutlineSchema,
  HotelOutlineSchema,
  FlightChunkSchema,
  HotelChunkSchema,
]);

// ==========================================================================
// Travel Planner Request/Response Schemas
// ==========================================================================

/**
 * Timeline variant enum - distinguishes between planning and booking phases
 */
export const TimelineVariantSchema = z.enum(['outline', 'plan']);

/**
 * Token availability status schema
 */
export const TokenAvailabilitySchema = z.object({
  hasCalendarTokens: z.boolean(),
  hasEmailTokens: z.boolean(),
  hasContactTokens: z.boolean().optional(),
});

/**
 * Schema for the context object within the travel planner response.
 */
export const TravelPlannerContextSchema = z.object({
  query: z.string(),
  calendarEventCount: z.number(),
  emailCount: z.number(),
  tokenAvailability: TokenAvailabilitySchema,
  processingTimeMs: z.number(),
  success: z.boolean(),
  stage: z.string(), // Or z.enum if specific stages are known
});


/**
 * Travel planner request schema (matching backend validation exactly)
 */
export const TravelPlannerRequestSchema = z.object({
  query: z
    .string()
    .min(3, { message: "Travel query must be at least 3 characters long" })
    .max(2000, { message: "Travel query must be less than 2000 characters" })
    .refine((query) => query.trim().length >= 3, {
      message: "Travel query cannot be just whitespace",
    }),

  userLocation: GeoCoordinatesSchema.optional(), // Using common schema
});

/**
 * Travel planner result data schema
 */
export const TravelPlannerResultSchema = z.object({
  context: TravelPlannerContextSchema.optional(),
  travelOutline: z.array(TimelineOutlineChunkSchema).optional(),
  timelineVariant: TimelineVariantSchema.optional(),
});

/**
 * Travel planner response schema - Uses StandardApiResponseSchema
 */
export const TravelPlannerResponseSchema = StandardApiResponseSchema;

/**
 * Travel outline schema - array of outline chunks
 */
export const TravelOutlineSchema = z.array(TimelineOutlineChunkSchema);

// ==========================================================================
// Search Schemas
// ==========================================================================

/**
 * Travel search preferences schema
 */
export const TravelSearchPreferencesSchema = z.object({
  // Flight preferences
  cabinClass: z.enum(["ECONOMY", "PREMIUM_ECONOMY", "BUSINESS", "FIRST"]).optional(),
  fareType: z.enum(["STANDARD", "LIGHT", "PLUS", "FLEX"]).optional(),
  maxStops: z.number().int().min(0).max(3).optional(),
  preferredAirlines: z.array(z.string()).optional(),
  
  // Hotel preferences  
  roomTypes: z.array(z.string()).optional(),
  boardTypes: z.array(z.enum(["ROOM_ONLY", "BREAKFAST", "HALF_BOARD", "FULL_BOARD", "ALL_INCLUSIVE"])).optional(),
  minStarRating: z.number().min(1).max(5).optional(),
  preferredChains: z.array(z.string()).optional(),
  
  // General preferences
  maxBudget: z.number().positive().optional(),
  currency: z.string().length(3).optional(), // ISO currency code
});

/**
 * Travel search request schema
 */
export const TravelSearchRequestSchema = z.object({
  travelOutline: TravelOutlineSchema,
  preferences: TravelSearchPreferencesSchema.optional(),
  sessionId: z.string().optional(),
  userId: z.string().optional(),
  correlationId: z.string().optional(),
  pagination: PaginationSchema.optional(), // Using common schema
});

const TravelOptionUnionSchema = z.union([FlightOptionSchema, HotelOptionSchema]);
const DualSortedOutlineMapSchema = z
  .record(z.string(), TravelOptionUnionSchema.array().default([]))
  .default({});

/**
 * Travel search result data schema
 */
export const TravelSearchResultSchema = z.object({
  smartSorted: DualSortedOutlineMapSchema,
  priceSorted: DualSortedOutlineMapSchema,
  metadata: z.object({
    requestId: z.string(),
    timestamp: z.string().datetime().optional(),
    userId: z.string().optional(),
    smartSortedCount: z.number().optional(),
    priceSortedCount: z.number().optional(),
    processingTimeMs: z.number().optional(),
    dataSources: z
      .object({
        flights: z.enum(["LIVE", "MOCK", "MIXED"]),
        hotels: z.enum(["LIVE", "MOCK", "MIXED"]),
      })
      .optional(),
    outlineOrder: z.array(z.object({
      outlineId: z.string(),
      type: z.enum(["flightOutline", "hotelOutline"]).optional(),
      sequence: z.number().optional(),
    })).optional(),
    perOutlineOptionCounts: z.record(z.string(), z.object({
      smartCount: z.number(),
      priceCount: z.number(),
    })).optional(),
  }).optional(),
  warnings: z.array(z.string()).optional(),
  errors: z.array(z.object({
    type: z.string(),
    message: z.string(),
    details: z.unknown().optional(),
  })).optional(),
});

/**
 * Travel search job result schema (stored in DynamoDB job status table)
 */
export const TravelSearchJobResultSchema = z.object({
  success: z.boolean().default(true),
  timelineItems: z.array(TimelinePlanChunkSchema).default([]),
  timelineVariant: TimelineVariantSchema.default('plan'),
  smartSorted: DualSortedOutlineMapSchema,
  priceSorted: DualSortedOutlineMapSchema,
  metadata: z.object({
    requestId: z.string(),
    timestamp: z.string().datetime().optional(),
    userId: z.string().optional(),
    smartSortedCount: z.number().optional(),
    priceSortedCount: z.number().optional(),
    processingTimeMs: z.number().optional(),
    dataSources: z
      .object({
        flights: z.enum(["LIVE", "MOCK", "MIXED"]),
        hotels: z.enum(["LIVE", "MOCK", "MIXED"]),
      })
      .optional(),
    outlineOrder: z.array(z.object({
      outlineId: z.string(),
      type: z.enum(["flightOutline", "hotelOutline"]).optional(),
      sequence: z.number().optional(),
    })).optional(),
    perOutlineOptionCounts: z.record(z.string(), z.object({
      smartCount: z.number(),
      priceCount: z.number(),
    })).optional(),
  }).optional(),
  warnings: z.array(z.string()).optional(),
  errors: z.array(z.object({
    type: z.string(),
    message: z.string(),
    details: z.unknown().optional(),
  })).optional(),
});

/**
 * Travel search response schema - Uses StandardApiResponseSchema
 */
export const TravelSearchResponseSchema = StandardApiResponseSchema;

// ==========================================================================
// Type Exports
// ==========================================================================

export type TimelineVariant = z.infer<typeof TimelineVariantSchema>;
export type EventAvailabilityStatus = z.infer<typeof EventAvailabilityStatusSchema>;
export type TravelEventAddress = z.infer<typeof TravelEventAddressSchema>;
export type TravelEvent = z.infer<typeof TravelEventSchema>;
export type SuggestedTravelWindow = z.infer<typeof SuggestedTravelWindowSchema>;
export type DistanceAnalysis = z.infer<typeof DistanceAnalysisSchema>;
export type SeasonalRecommendations = z.infer<typeof SeasonalRecommendationsSchema>;
export type AvailabilityAnalysis = z.infer<typeof AvailabilityAnalysisSchema>;
export type FlightOutline = z.infer<typeof FlightOutlineSchema>;
export type HotelOutline = z.infer<typeof HotelOutlineSchema>;
export type FlightSegment = z.infer<typeof FlightSegmentSchema>;
export type FlightItinerary = z.infer<typeof FlightItinerarySchema>;
export type FlightPrice = z.infer<typeof FlightPriceSchema>;
export type FlightOption = z.infer<typeof FlightOptionSchema>;
export type HotelAddress = z.infer<typeof HotelAddressSchema>;
export type HotelContact = z.infer<typeof HotelContactSchema>;
export type HotelMedia = z.infer<typeof HotelMediaSchema>;
export type HotelAmenity = z.infer<typeof HotelAmenitySchema>;
export type HotelPrice = z.infer<typeof HotelPriceSchema>;
export type HotelPolicies = z.infer<typeof HotelPoliciesSchema>;
export type HotelCommission = z.infer<typeof HotelCommissionSchema>;
export type HotelOption = z.infer<typeof HotelOptionSchema>;
export type FlightChunk = z.infer<typeof FlightChunkSchema>;
export type HotelChunk = z.infer<typeof HotelChunkSchema>;
export type TimelineOutlineChunk = z.infer<typeof TimelineOutlineChunkSchema>;
export type TimelinePlanChunk = z.infer<typeof TimelinePlanChunkSchema>;
export type TimelineChunk = z.infer<typeof TimelineChunkSchema>;
export type TokenAvailability = z.infer<typeof TokenAvailabilitySchema>;
export type TravelPlannerContext = z.infer<typeof TravelPlannerContextSchema>;
export type TravelPlannerRequest = z.infer<typeof TravelPlannerRequestSchema>;
export type TravelPlannerResult = z.infer<typeof TravelPlannerResultSchema>;
export type TravelPlannerResponse = StandardApiResponse<TravelPlannerResult>;
export type TravelSearchPreferences = z.infer<typeof TravelSearchPreferencesSchema>;
export type TravelSearchRequest = z.infer<typeof TravelSearchRequestSchema>;
export type TravelSearchResult = z.infer<typeof TravelSearchResultSchema>;
export type TravelSearchJobResult = z.infer<typeof TravelSearchJobResultSchema>;
export type TravelSearchResponse = StandardApiResponse<TravelSearchResult>;
export type SeatAvailabilityCategory = z.infer<typeof SeatAvailabilityCategorySchema>;
export type SeatAvailabilitySummary = z.infer<typeof SeatAvailabilitySummarySchema>;
export type SeatAvailabilityCabin = z.infer<typeof SeatAvailabilityCabinSchema>;

// Re-export common types for convenience
export type {
  GeoCoordinates,
  Address,
  Money,
  StandardMetadata,
  Id,
  Pagination,
};

// Utility type for travel outlines only
export type TravelOutline = Array<FlightOutline | HotelOutline>;
export type TravelPlan = Array<FlightChunk | HotelChunk>;
export type Timeline = Array<TimelineChunk>;

// Search result types for the backend processing
export type TravelSearchResults = Array<FlightOption | HotelOption>;
export type TravelSearchResultsByOutline = Record<string, TravelSearchResults>;

// IATA code types
export type IATACode = z.infer<typeof IATACodeSchema>;
export type CityOrIATA = z.infer<typeof CityOrIATASchema>;

// ==========================================================================
// Utility Type Guards
// ==========================================================================

export function isFlightOutline(
  chunk: TimelineOutlineChunk
): chunk is FlightOutline {
  return chunk.type === "flightOutline";
}

export function isHotelOutline(
  chunk: TimelineOutlineChunk
): chunk is HotelOutline {
  return chunk.type === "hotelOutline";
}

export function isFlightChunk(chunk: TimelineChunk): chunk is FlightChunk {
  return chunk.type === "flight";
}

export function isHotelChunk(chunk: TimelineChunk): chunk is HotelChunk {
  return chunk.type === "hotel";
}

// ==========================================================================
// Amadeus-specific types for API responses
// ==========================================================================

export interface AmadeusFlightResponse {
  data: AmadeusFlightOffer[];
  dictionaries?: {
    carriers: Record<string, string>;
    currencies: Record<string, string>;
    aircraft: Record<string, string>;
    locations: Record<string, any>;
  };
}

export interface AmadeusFlightOffer {
  type: string;
  id: string;
  source: string;
  instantTicketingRequired: boolean;
  nonHomogeneous: boolean;
  oneWay: boolean;
  lastTicketingDate: string;
  lastTicketingDateTime?: string;
  numberOfBookableSeats: number;
  itineraries: AmadeusItinerary[];
  price: AmadeusPrice;
  pricingOptions: any;
  validatingAirlineCodes: string[];
  travelerPricings: any[];
  services?: AmadeusAncillaryService[];
  co2Emissions?: AmadeusCo2Emission[];
  fareRules?: unknown;
}

export interface AmadeusItinerary {
  duration: string;
  segments: AmadeusSegment[];
}

export interface AmadeusSegment {
  departure: AmadeusAirportInfo;
  arrival: AmadeusAirportInfo;
  carrierCode: string;
  number: string;
  aircraft: { code: string };
  operating: { carrierCode: string; flightNumber?: string };
  duration: string;
  id: string;
  numberOfStops: number;
  blacklistedInEU: boolean;
  co2Emissions?: AmadeusCo2Emission[];
}

export interface AmadeusAirportInfo {
  iataCode: string;
  terminal?: string;
  at: string; // ISO date string
}

export interface AmadeusPrice {
  currency: string;
  total: string;
  base: string;
  fees: { amount: string; type: string }[];
  grandTotal: string;
  billingCurrency?: string;
  margin?: string;
  refundableTaxes?: string;
  additionalServices?: { amount: string; type: string }[];
  taxes?: Array<{ amount: string; code?: string; currency?: string }>;
}

export interface AmadeusCo2Emission {
  weight: number;
  weightUnit: string;
  cabin?: string;
  efficiencyClass?: string;
}

export interface AmadeusAncillaryService {
  id?: string;
  type: string;
  travelerIds?: string[];
  segmentIds?: string[];
  segments?: Array<{
    segmentId: string;
    cabin?: string;
    fareBasis?: string;
    brandedFare?: string;
    class?: string;
  }>;
  price: {
    currency: string;
    total: string;
    base?: string;
  };
  description?: string;
}

export interface AmadeusHotelResponse {
  data: AmadeusHotel[];
}

export interface AmadeusHotel {
  type: string;
  hotelId: string;
  name: string;
  rating: string;
  description?: {
    text: string;
  };
  media?: {
    uri: string;
    category: string;
  }[];
  cityCode: string;
  latitude?: number;
  longitude?: number;
  address?: {
    lines: string[];
    postalCode: string;
    cityName: string;
    countryCode: string;
  };
  contact?: {
    phone: string;
    email: string;
  };
  amenities?: string[];
  price?: {
    currency: string;
    total: string;
    base: string;
    taxes: Array<{ amount: string; code: string }>;
  };
  available?: boolean;
}

export interface AmadeusHotelPriceResponse {
  data: {
    offers: Array<{
      id: string;
      checkInDate: string;
      checkOutDate: string;
      roomQuantity: number;
      rateCode: string;
      rateFamilyEstimated: {
        code: string;
        type: string;
      };
      price: {
        currency: string;
        total: string;
        base: string;
        taxes: Array<{
          code: string;
          amount: string;
          currency: string;
        }>;
      };
      room: {
        type: string;
        typeEstimated: {
          category: string;
          beds: number;
          bedType: string;
        };
        description: {
          text: string;
        };
      };
    }>;
  };
}
