/**
 * Travel Preferences Schema Definitions
 * 
 * This module provides standardized Zod schemas for travel preferences
 * used throughout the Pack server application. Updated to match the
 * clustered structure used in the service layer.
 * 
 * @module shared/schemas/travel-preferences
 */

import { z } from 'zod';
import { optionalString } from './zodOptionalString';

/**
 * Shared enum option definitions for flight, hotel, and booking preferences.
 * Exported so downstream consumers (mobile/web) can render dropdowns without
 * re-declaring string literals.
 */
export const FlightCabinClassOptions = ['economy', 'premium_economy', 'business', 'first'] as const;
export const FlightCabinClassEnum = z.enum(FlightCabinClassOptions);
export type FlightCabinClass = typeof FlightCabinClassOptions[number];

export const FlightSeatTypeOptions = ['no preference', 'window', 'middle', 'aisle'] as const;
export const FlightSeatTypeEnum = z.enum(FlightSeatTypeOptions);
export type FlightSeatType = typeof FlightSeatTypeOptions[number];

export const FlightFareTypeOptions = ['standard', 'light', 'plus', 'flex'] as const;
export const FlightFareTypeEnum = z.enum(FlightFareTypeOptions);
export type FlightFareType = typeof FlightFareTypeOptions[number];

export const FlightSearchPriorityOptions = ['price', 'nonstop', 'time', 'airline', 'comfort'] as const;
export const FlightSearchPriorityEnum = z.enum(FlightSearchPriorityOptions);
export type FlightSearchPriority = typeof FlightSearchPriorityOptions[number];

export const HotelSearchPriorityOptions = ['price', 'location', 'rating', 'amenities', 'brand'] as const;
export const HotelSearchPriorityEnum = z.enum(HotelSearchPriorityOptions);
export type HotelSearchPriority = typeof HotelSearchPriorityOptions[number];

export const CarSearchPriorityOptions = ['price', 'location', 'size', 'features', 'brand'] as const;
export const CarSearchPriorityEnum = z.enum(CarSearchPriorityOptions);
export type CarSearchPriority = typeof CarSearchPriorityOptions[number];

export const BookingBudgetRangeOptions = ['budget', 'mid-range', 'premium', 'luxury'] as const;
export const BookingBudgetRangeEnum = z.enum(BookingBudgetRangeOptions);
export type BookingBudgetRange = typeof BookingBudgetRangeOptions[number];

export const BookingLoyaltyStrategyOptions = ['maximize', 'balance', 'spend'] as const;
export const BookingLoyaltyStrategyEnum = z.enum(BookingLoyaltyStrategyOptions);
export type BookingLoyaltyStrategy = typeof BookingLoyaltyStrategyOptions[number];

export const BookingUpgradePreferenceOptions = ['never', 'sometimes', 'always'] as const;
export const BookingUpgradePreferenceEnum = z.enum(BookingUpgradePreferenceOptions);
export type BookingUpgradePreference = typeof BookingUpgradePreferenceOptions[number];

export const TravelTimePreferenceOptions = ['morning', 'afternoon', 'evening', 'late-night'] as const;
export const TravelTimePreferenceEnum = z.enum(TravelTimePreferenceOptions);
export type TravelTimePreference = typeof TravelTimePreferenceOptions[number];

export const DietaryRestrictionOptions = [
  'vegetarian', 'vegan', 'kosher', 'halal', 'gluten_free',
  'diabetic', 'low_sodium', 'nut_allergy', 'dairy_free', 'other'
] as const;
export const DietaryRestrictionEnum = z.enum(DietaryRestrictionOptions);
export type DietaryRestriction = typeof DietaryRestrictionOptions[number];

export const MealPreferenceOptions = [
  'standard',
  'vegetarian',
  'vegan',
  'kosher',
  'halal',
  'gluten_free',
  'diabetic',
  'low_sodium',
  'child_meal',
  'baby_meal',
  'bland',
  'fruit',
  'seafood',
  'asian_vegetarian',
  'hindu',
  'jain',
  'no_meal',
] as const;
export const MealPreferenceEnum = z.enum(MealPreferenceOptions);
export type MealPreference = typeof MealPreferenceOptions[number];

export const AccessibilityNeedOptions = [
  'wheelchair', 'mobility_assistance', 'hearing_impaired', 'visual_impaired',
  'cognitive_assistance', 'service_animal', 'accessible_room', 'accessible_transport'
] as const;
export const AccessibilityNeedEnum = z.enum(AccessibilityNeedOptions);
export type AccessibilityNeed = typeof AccessibilityNeedOptions[number];

export const PreferredDocumentTypeOptions = ['passport', 'national_id', 'drivers_license'] as const;
export const PreferredDocumentTypeEnum = z.enum(PreferredDocumentTypeOptions);
export type PreferredDocumentType = typeof PreferredDocumentTypeOptions[number];

export const CommunicationMethodOptions = ['email', 'phone', 'sms', 'app'] as const;
export const CommunicationMethodEnum = z.enum(CommunicationMethodOptions);
export type CommunicationMethod = typeof CommunicationMethodOptions[number];

/**
 * Schema for membership/loyalty program validation
 * Used for airline, hotel, and car rental memberships
 */
export const MembershipSchema = z.object({
  membershipNumber: z.string().optional(),
  tier: z.string().optional(),
  expirationDate: optionalString(z.string().datetime())
});

/**
 * Enhanced airline loyalty program schema with conditional validation for partial updates
 */
export const AirlineLoyaltyProgramSchema = z.object({
  id: z.string(),
  airlineCode: z.string(), // "UA", "AA", "DL" - for API integration
  airlineName: optionalString(z.string().min(1, "Airline name cannot be empty if provided")), // "United Airlines" - for display
  membershipNumber: optionalString(z.string().min(1, "Membership number cannot be empty if provided")),
  tier: optionalString(z.string().min(1, "Tier cannot be empty if provided")), // "Gold", "Platinum", "Diamond"
  tierLevel: z.number().optional(), // 1-5 for priority sorting
  status: z.enum(['active', 'expired', 'inactive']).default('active'),
  expirationDate: optionalString(z.string().datetime()),
  pointsBalance: z.number().optional(),
  benefits: z.array(z.string()).optional(), // ["lounge_access", "priority_boarding", "free_bags"]
  isPrimary: z.boolean().default(false), // Primary FF program for auto-fill
  lastUpdated: optionalString(z.string().datetime()),
  notes: optionalString(z.string().min(1, "Notes cannot be empty if provided"))
});

/**
 * Enhanced hotel loyalty program schema with conditional validation for partial updates
 */
export const HotelLoyaltyProgramSchema = z.object({
  id: z.string(),
  hotelChain: optionalString(z.string().min(1, "Hotel chain cannot be empty if provided")), // "Marriott", "Hilton", "IHG"
  hotelChainCode: z.string(), // "MAR", "HIL", "IHG"
  membershipNumber: optionalString(z.string().min(1, "Membership number cannot be empty if provided")),
  tier: optionalString(z.string().min(1, "Tier cannot be empty if provided")), // "Silver", "Gold", "Diamond"
  tierLevel: z.number().optional(),
  status: z.enum(['active', 'expired', 'inactive']).default('active'),
  expirationDate: optionalString(z.string().datetime()),
  pointsBalance: z.number().optional(),
  benefits: z.array(z.string()).optional(), // ["room_upgrades", "late_checkout", "free_wifi"]
  isPrimary: z.boolean().default(false),
  lastUpdated: optionalString(z.string().datetime()),
  notes: optionalString(z.string().min(1, "Notes cannot be empty if provided"))
});

/**
 * Enhanced car rental loyalty program schema with conditional validation for partial updates
 */
export const CarRentalLoyaltyProgramSchema = z.object({
  id: z.string(),
  company: optionalString(z.string().min(1, "Company name cannot be empty if provided")), // "Hertz", "Enterprise", "Avis"
  companyCode: z.string(), // "HTZ", "ENT", "AVS"
  membershipNumber: optionalString(z.string().min(1, "Membership number cannot be empty if provided")),
  tier: optionalString(z.string().min(1, "Tier cannot be empty if provided")), // "Preferred", "Executive", "Chairman's Circle"
  tierLevel: z.number().optional(),
  status: z.enum(['active', 'expired', 'inactive']).default('active'),
  expirationDate: optionalString(z.string().datetime()),
  pointsBalance: z.number().optional(),
  benefits: z.array(z.string()).optional(), // ["skip_counter", "free_upgrades", "priority_service"]
  isPrimary: z.boolean().default(false),
  lastUpdated: optionalString(z.string().datetime()),
  notes: optionalString(z.string().min(1, "Notes cannot be empty if provided"))
});


/**
 * Travel priorities schema
 */
export const TravelPrioritiesSchema = z.object({
  costImportance: z.number().min(1).max(10).optional(),
  timeImportance: z.number().min(1).max(10).optional(),
  comfortImportance: z.number().min(1).max(10).optional(),
  flexibilityImportance: z.number().min(1).max(10).optional(),
});

/**
 * Preferred travel times schema
 */
export const PreferredTravelTimesSchema = z.object({
  departureTimePreference: TravelTimePreferenceEnum.optional(),
  arrivalTimePreference: TravelTimePreferenceEnum.optional(),
  maxLayoverHours: z.number().optional(),
  preferDirectFlights: z.boolean().optional(),
  avoidRedEyeFlights: z.boolean().optional(),
});

/**
 * Flight search priorities for ranking preferences
 */
export const FlightSearchPrioritiesSchema = z.array(FlightSearchPriorityEnum);

/**
 * Flight preferences cluster schema - optimized for flight search filtering
 * ✅ SCHEMA-FIRST DEFAULTS: Sensible defaults embedded for immediate functionality
 */
export const FlightPreferencesSchema = z.object({
  preferredAirlines: z.array(z.string()).default([]),
  preferredCabinClass: FlightCabinClassEnum.default('economy'),
  preferredSeatType: FlightSeatTypeEnum.default('no preference'),
  fareType: FlightFareTypeEnum.default('standard'),
  maxStops: z.number().min(0).max(3).optional(), // undefined means any
  preferDirectFlights: z.boolean().default(true),
  maxLayoverHours: z.number().min(0).max(24).default(4),
  avoidRedEyeFlights: z.boolean().default(false), // Allow red eyes by default as requested
  searchPriorities: FlightSearchPrioritiesSchema.default([...FlightSearchPriorityOptions]),
  
  // Unified loyalty programs structure
  loyaltyPrograms: z.array(AirlineLoyaltyProgramSchema).default([]),
});

/**
 * Hotel search priorities for ranking preferences
 */
export const HotelSearchPrioritiesSchema = z.array(
  HotelSearchPriorityEnum
);

/**
 * Hotel preferences cluster schema - optimized for hotel search filtering
 * ✅ SCHEMA-FIRST DEFAULTS: Sensible defaults embedded for immediate functionality
 */
export const HotelPreferencesSchema = z.object({
  preferredHotelChains: z.array(z.string()).default([]),
  preferredRoomTypes: z.array(z.string()).default([]),
  boardTypes: z.array(z.enum(['ROOM_ONLY', 'BREAKFAST', 'HALF_BOARD', 'FULL_BOARD', 'ALL_INCLUSIVE'])).default([]),
  minStarRating: z.number().min(1).max(5).optional(), // undefined means any rating
  hotelAmenities: z.array(z.string()).default([]), // Pool, gym, spa, wifi, parking, breakfast, etc.
  smokingPreference: z.boolean().default(false),
  searchPriorities: HotelSearchPrioritiesSchema.default([...HotelSearchPriorityOptions]),

  // Unified loyalty programs structure
  loyaltyPrograms: z.array(HotelLoyaltyProgramSchema).default([]),
});

/**
 * Car rental search priorities for ranking preferences
 */
export const CarRentalSearchPrioritiesSchema = z.array(CarSearchPriorityEnum);

/**
 * Car rental preferences cluster schema
 * ✅ SCHEMA-FIRST DEFAULTS: Sensible defaults embedded for immediate functionality
 */
export const CarRentalPreferencesSchema = z.object({
  preferredCarRentalCompanies: z.array(z.string()).default([]),
  preferredCarTypes: z.array(z.string()).default([]),
  searchPriorities: CarRentalSearchPrioritiesSchema.default([...CarSearchPriorityOptions]),

  // Unified loyalty programs structure
  loyaltyPrograms: z.array(CarRentalLoyaltyProgramSchema).default([]),
});

/**
 * Travel requirements cluster schema - important for filtering accessibility/dietary needs
 * CLEANED: Removed duplicate emergency contact and security programs (moved to TravelerProfileSchema)
 * ✅ SCHEMA-FIRST DEFAULTS: Sensible defaults embedded for immediate functionality
 */
export const TravelRequirementsSchema = z.object({
  // Enhanced dietary restrictions with standardized options
  dietaryRestrictions: z.array(DietaryRestrictionEnum).default([]),
  mealPreference: MealPreferenceEnum.optional(),

  // Enhanced accessibility needs with specific categories
  accessibilityNeeds: z.array(AccessibilityNeedEnum).default([]),

  // Enhanced special requests
  specialRequests: z.array(z.string()).default([]), // Seating preferences, early boarding, etc.
  medicalConditions: z.array(z.string()).default([]),
  petTravelPreference: z.boolean().default(false),
  travelInsurancePreference: z.boolean().default(false),
});

/**
 * Booking preferences cluster schema - key for budget/payment filtering
 * ✅ SCHEMA-FIRST DEFAULTS: Defaults embedded directly in schema for single source of truth
 */
export const BookingPreferencesSchema = z.object({
  budgetRangePreference: BookingBudgetRangeEnum.default('mid-range'),
  bookingLeadTime: z.number().min(1).max(365).default(14), // days in advance
  flexibleDatesPreference: z.boolean().default(false),
  loyaltyPointsStrategy: BookingLoyaltyStrategyEnum.default('maximize'), 
  upgradePreference: BookingUpgradePreferenceEnum.default('sometimes'),
  preferredPaymentMethods: z.array(z.string()).default([]),
  preferredCurrencies: z.array(z.string()).default(['USD']),
});

/**
 * Location intelligence schema for hometown and travel pattern analysis
 * CLEANED: Removed homeAirports (moved to TravelerProfileSchema.travelPreferences.homeAirport)
 */
export const LocationIntelligenceSchema = z.object({
  residenceIndicators: z.object({
    likelyCity: z.string().optional(),
    likelyState: z.string().optional(),
    likelyCountry: z.string().optional(),
    confidence: z.number()
  }).optional(),
  travelPatterns: z.object({
    domesticPercentage: z.number(),
    frequentDestinations: z.array(z.string()),
    travelFrequency: z.number()
  }).optional()
});

/**
 * Travel profile cluster schema - behavioral preferences for personalization
 */
export const TravelProfileSchema = z.object({
  businessTravelProfile: z.boolean().default(false),
  groupTravelPreference: z.boolean().default(false),
  travelPriorities: TravelPrioritiesSchema.optional(), // Not used in UI - keep optional
  preferredTravelTimes: PreferredTravelTimesSchema.optional(), // Not used in UI - keep optional
  locationIntelligence: LocationIntelligenceSchema.optional(),
});

/**
 * NEW: Dedicated traveler profile schema - consolidates all personal travel documents and emergency contacts
 * This replaces scattered fields and provides a clean, organized structure for booking auto-fill
 */
export const TravelerProfileSchema = z.object({
  // Primary emergency contact (for booking forms)
  emergencyContact: z.object({
    name: z.string().optional(),
    phone: z.string().optional(),
    relationship: z.string().optional(),
    email: z.string().optional(), // Additional field for comprehensive contact info
  }).default({}),

  // Travel documents and identification
  travelDocuments: z.object({
    // Passport information
    passport: z.object({
      number: z.string().optional(),
      expiryDate: optionalString(z.string().datetime()),
      issueDate: optionalString(z.string().datetime()),
      country: z.string().optional(), // Issuing country
      nationality: z.string().optional(), // Passport holder's nationality
    }).default({}),

    // Trusted traveler programs
    trustedTraveler: z.object({
      knownTravelerNumber: z.string().optional(), // TSA PreCheck/Global Entry KTN
      redressNumber: z.string().optional(), // DHS TRIP Redress Control Number
    }).default({}),

    // National ID / Driver's License (for domestic travel)
    nationalId: z.object({
      number: z.string().optional(),
      country: z.string().optional(),
      expiryDate: optionalString(z.string().datetime()),
    }).default({}),

    driversLicense: z.object({
      number: z.string().optional(),
      state: z.string().optional(),
      country: z.string().optional(),
      expiryDate: optionalString(z.string().datetime()),
    }).default({}),
  }).default(() => ({
    passport: {},
    trustedTraveler: {},
    nationalId: {},
    driversLicense: {},
  })),

  // Document preferences and reminders
  documentPreferences: z.object({
    passportExpirationReminder: z.boolean().default(true),
    visaRequirementCheck: z.boolean().default(true),
    documentBackupEnabled: z.boolean().default(false),
    preferredDocumentType: PreferredDocumentTypeEnum.optional(),
  }).default(() => ({
    passportExpirationReminder: true,
    visaRequirementCheck: true,
    documentBackupEnabled: false,
  })),

  // Travel preferences specific to the traveler
  travelPreferences: z.object({
    homeAirport: z.string().optional(), // Primary airport code (e.g., 'LAX', 'JFK')
  }).default({}),
});

/**
 * LEGACY: Personal information cluster schema - DEPRECATED
 * Use TravelerProfileSchema instead for new implementations
 * @deprecated Use TravelerProfileSchema for better organization
 */
export const PersonalInfoSchema = z.object({
  trustedTravelerNumber: z.string().optional(),
  passportNumber: z.string().optional(),
  passportExpiryDate: optionalString(z.string().datetime()),
  passportCountry: z.string().optional(),
  emergencyContactName: z.string().optional(),
  emergencyContactPhone: z.string().optional(),
  emergencyContactRelationship: z.string().optional(),
});

/**
 * Communication preferences cluster schema
 */
export const CommunicationPreferencesSchema = z.object({
  preferredContactMethod: CommunicationMethodEnum.default('email'),
  languagePreference: z.string().default('en'),
  timezonePreference: z.string().optional(), // Keep optional - frontend has undefined
  pushNotifications: z.boolean().default(true),
  emailNotifications: z.boolean().default(true),
});

// Export TypeScript type definitions derived from the schemas
export type TravelPriorities = z.infer<typeof TravelPrioritiesSchema>;
export type PreferredTravelTimes = z.infer<typeof PreferredTravelTimesSchema>;
export type Membership = z.infer<typeof MembershipSchema>;
export type TravelerProfile = z.infer<typeof TravelerProfileSchema>; // NEW: Consolidated traveler profile

// New loyalty program types
export type AirlineLoyaltyProgram = z.infer<typeof AirlineLoyaltyProgramSchema>;
export type HotelLoyaltyProgram = z.infer<typeof HotelLoyaltyProgramSchema>;
export type CarRentalLoyaltyProgram = z.infer<typeof CarRentalLoyaltyProgramSchema>;

// Legacy support - Membership aliases for backward compatibility
export type AirlineMembership = AirlineLoyaltyProgram;
export type HotelMembership = HotelLoyaltyProgram;
export type CarRentalMembership = CarRentalLoyaltyProgram;

// Updated preference types
export type FlightSearchPriorities = z.infer<typeof FlightSearchPrioritiesSchema>;
export type HotelSearchPriorities = z.infer<typeof HotelSearchPrioritiesSchema>;
export type CarRentalSearchPriorities = z.infer<typeof CarRentalSearchPrioritiesSchema>;
export type FlightPreferences = z.infer<typeof FlightPreferencesSchema>;
export type HotelPreferences = z.infer<typeof HotelPreferencesSchema>;
export type CarRentalPreferences = z.infer<typeof CarRentalPreferencesSchema>;
export type TravelRequirements = z.infer<typeof TravelRequirementsSchema>;
export type BookingPreferences = z.infer<typeof BookingPreferencesSchema>;
export type TravelProfile = z.infer<typeof TravelProfileSchema>;
export type PersonalInfo = z.infer<typeof PersonalInfoSchema>; // DEPRECATED: Use TravelerProfile instead
export type CommunicationPreferences = z.infer<typeof CommunicationPreferencesSchema>;
export type LocationIntelligence = z.infer<typeof LocationIntelligenceSchema>;
