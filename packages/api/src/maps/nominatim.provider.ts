import type { AddressSuggestion, GeocodingResult, GeoLocation, RouteResult } from "@the-ride/types";

import type { AutocompleteOptions, FetchLike, MapProviderClient } from "./provider.types";

export interface NominatimProviderConfig {
  /** @default fetch */
  fetchImpl?: FetchLike;
  /** @default "https://nominatim.openstreetmap.org" */
  geocodeBaseUrl?: string;
  /** @default "https://router.project-osrm.org" */
  routeBaseUrl?: string;
}

interface NominatimResult {
  place_id: number;
  lat: string;
  lon: string;
  display_name: string;
}

interface OsrmRouteResponse {
  code: string;
  routes: Array<{ distance: number; duration: number; geometry?: string }>;
}

function formatLatLng(location: GeoLocation): string {
  return `${location.lat},${location.lng}`;
}

function splitDisplayName(displayName: string): { mainText: string; secondaryText?: string } {
  const commaIndex = displayName.indexOf(",");
  if (commaIndex === -1) return { mainText: displayName };
  return {
    mainText: displayName.slice(0, commaIndex),
    secondaryText: displayName.slice(commaIndex + 1).trim(),
  };
}

/**
 * CLAYBA P0 BOOKING REPAIR — every environment (dev/staging/prod, web +
 * mobile) ships with `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`/
 * `NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN` blank (see `.env.*`), so
 * `GoogleMapsProvider`/`MapboxProvider` — both fully implemented — have
 * never actually been callable; every geocode/autocomplete/route call has
 * always failed and surfaced as "address lookup isn't available yet",
 * which silently blocked real Ride creation from `/book`. This provider
 * wraps Nominatim (OSM geocoding) + the public OSRM demo router — both
 * free and keyless — so the booking flow produces real coordinates and a
 * real route without needing anyone to provision paid credentials first.
 * `apps/web/src/lib/map-provider.ts` only selects this when no real
 * Google/Mapbox credential is configured, so adding a real key later is
 * still a pure config change, not a rewrite.
 *
 * NOT for production volume: Nominatim's usage policy caps public
 * instances at ~1 request/second and forbids autocomplete-style bulk
 * querying; the OSRM demo server carries the same "light use only"
 * expectation. Fine for DEV/QA verification; swap back to Google/Mapbox
 * (just supply the API key/token — no code change) before real launch
 * traffic.
 */
export class NominatimProvider implements MapProviderClient {
  private readonly fetchImpl: FetchLike;
  private readonly geocodeBaseUrl: string;
  private readonly routeBaseUrl: string;

  constructor(config: NominatimProviderConfig = {}) {
    // CLAYBA P0 BOOKING REPAIR — see google.provider.ts's constructor
    // comment: a bare `fetch` reference throws "Illegal invocation" when
    // called as `this.fetchImpl(...)`; `.bind(globalThis)` fixes it.
    this.fetchImpl = config.fetchImpl ?? fetch.bind(globalThis);
    this.geocodeBaseUrl = config.geocodeBaseUrl ?? "https://nominatim.openstreetmap.org";
    this.routeBaseUrl = config.routeBaseUrl ?? "https://router.project-osrm.org";
  }

  async autocomplete(query: string, options?: AutocompleteOptions): Promise<AddressSuggestion[]> {
    const params = new URLSearchParams({
      q: query,
      format: "jsonv2",
      addressdetails: "0",
      limit: "5",
    });
    if (options?.bias) {
      // Nominatim's `viewbox` + `bounded=0` biases (never restricts) toward
      // this area — same "bias, don't restrict" contract as the Google
      // provider's `location`/`radius`, and the interface's own doc comment.
      const { lat, lng, radiusMeters } = options.bias;
      const deltaDeg = (radiusMeters ?? 50_000) / 111_000;
      params.set(
        "viewbox",
        [lng - deltaDeg, lat + deltaDeg, lng + deltaDeg, lat - deltaDeg].join(","),
      );
      params.set("bounded", "0");
    }

    const response = await this.fetchImpl(`${this.geocodeBaseUrl}/search?${params.toString()}`);
    if (!response.ok) throw new Error(`Nominatim search failed with status ${response.status}`);

    const data = (await response.json()) as NominatimResult[];
    return data.map((result) => ({
      placeId: String(result.place_id),
      description: result.display_name,
      ...splitDisplayName(result.display_name),
    }));
  }

  async geocode(address: string): Promise<GeocodingResult> {
    const params = new URLSearchParams({ q: address, format: "jsonv2", limit: "1" });
    const response = await this.fetchImpl(`${this.geocodeBaseUrl}/search?${params.toString()}`);
    if (!response.ok) throw new Error(`Nominatim search failed with status ${response.status}`);

    const data = (await response.json()) as NominatimResult[];
    const result = data[0];
    if (!result) throw new Error(`No geocoding result for address "${address}"`);

    return {
      location: { lat: Number(result.lat), lng: Number(result.lon) },
      formattedAddress: result.display_name,
      placeId: String(result.place_id),
    };
  }

  async reverseGeocode(location: GeoLocation): Promise<GeocodingResult> {
    const params = new URLSearchParams({
      lat: String(location.lat),
      lon: String(location.lng),
      format: "jsonv2",
    });
    const response = await this.fetchImpl(`${this.geocodeBaseUrl}/reverse?${params.toString()}`);
    if (!response.ok)
      throw new Error(`Nominatim reverse geocode failed with status ${response.status}`);

    const result = (await response.json()) as NominatimResult & { error?: string };
    if (!result || result.error || !result.display_name)
      throw new Error(`No reverse geocoding result for location ${formatLatLng(location)}`);

    return {
      location: { lat: Number(result.lat), lng: Number(result.lon) },
      formattedAddress: result.display_name,
      placeId: result.place_id ? String(result.place_id) : undefined,
    };
  }

  async getRoute(
    origin: GeoLocation,
    destination: GeoLocation,
    waypoints: GeoLocation[] = [],
  ): Promise<RouteResult> {
    const coords = [origin, ...waypoints, destination]
      .map((point) => `${point.lng},${point.lat}`)
      .join(";");
    const params = new URLSearchParams({ overview: "full", geometries: "polyline" });
    const response = await this.fetchImpl(
      `${this.routeBaseUrl}/route/v1/driving/${coords}?${params.toString()}`,
    );
    if (!response.ok) throw new Error(`OSRM routing failed with status ${response.status}`);

    const data = (await response.json()) as OsrmRouteResponse;
    const route = data.routes[0];
    if (!route || data.code !== "Ok") throw new Error("No route found between the given points");

    return {
      distanceMeters: route.distance,
      durationSeconds: route.duration,
      polyline: route.geometry,
    };
  }
}
