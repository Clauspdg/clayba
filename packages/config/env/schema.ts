import { z } from "zod";

/**
 * The three environments The Ride runs in. Distinct from Node's own
 * `NODE_ENV` (which only distinguishes development/test/production) —
 * `APP_ENV` additionally distinguishes staging from production so a
 * staging deploy can still run with `NODE_ENV=production` optimizations.
 */
export const APP_ENVIRONMENTS = ["development", "staging", "production"] as const;
export type AppEnvironment = (typeof APP_ENVIRONMENTS)[number];

/**
 * Server-only variables required in every environment (Next.js server
 * code, Cloud Functions). Never expose these to client bundles — see
 * `packages/firebase/src/admin`, which consumes exactly this shape.
 */
export const serverEnvSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  APP_ENV: z.enum(APP_ENVIRONMENTS).default("development"),
  FIREBASE_PROJECT_ID: z.string().min(1),
  FIREBASE_CLIENT_EMAIL: z.string().email(),
  FIREBASE_PRIVATE_KEY: z.string().min(1),
});

export type ServerEnv = z.infer<typeof serverEnvSchema>;

/** apps/web and apps/admin (Next.js) read Firebase client config via `NEXT_PUBLIC_*`. */
export const nextPublicFirebaseEnvSchema = z.object({
  NEXT_PUBLIC_FIREBASE_API_KEY: z.string().min(1),
  NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: z.string().min(1),
  NEXT_PUBLIC_FIREBASE_PROJECT_ID: z.string().min(1),
  NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: z.string().min(1),
  NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: z.string().min(1),
  NEXT_PUBLIC_FIREBASE_APP_ID: z.string().min(1),
});

export type NextPublicFirebaseEnv = z.infer<typeof nextPublicFirebaseEnvSchema>;

/** apps/driver-app and apps/passenger-app (Expo) read Firebase client config via `EXPO_PUBLIC_*`. */
export const expoPublicFirebaseEnvSchema = z.object({
  EXPO_PUBLIC_FIREBASE_API_KEY: z.string().min(1),
  EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN: z.string().min(1),
  EXPO_PUBLIC_FIREBASE_PROJECT_ID: z.string().min(1),
  EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET: z.string().min(1),
  EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: z.string().min(1),
  EXPO_PUBLIC_FIREBASE_APP_ID: z.string().min(1),
});

export type ExpoPublicFirebaseEnv = z.infer<typeof expoPublicFirebaseEnvSchema>;

/**
 * Build-time metadata backing each app's Build Info screen (Sprint 4.6,
 * Part 6-7) — `@the-ride/types`'s `resolveBuildInfo()` assembles the
 * displayed values from exactly these vars. All optional: a local dev
 * build (no build-time injection) falls back to `resolveBuildInfo()`'s
 * own placeholders rather than failing validation. See docs/versioning.md.
 */
export const nextPublicBuildInfoEnvSchema = z.object({
  NEXT_PUBLIC_APP_ENV: z.enum(APP_ENVIRONMENTS).optional(),
  NEXT_PUBLIC_BUILD_COMMIT: z.string().optional(),
  NEXT_PUBLIC_BUILD_DATE: z.string().optional(),
});

export type NextPublicBuildInfoEnv = z.infer<typeof nextPublicBuildInfoEnvSchema>;

export const expoPublicBuildInfoEnvSchema = z.object({
  EXPO_PUBLIC_APP_ENV: z.enum(APP_ENVIRONMENTS).optional(),
  EXPO_PUBLIC_BUILD_COMMIT: z.string().optional(),
  EXPO_PUBLIC_BUILD_DATE: z.string().optional(),
});

export type ExpoPublicBuildInfoEnv = z.infer<typeof expoPublicBuildInfoEnvSchema>;
