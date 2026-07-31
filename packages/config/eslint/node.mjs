// ESLint config for Node environments (Firebase Cloud Functions).
import { baseConfig } from "./base.mjs";

export const nodeConfig = [
  ...baseConfig,
  {
    rules: {
      "@typescript-eslint/no-var-requires": "off",
    },
  },
];
