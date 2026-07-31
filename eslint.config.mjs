// Root ESLint flat config (ESLint 9+).
// Each app/package extends this base and layers its own environment-specific rules
// (Next.js, React Native, or Node) via packages/config/eslint/*.
import { baseConfig } from "./packages/config/eslint/base.mjs";

export default [
  {
    ignores: [
      "**/node_modules/**",
      "**/dist/**",
      "**/build/**",
      "**/.next/**",
      "**/.expo/**",
      "**/coverage/**",
      "**/.turbo/**",
    ],
  },
  ...baseConfig,
];
