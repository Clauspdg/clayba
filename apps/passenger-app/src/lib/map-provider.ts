import { MapProvider } from "@the-ride/types";
import { createMapProvider, type MapProviderClient } from "@the-ride/api";

/**
 * Wires `@the-ride/api`'s provider-agnostic map client to this app's
 * client-safe Google Maps key (`EXPO_PUBLIC_GOOGLE_MAPS_API_KEY` — see
 * .env.example). Same has-key fallback as `apps/web/src/lib/map-provider.ts`:
 * this previously hardcoded `MapProvider.GOOGLE` unconditionally, so with
 * no key configured every geocode/autocomplete call silently returned zero
 * results (a blank/invalid Google key comes back as HTTP 200 with
 * `status: "REQUEST_DENIED"`, not an error — confirmed root cause of
 * "Nassau" returning no results). Prefers a real configured credential
 * when one exists (Google, then Mapbox — a pure env-var change, no code
 * change); falls back to the free, keyless `NominatimProvider` so address
 * search actually works in the meantime. See docs/maps.md.
 */
let cachedProvider: MapProviderClient | undefined;

export function getMapProvider(): MapProviderClient {
  if (!cachedProvider) {
    const googleKey = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY;
    const mapboxToken = process.env.EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN;
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
