import { MapProvider } from "@the-ride/types";
import { createMapProvider, type MapProviderClient } from "@the-ride/api";

/**
 * Wires `@the-ride/api`'s provider-agnostic map client for this app.
 * `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`/`NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN` are
 * blank in every environment as of FLOW-01B, which silently made real
 * geocoding impossible from `/book` (P0 BOOKING ROUTING REPAIR). Prefers
 * a real configured credential when one exists (Google, then Mapbox — a
 * pure env-var change, no code change, restores the original provider);
 * falls back to the free, keyless `NominatimProvider` so address lookup
 * and route calculation actually work in the meantime. See
 * `nominatim.provider.ts` for why that fallback isn't production-grade.
 */
let cachedProvider: MapProviderClient | undefined;

export function getMapProvider(): MapProviderClient {
  if (!cachedProvider) {
    const googleKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;
    if (googleKey) {
      cachedProvider = createMapProvider({ provider: MapProvider.GOOGLE, apiKey: googleKey });
    } else if (mapboxToken) {
      cachedProvider = createMapProvider({
        provider: MapProvider.MAPBOX,
        accessToken: mapboxToken,
      });
    } else {
      cachedProvider = createMapProvider({ provider: MapProvider.NOMINATIM });
    }
  }
  return cachedProvider;
}
