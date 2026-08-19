/** Which third-party map provider is backing `@the-ride/api`'s map client — see docs/maps.md. */
export enum MapProvider {
  GOOGLE = "google",
  MAPBOX = "mapbox",
  /** Free, keyless OpenStreetMap-backed provider (Nominatim + OSRM demo server) — dev/QA fallback only when no Google/Mapbox credential is configured; not for production volume. See `nominatim.provider.ts`. */
  NOMINATIM = "nominatim",
}
