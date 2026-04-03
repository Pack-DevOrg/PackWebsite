import { z } from "zod";
import {
  BookingPreferencesSchema,
  CarRentalPreferencesSchema,
  CommunicationPreferencesSchema,
  FlightPreferencesSchema,
  HotelPreferencesSchema,
  PersonalInfoSchema,
  TravelProfileSchema,
  TravelRequirementsSchema,
  TravelerProfileSchema,
} from "./travel-preferences";

export const UserPreferencesSchema = z.object({
  sub: z.string().default(""),
  email: z.string().default(""),
  createdAt: z.string().datetime().optional(),
  updatedAt: z.string().datetime().optional(),
  version: z.number().optional(),
  flightPreferences: FlightPreferencesSchema.default({}),
  hotelPreferences: HotelPreferencesSchema.default({}),
  carRentalPreferences: CarRentalPreferencesSchema.default({}),
  travelRequirements: TravelRequirementsSchema.default({}),
  bookingPreferences: BookingPreferencesSchema.default({}),
  travelProfile: TravelProfileSchema.default({}),
  travelerProfile: TravelerProfileSchema.default({}),
  personalInfo: PersonalInfoSchema.optional(),
  communicationPreferences: CommunicationPreferencesSchema.default({}),
});

export type UserPreferences = z.infer<typeof UserPreferencesSchema>;

export const createDefaultUserPreferences = (sub = "", email = ""): UserPreferences =>
  UserPreferencesSchema.parse({
    sub,
    email,
  });
