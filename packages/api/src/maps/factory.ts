import { MapProvider } from "@the-ride/types";

import { GoogleMapsProvider } from "./google.provider";
import { MapboxProvider } from "./mapbox.provider";
import { NominatimProvider } from "./nominatim.provider";
import type { MapProviderClient } from "./provider.types";

export type MapProviderCredentials =
  | { provider: MapProvider.GOOGLE; apiKey: string }
  | { provider: MapProvider.MAPBOX; accessToken: string }
  | { provider: MapProvider.NOMINATIM };

/**
 * The one place that decides which concrete provider backs
 * `MapProviderClient` — switching providers platform-wide is a config
 * change here, not a rewrite of every call site. See docs/maps.md.
 */
export function createMapProvider(credentials: MapProviderCredentials): MapProviderClient {
  switch (credentials.provider) {
    case MapProvider.GOOGLE:
      return new GoogleMapsProvider({ apiKey: credentials.apiKey });
    case MapProvider.MAPBOX:
      return new MapboxProvider({ accessToken: credentials.accessToken });
    case MapProvider.NOMINATIM:
      return new NominatimProvider();
  }
}
