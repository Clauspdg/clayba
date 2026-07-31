#!/usr/bin/env node
// -----------------------------------------------------------------------------
// The Ride — Staging/Production Hosting Prep (Sprint 4.6, Parts 8-9)
//
// Loads the matching root .env.<environment> file (Next.js does not
// auto-load a file named ".env.staging" the way it does ".env.production",
// so builds must go through this script rather than `next build` directly
// — see docs/versioning.md), builds web+admin against it, then PRINTS the
// `firebase deploy` command rather than running it. Pass --deploy to
// actually run it — the default is dry-run so `pnpm staging`/`pnpm production`
// can never deploy by accident (Part 9: "do not deploy, only prepare").
//
// Usage:
//   node scripts/deploy-hosting.mjs <staging|production> [--deploy]
// -----------------------------------------------------------------------------
import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { getBuildDate, getCommit } from "./version.mjs";

const root = path.resolve(fileURLToPath(import.meta.url), "..", "..");

const PROJECT_BY_ENVIRONMENT = {
  staging: "the-ride-staging",
  // Matches the alias already defined in .firebaserc — the real Firebase
  // project ID is "the-ride-prod", not "the-ride-production".
  production: "the-ride-prod",
};

function loadEnvFile(environment) {
  const envPath = path.join(root, `.env.${environment}`);
  if (!existsSync(envPath)) {
    throw new Error(`Missing ${envPath}`);
  }
  // Node 20.6+ built-in — avoids adding a dotenv dependency just for this.
  process.loadEnvFile(envPath);
}

function run(command, args) {
  console.log(`\n$ ${command} ${args.join(" ")}`);
  execFileSync(command, args, { cwd: root, stdio: "inherit", shell: process.platform === "win32" });
}

function main() {
  const [environment] = process.argv.slice(2);
  const deploy = process.argv.includes("--deploy");

  if (!["staging", "production"].includes(environment)) {
    console.error("Usage: node scripts/deploy-hosting.mjs <staging|production> [--deploy]");
    process.exitCode = 1;
    return;
  }

  loadEnvFile(environment);
  process.env.NEXT_PUBLIC_BUILD_COMMIT = process.env.NEXT_PUBLIC_BUILD_COMMIT || getCommit();
  process.env.NEXT_PUBLIC_BUILD_DATE = process.env.NEXT_PUBLIC_BUILD_DATE || getBuildDate();

  console.log(`==> Building web + admin for ${environment} (project: ${PROJECT_BY_ENVIRONMENT[environment]})`);
  run("pnpm", ["turbo", "run", "build", "--filter=@the-ride/web", "--filter=@the-ride/admin"]);

  const project = PROJECT_BY_ENVIRONMENT[environment];
  const deployArgs = ["deploy", "--only", "hosting", "--project", project];

  if (!deploy) {
    console.log(`\n==> Dry run — build complete. To actually deploy, run:`);
    console.log(`    firebase ${deployArgs.join(" ")}`);
    console.log(`\n    (or re-run this script with --deploy)`);
    return;
  }

  console.log(`\n==> Deploying hosting to ${project}...`);
  run("firebase", deployArgs);
}

main();
