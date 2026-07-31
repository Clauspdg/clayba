import { z } from "zod";

import { geoLocationSchema } from "../trips/trips.schemas";
import { MapProvider } from "./maps.enums";

export const mapProviderSchema = z.nativeEnum(MapProvider);

/** One result row from address autocomplete. */
export const addressSuggestionSchema = z.object({
  placeId: z.string().min(1),
  description: z.string().min(1),
  mainText: z.string().min(1),
  secondaryText: z.string().optional(),
});

export type AddressSuggestion = z.infer<typeof addressSuggestionSchema>;

/** Result of geocoding a free-text address (or reverse-geocoding a coordinate). */
export const geocodingResultSchema = z.object({
  location: geoLocationSchema,
  formattedAddress: z.string().min(1),
  placeId: z.string().optional(),
});

export type GeocodingResult = z.infer<typeof geocodingResultSchema>;

/**
 * Result of a route calculation. Distance/duration/ETA are all part of
 * this one result because that's how both Google Directions and Mapbox
 * Directions actually respond — see docs/maps.md.
 */
export const routeResultSchema = z.object({
  distanceMeters: z.number().min(0),
  durationSeconds: z.number().min(0),
  /** Encoded polyline (Google's polyline5 algorithm — Mapbox routes are re-encoded into the same format by our provider so consumers never care which provider produced it). */
  polyline: z.string().optional(),
});

export type RouteResult = z.infer<typeof routeResultSchema>;
