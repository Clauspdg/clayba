import { MapProvider } from "@the-ride/types";
import { createMapProvider, type MapProviderClient } from "@the-ride/api";

/**
 * Wires `@the-ride/api`'s provider-agnostic map client to this app's
 * client-safe Google Maps key (`NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` — see
 * .env.example), mirroring `apps/passenger-app/src/lib/map-provider.ts`.
 * Unconfigured (blank key) in every environment as of FLOW-01B — callers
 * must treat `geocode`/`reverseGeocode` failures as an expected, honest
 * "address lookup unavailable" outcome, not a bug.
 */
let cachedProvider: MapProviderClient | undefined;

export function getMapProvider(): MapProviderClient {
  if (!cachedProvider) {
    cachedProvider = createMapProvider({
      provider: MapProvider.GOOGLE,
      apiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? "",
    });
  }
  return cachedProvider;
}
