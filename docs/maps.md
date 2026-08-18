# Maps

Sprint 3, Part 2. A provider-agnostic map client so switching between
Google Maps and Mapbox is a config change, not a rewrite.

## Provider abstraction

`MapProviderClient` (`packages/api/src/maps/provider.types.ts`):

```ts
interface MapProviderClient {
  autocomplete(query: string, options?: { sessionToken?: string }): Promise<AddressSuggestion[]>;
  geocode(address: string): Promise<GeocodingResult>;
  reverseGeocode(location: GeoLocation): Promise<GeocodingResult>;
  getRoute(
    origin: GeoLocation,
    destination: GeoLocation,
    waypoints?: GeoLocation[],
  ): Promise<RouteResult>;
}
```

`getRoute` covers route calculation, distance calculation, _and_ ETA
calculation in one call — that's how both Google Directions and Mapbox
Directions actually respond (`RouteResult` has `distanceMeters`,
`durationSeconds`, and an optional `polyline`), so the abstraction doesn't
force three round trips where a real provider only needs one.

Two concrete implementations — `GoogleMapsProvider` and `MapboxProvider`
(`packages/api/src/maps/{google,mapbox}.provider.ts`) — both call their
provider's REST API directly via `fetch` (injectable via a `fetchImpl`
constructor option, so both are unit-testable without a live network
call). `createMapProvider({ provider, apiKey | accessToken })`
(`factory.ts`) is the one place that decides which concrete class backs
the interface.

```ts
import { createMapProvider } from "@the-ride/api";
import { MapProvider } from "@the-ride/types";

const maps = createMapProvider({ provider: MapProvider.GOOGLE, apiKey });
// Switch platform-wide by changing this one call to:
// createMapProvider({ provider: MapProvider.MAPBOX, accessToken });
```

## Address autocomplete / geocoding / reverse geocoding

Used by the passenger app's Location Search screen
(`apps/passenger-app/src/app/booking/location-search.tsx`,
`apps/passenger-app/src/lib/map-provider.ts`): as the user types, results
come back as `AddressSuggestion[]`; selecting one calls `geocode()` to
resolve a real `GeoLocation`. No API key is configured in this
environment, so this call fails — the screen's error state is exactly
what a rider sees if a real key isn't set up yet (see "Empty/Loading/Error
states" in docs/ride-request.md).

BOOKING-UX-01 wired the same `autocomplete()`/`geocode()` calls into the
web `/book` destination field (`apps/web/src/app/(passenger)/book/page.tsx`)
— debounced ~300ms, same `AddressSuggestion` results, same
select-a-suggestion-then-`geocode()`-its-description pattern as the
passenger-app screen above. No second provider or search architecture —
`apps/web/src/lib/map-provider.ts` already exposed the same
`MapProviderClient`, it just wasn't called from web yet.

## Route/distance/ETA calculation

The Vehicle Selection screen (`apps/passenger-app/src/app/booking/vehicle.tsx`)
calls `getRoute()` once pickup and destination are both chosen. If it
fails (no provider configured, network error), it falls back to
`@the-ride/utils`'s `haversineDistanceMeters` + `estimateEtaSeconds` — a
straight-line estimate — so the booking flow still works end to end
without live map credentials. This is the same fallback the dispatch
engine uses for ranking (see docs/dispatch-engine.md) — provider-independent
geo math lives once, in `packages/utils/src/trips/distance.ts`.

## Map markers — why a static image, not a full map SDK

Part 2 asks for pickup/destination/stop markers. Rendering a real
interactive map (pan/zoom) would mean adding a full map SDK to every app —
`@react-google-maps/api` or `mapbox-gl`/`react-map-gl` for the two Next.js
apps, `react-native-maps` or `@rnmapbox/maps` for the two Expo apps.
`react-native-maps` needs native config plugin setup and
`@rnmapbox/maps` doesn't work in Expo Go at all (it needs a custom dev
client) — a real risk to `pnpm dev` continuing to boot every app cleanly,
which this sprint must not regress.

Instead, `buildStaticMapUrl()` (`packages/api/src/maps/static-map.ts`)
builds a **static map image URL** (Google Static Maps API / Mapbox Static
Images API) with pickup/destination/stop pins baked in server-side. It
renders as a plain `<img>`/`<Image>` — identical code path on web and
native, zero new native dependencies. This is the right scope for a
booking _preview_ (this sprint explicitly excludes live tracking/GPS
streaming, which is what would actually need a real interactive map SDK)
— see the "Strict Rules" in this sprint's brief.

## Environment variables

See `.env.example`'s "Maps & Geolocation" section: `MAP_PROVIDER` selects
google/mapbox; each provider has a client-safe key (`NEXT_PUBLIC_*` /
`EXPO_PUBLIC_*`) and, for Google, a server-only key. No real keys are
configured in this environment — every code path above has a documented,
tested fallback for that case.

## Related Docs

- [Ride Request](./ride-request.md)
- [Dispatch Engine](./dispatch-engine.md)
