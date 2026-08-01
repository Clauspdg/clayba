import { MapProvider } from "@the-ride/types";
import { createMapProvider, type MapProviderClient } from "@the-ride/api";

/**
 * Wires `@the-ride/api`'s provider-agnostic map client to this app's
 * client-safe Google Maps key (`EXPO_PUBLIC_GOOGLE_MAPS_API_KEY` — see
 * .env.example). Swapping to Mapbox platform-wide is a one-line change
 * here, not a rewrite of the booking screens that call `getMapProvider()`
 * — see docs/maps.md.
 */
let cachedProvider: MapProviderClient | undefined;

export function getMapProvider(): MapProviderClient {
  if (!cachedProvider) {
    cachedProvider = createMapProvider({ provider: MapProvider.GOOGLE, apiKey: process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY ?? "" });
  }
  return cachedProvider;
}
