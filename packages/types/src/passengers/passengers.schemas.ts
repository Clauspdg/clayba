import { z } from "zod";

import { PassengerPaymentProvider } from "./passengers.enums";

export const passengerPaymentProviderSchema = z.nativeEnum(PassengerPaymentProvider);

export const passengerPreferencesSchema = z.object({
  language: z.string().default("en"),
  notificationsEnabled: z.boolean().default(true),
  smsEnabled: z.boolean().default(true),
  quietRideDefault: z.boolean().default(false),
});

export type PassengerPreferences = z.infer<typeof passengerPreferencesSchema>;

/**
 * Source of truth for the `passengers` collection document shape — the
 * passenger-specific profile that extends the shared `users` record
 * (`@the-ride/types` authentication domain) with rider-only data.
 */
export const passengerProfileSchema = z.object({
  id: z.string().min(1),
  userId: z.string().min(1),
  defaultPaymentMethodId: z.string().optional(),
  homeAddress: z.string().optional(),
  workAddress: z.string().optional(),
  preferences: passengerPreferencesSchema.default({
    language: "en",
    notificationsEnabled: true,
    smsEnabled: true,
    quietRideDefault: false,
  }),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type PassengerProfile = z.infer<typeof passengerProfileSchema>;

/** Source of truth for the `passengers/{passengerId}/favoritePlaces` subcollection. */
export const favoritePlaceSchema = z.object({
  id: z.string().min(1),
  passengerId: z.string().min(1),
  label: z.string().min(1),
  address: z.string().min(1),
  lat: z.number(),
  lng: z.number(),
  createdAt: z.date(),
});

export type FavoritePlace = z.infer<typeof favoritePlaceSchema>;

/** Source of truth for the `passengers/{passengerId}/paymentPreferences` subcollection. */
export const passengerPaymentPreferenceSchema = z.object({
  id: z.string().min(1),
  passengerId: z.string().min(1),
  provider: passengerPaymentProviderSchema,
  isDefault: z.boolean().default(false),
  createdAt: z.date(),
});

export type PassengerPaymentPreference = z.infer<typeof passengerPaymentPreferenceSchema>;
