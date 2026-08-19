import type { AddressSuggestion, GeocodingResult, GeoLocation, RouteResult } from "@the-ride/types";

import type { AutocompleteOptions, FetchLike, MapProviderClient } from "./provider.types";

export interface MapboxProviderConfig {
  accessToken: string;
  /** @default fetch */
  fetchImpl?: FetchLike;
  /** @default "https://api.mapbox.com" */
  baseUrl?: string;
}

interface MapboxGeocodingFeature {
  id: string;
  place_name: string;
  text: string;
  center: [number, number]; // [lng, lat]
}

interface MapboxGeocodingResponse {
  features: MapboxGeocodingFeature[];
}

interface MapboxDirectionsResponse {
  routes: Array<{ distance: number; duration: number; geometry?: string }>;
}

function formatLngLat(location: GeoLocation): string {
  return `${location.lng},${location.lat}`;
}

/** Calls the Mapbox Geocoding/Directions v5 REST APIs. Requires `MAPBOX_ACCESS_TOKEN` — see .env.example. */
export class MapboxProvider implements MapProviderClient {
  private readonly accessToken: string;
  private readonly fetchImpl: FetchLike;
  private readonly baseUrl: string;

  constructor(config: MapboxProviderConfig) {
    this.accessToken = config.accessToken;
    // CLAYBA P0 BOOKING REPAIR — see google.provider.ts's constructor
    // comment: a bare `fetch` reference throws "Illegal invocation" when
    // called as `this.fetchImpl(...)`; `.bind(globalThis)` fixes it.
    this.fetchImpl = config.fetchImpl ?? fetch.bind(globalThis);
    this.baseUrl = config.baseUrl ?? "https://api.mapbox.com";
  }

  private toAddressSuggestion(feature: MapboxGeocodingFeature): AddressSuggestion {
    const secondaryText = feature.place_name.startsWith(feature.text)
      ? feature.place_name.slice(feature.text.length).replace(/^,\s*/, "")
      : undefined;
    return {
      placeId: feature.id,
      description: feature.place_name,
      mainText: feature.text,
      secondaryText,
    };
  }

  private toGeocodingResult(feature: MapboxGeocodingFeature): GeocodingResult {
    return {
      location: { lat: feature.center[1], lng: feature.center[0] },
      formattedAddress: feature.place_name,
      placeId: feature.id,
    };
  }

  async autocomplete(query: string, options?: AutocompleteOptions): Promise<AddressSuggestion[]> {
    const params = new URLSearchParams({ access_token: this.accessToken, autocomplete: "true" });
    if (options?.sessionToken) params.set("session_token", options.sessionToken);
    // Mapbox has no radius knob for `proximity` — it's a pure ranking bias,
    // never a hard filter, so `radiusMeters` (if given) is a no-op here.
    if (options?.bias) params.set("proximity", `${options.bias.lng},${options.bias.lat}`);

    const response = await this.fetchImpl(
      `${this.baseUrl}/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?${params.toString()}`,
    );
    if (!response.ok)
      throw new Error(`Mapbox Geocoding (autocomplete) failed with status ${response.status}`);

    const data = (await response.json()) as MapboxGeocodingResponse;
    return data.features.map((feature) => this.toAddressSuggestion(feature));
  }

  async geocode(address: string): Promise<GeocodingResult> {
    const params = new URLSearchParams({ access_token: this.accessToken, limit: "1" });
    const response = await this.fetchImpl(
      `${this.baseUrl}/geocoding/v5/mapbox.places/${encodeURIComponent(address)}.json?${params.toString()}`,
    );
    if (!response.ok) throw new Error(`Mapbox Geocoding failed with status ${response.status}`);

    const data = (await response.json()) as MapboxGeocodingResponse;
    const feature = data.features[0];
    if (!feature) throw new Error(`No geocoding result for address "${address}"`);
    return this.toGeocodingResult(feature);
  }

  async reverseGeocode(location: GeoLocation): Promise<GeocodingResult> {
    const params = new URLSearchParams({ access_token: this.accessToken, limit: "1" });
    const response = await this.fetchImpl(
      `${this.baseUrl}/geocoding/v5/mapbox.places/${formatLngLat(location)}.json?${params.toString()}`,
    );
    if (!response.ok)
      throw new Error(`Mapbox Reverse Geocoding failed with status ${response.status}`);

    const data = (await response.json()) as MapboxGeocodingResponse;
    const feature = data.features[0];
    if (!feature)
      throw new Error(`No reverse geocoding result for location ${formatLngLat(location)}`);
    return this.toGeocodingResult(feature);
  }

  async getRoute(
    origin: GeoLocation,
    destination: GeoLocation,
    waypoints: GeoLocation[] = [],
  ): Promise<RouteResult> {
    const coordinates = [origin, ...waypoints, destination].map(formatLngLat).join(";");
    const params = new URLSearchParams({
      access_token: this.accessToken,
      geometries: "polyline",
      overview: "simplified",
    });

    const response = await this.fetchImpl(
      `${this.baseUrl}/directions/v5/mapbox/driving/${coordinates}?${params.toString()}`,
    );
    if (!response.ok) throw new Error(`Mapbox Directions failed with status ${response.status}`);

    const data = (await response.json()) as MapboxDirectionsResponse;
    const route = data.routes[0];
    if (!route) throw new Error("No route found between the given points");

    return {
      distanceMeters: route.distance,
      durationSeconds: route.duration,
      polyline: route.geometry,
    };
  }
}
