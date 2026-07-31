import { MapProvider, type GeoLocation } from "@the-ride/types";

import type { MapProviderCredentials } from "./factory";

export interface StaticMapMarker {
  location: GeoLocation;
  /** Hex color, without the `#` (e.g. `"0F62FE"`). */
  color: string;
  /** Single-character label, e.g. "P" for pickup, "D" for destination. */
  label: string;
}

export interface BuildStaticMapUrlOptions {
  markers: StaticMapMarker[];
  width?: number;
  height?: number;
}

/**
 * Builds a static map image URL (pickup/destination/stop markers baked
 * into a single `<img>`) rather than embedding a full interactive map
 * SDK — see docs/maps.md for why this is the right scope for a booking
 * *preview* (no pan/zoom/live tracking needed yet, and it works
 * identically as an `<img>`/`<Image>` on web and native with zero extra
 * native dependencies).
 */
export function buildStaticMapUrl(credentials: MapProviderCredentials, { markers, width = 600, height = 300 }: BuildStaticMapUrlOptions): string {
  if (credentials.provider === MapProvider.GOOGLE) {
    const params = new URLSearchParams({ size: `${width}x${height}`, key: credentials.apiKey });
    for (const marker of markers) {
      params.append("markers", `color:0x${marker.color}|label:${marker.label}|${marker.location.lat},${marker.location.lng}`);
    }
    return `https://maps.googleapis.com/maps/api/staticmap?${params.toString()}`;
  }

  const overlay = markers.map((marker) => `pin-s-${marker.label.toLowerCase()}+${marker.color}(${marker.location.lng},${marker.location.lat})`).join(",");
  const params = new URLSearchParams({ access_token: credentials.accessToken });
  return `https://api.mapbox.com/styles/v1/mapbox/streets-v12/static/${overlay}/auto/${width}x${height}?${params.toString()}`;
}
