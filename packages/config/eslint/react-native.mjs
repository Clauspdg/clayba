// ESLint config for Expo / React Native apps (driver-app, passenger-app).
import { baseConfig } from "./base.mjs";

export const reactNativeConfig = [
  ...baseConfig,
  {
    rules: {
      "@typescript-eslint/no-explicit-any": "warn",
    },
  },
];
