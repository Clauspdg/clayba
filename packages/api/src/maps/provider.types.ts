import type { AddressSuggestion, GeocodingResult, GeoLocation, RouteResult } from "@the-ride/types";

/**
 * Provider-agnostic map client contract (Sprint 3, Part 2). Every screen
 * and service in the platform should depend on this interface, never on
 * `GoogleMapsProvider`/`MapboxProvider` directly — that's what makes
 * switching providers a config change instead of a rewrite. See
 * docs/maps.md.
 */
export interface AutocompleteOptions {
  sessionToken?: string;
  /** Biases (does not restrict) results toward this area — e.g. Nassau/Bahamas for Clayba's current launch market. Broader searches still return results. */
  bias?: { lat: number; lng: number; radiusMeters?: number };
}

export interface MapProviderClient {
  autocomplete(query: string, options?: AutocompleteOptions): Promise<AddressSuggestion[]>;
  geocode(address: string): Promise<GeocodingResult>;
  reverseGeocode(location: GeoLocation): Promise<GeocodingResult>;
  /** Also serves the "distance calculation" and "ETA calculation" requirements — both come back on `RouteResult`. */
  getRoute(
    origin: GeoLocation,
    destination: GeoLocation,
    waypoints?: GeoLocation[],
  ): Promise<RouteResult>;
}

/** Matches the global `fetch` signature — injectable so providers are unit-testable without a live network call. */
export type FetchLike = (
  input: string,
  init?: { signal?: AbortSignal },
) => Promise<{ ok: boolean; status: number; json(): Promise<unknown> }>;
