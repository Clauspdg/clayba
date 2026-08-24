import type { ConfigContext, ExpoConfig } from "expo/config";

/**
 * `app.json` stays the static source of truth for everything that never
 * needs a runtime value; this file only exists to inject the Android
 * Google Maps API key from `EXPO_PUBLIC_GOOGLE_MAPS_API_KEY`
 * (`.env.local`) at prebuild time — a plain `app.json` cannot read
 * environment variables. Currently empty in `.env.local`/`.env.example`:
 * the map renders a safe placeholder instead of live tiles until a real
 * key is set — see `.env.example` for how to provision one. Once a key
 * is set, `expo prebuild` alone regenerates a correct AndroidManifest.xml
 * with the real `com.google.android.geo.API_KEY` meta-data tag — no
 * further code changes needed.
 */
export default ({ config }: ConfigContext): ExpoConfig => ({
  ...(config as ExpoConfig),
  android: {
    ...config.android,
    config: {
      ...config.android?.config,
      googleMaps: {
        apiKey: process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY ?? "",
      },
    },
  },
});
