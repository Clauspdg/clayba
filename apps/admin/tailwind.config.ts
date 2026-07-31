import type { Config } from "tailwindcss";
import { baseTailwindConfig } from "@the-ride/config/tailwind/base";

const config: Config = {
  ...baseTailwindConfig,
  content: [
    "./src/**/*.{ts,tsx}",
    "../../packages/ui/src/**/*.{ts,tsx}",
  ],
} as Config;

export default config;
