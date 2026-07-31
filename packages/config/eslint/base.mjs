// Shared base ESLint rules used by every app and package in the monorepo.
// App-specific configs (Next.js, React Native/Expo, Node/Cloud Functions)
// import and extend this array.
import js from "@eslint/js";
import tseslint from "typescript-eslint";
import globals from "globals";

export const baseConfig = [
  {
    ignores: [
      "**/node_modules/**",
      "**/dist/**",
      "**/build/**",
      "**/.next/**",
      "**/.expo/**",
      "**/.turbo/**",
      "**/coverage/**",
      "**/lib/**",
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ["**/*.js", "**/*.cjs", "**/*.mjs"],
    languageOptions: {
      globals: {
        ...globals.node,
      },
    },
    rules: {
      // Node-executed config files (babel.config.js, metro.config.js, postcss.config.js)
      // are loaded via CommonJS and cannot use ESM import syntax.
      "@typescript-eslint/no-require-imports": "off",
    },
  },
  {
    rules: {
      "no-console": ["warn", { allow: ["warn", "error"] }],
      "no-unused-vars": "off",
      "@typescript-eslint/no-unused-vars": [
        "warn",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
      "@typescript-eslint/consistent-type-imports": "warn",
    },
  },
];
