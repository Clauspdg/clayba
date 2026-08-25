import type { AddressSuggestion, GeocodingResult, GeoLocation, RouteResult } from "@the-ride/types";

import type { AutocompleteOptions, FetchLike, MapProviderClient } from "./provider.types";

export interface GoogleMapsProviderConfig {
  apiKey: string;
  /** @default fetch */
  fetchImpl?: FetchLike;
  /** @default "https://maps.googleapis.com/maps/api" */
  baseUrl?: string;
}

interface GooglePlacesAutocompleteResponse {
  predictions: Array<{
    place_id: string;
    description: string;
    structured_formatting?: { main_text: string; secondary_text?: string };
  }>;
  status: string;
  error_message?: string;
}

interface GoogleGeocodingResponse {
  results: Array<{
    formatted_address: string;
    place_id: string;
    geometry: { location: { lat: number; lng: number } };
  }>;
  status: string;
  error_message?: string;
}

/**
 * Google's Places/Geocoding APIs return HTTP 200 even for a rejected
 * request — a missing/invalid/restricted API key comes back as
 * `{"predictions": [], "status": "REQUEST_DENIED", "error_message": "..."}`,
 * not an HTTP error. Every caller here used to only check `response.ok`
 * and then map `predictions`/`results` directly, so a bad key silently
 * became "zero results" — indistinguishable in the UI from a real empty
 * search (confirmed root cause of "Nassau" returning no results with a
 * blank key). `"ZERO_RESULTS"` is the one non-`"OK"` status that IS a
 * real empty result, not a failure, and must not throw.
 */
function assertGoogleStatusOk(
  status: string,
  errorMessage: string | undefined,
  context: string,
): void {
  if (status === "OK" || status === "ZERO_RESULTS") return;
  throw new Error(
    `Google ${context} failed with status ${status}${errorMessage ? `: ${errorMessage}` : ""}`,
  );
}

interface GoogleDirectionsResponse {
  routes: Array<{
    legs: Array<{ distance: { value: number }; duration: { value: number } }>;
    overview_polyline?: { points: string };
  }>;
}

function formatLatLng(location: GeoLocation): string {
  return `${location.lat},${location.lng}`;
}

/** Calls the Google Places/Geocoding/Directions REST APIs. Requires a server-side API key (`GOOGLE_MAPS_SERVER_API_KEY`) — see .env.example. */
export class GoogleMapsProvider implements MapProviderClient {
  private readonly apiKey: string;
  private readonly fetchImpl: FetchLike;
  private readonly baseUrl: string;

  constructor(config: GoogleMapsProviderConfig) {
    this.apiKey = config.apiKey;
    // CLAYBA P0 BOOKING REPAIR — a bare `fetch` reference stored on `this`
    // and later invoked as `this.fetchImpl(...)` throws "Failed to execute
    // 'fetch' on 'Window': Illegal invocation" in the browser (native
    // `fetch` requires `this === window`/the global scope). This silently
    // broke every real geocode/autocomplete/route call regardless of API
    // key — `.bind(globalThis)` keeps the right receiver.
    this.fetchImpl = config.fetchImpl ?? fetch.bind(globalThis);
    this.baseUrl = config.baseUrl ?? "https://maps.googleapis.com/maps/api";
  }

  async autocomplete(query: string, options?: AutocompleteOptions): Promise<AddressSuggestion[]> {
    const params = new URLSearchParams({ input: query, key: this.apiKey });
    if (options?.sessionToken) params.set("sessiontoken", options.sessionToken);
    if (options?.bias) {
      // `location` + `radius` BIAS ranking toward this area (no `strictbounds`,
      // so broader/global matches still come back — see `AutocompleteOptions`).
      params.set("location", formatLatLng(options.bias));
      params.set("radius", String(options.bias.radiusMeters ?? 50_000));
    }

    const response = await this.fetchImpl(
      `${this.baseUrl}/place/autocomplete/json?${params.toString()}`,
    );
    if (!response.ok)
      throw new Error(`Google Places Autocomplete failed with status ${response.status}`);

    const data = (await response.json()) as GooglePlacesAutocompleteResponse;
    assertGoogleStatusOk(data.status, data.error_message, "Places Autocomplete");
    return data.predictions.map((prediction) => ({
      placeId: prediction.place_id,
      description: prediction.description,
      mainText: prediction.structured_formatting?.main_text ?? prediction.description,
      secondaryText: prediction.structured_formatting?.secondary_text,
    }));
  }

  async geocode(address: string): Promise<GeocodingResult> {
    const params = new URLSearchParams({ address, key: this.apiKey });
    const response = await this.fetchImpl(`${this.baseUrl}/geocode/json?${params.toString()}`);
    if (!response.ok) throw new Error(`Google Geocoding failed with status ${response.status}`);

    const data = (await response.json()) as GoogleGeocodingResponse;
    assertGoogleStatusOk(data.status, data.error_message, "Geocoding");
    const result = data.results[0];
    if (!result) throw new Error(`No geocoding result for address "${address}"`);

    return {
      location: { lat: result.geometry.location.lat, lng: result.geometry.location.lng },
      formattedAddress: result.formatted_address,
      placeId: result.place_id,
    };
  }

  async reverseGeocode(location: GeoLocation): Promise<GeocodingResult> {
    const params = new URLSearchParams({ latlng: formatLatLng(location), key: this.apiKey });
    const response = await this.fetchImpl(`${this.baseUrl}/geocode/json?${params.toString()}`);
    if (!response.ok)
      throw new Error(`Google Reverse Geocoding failed with status ${response.status}`);

    const data = (await response.json()) as GoogleGeocodingResponse;
    assertGoogleStatusOk(data.status, data.error_message, "Reverse Geocoding");
    const result = data.results[0];
    if (!result)
      throw new Error(`No reverse geocoding result for location ${formatLatLng(location)}`);

    return {
      location: { lat: result.geometry.location.lat, lng: result.geometry.location.lng },
      formattedAddress: result.formatted_address,
      placeId: result.place_id,
    };
  }

  async getRoute(
    origin: GeoLocation,
    destination: GeoLocation,
    waypoints: GeoLocation[] = [],
  ): Promise<RouteResult> {
    const params = new URLSearchParams({
      origin: formatLatLng(origin),
      destination: formatLatLng(destination),
      key: this.apiKey,
    });
    if (waypoints.length > 0) params.set("waypoints", waypoints.map(formatLatLng).join("|"));

    const response = await this.fetchImpl(`${this.baseUrl}/directions/json?${params.toString()}`);
    if (!response.ok) throw new Error(`Google Directions failed with status ${response.status}`);

    const data = (await response.json()) as GoogleDirectionsResponse;
    const route = data.routes[0];
    if (!route) throw new Error("No route found between the given points");

    const distanceMeters = route.legs.reduce((sum, leg) => sum + leg.distance.value, 0);
    const durationSeconds = route.legs.reduce((sum, leg) => sum + leg.duration.value, 0);

    return { distanceMeters, durationSeconds, polyline: route.overview_polyline?.points };
  }
}
