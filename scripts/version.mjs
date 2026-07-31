#!/usr/bin/env node
// -----------------------------------------------------------------------------
// The Ride — Version System (Sprint 4.6, Part 6)
//
// `packages/types/src/version.ts` is the single source of truth for
// major/minor/patch and each native app's Android versionCode. This script
// reads it, and (on `bump`) rewrites it plus the two Expo `app.json` files
// together so the TypeScript runtime constant and the EAS build config
// (which reads `app.json`, not `version.ts`) never drift apart.
//
// Usage:
//   node scripts/version.mjs show [--json]
//   node scripts/version.mjs bump <major|minor|patch>
// -----------------------------------------------------------------------------
import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.resolve(fileURLToPath(import.meta.url), "..", "..");
const versionTsPath = path.join(root, "packages", "types", "src", "version.ts");
const appJsonPaths = {
  driver: path.join(root, "apps", "driver-app", "app.json"),
  passenger: path.join(root, "apps", "passenger-app", "app.json"),
};

function readVersionTs() {
  const source = readFileSync(versionTsPath, "utf8");
  const major = Number(source.match(/major:\s*(\d+)/)?.[1]);
  const minor = Number(source.match(/minor:\s*(\d+)/)?.[1]);
  const patch = Number(source.match(/patch:\s*(\d+)/)?.[1]);
  const sprint = source.match(/RELEASE_SPRINT = "([^"]+)"/)?.[1];
  const driverCode = Number(source.match(/driver:\s*(\d+)/)?.[1]);
  const passengerCode = Number(source.match(/passenger:\s*(\d+)/)?.[1]);

  if ([major, minor, patch, driverCode, passengerCode].some(Number.isNaN) || !sprint) {
    throw new Error(`Could not parse ${versionTsPath} — expected fields not found.`);
  }

  return { major, minor, patch, sprint, androidVersionCodes: { driver: driverCode, passenger: passengerCode } };
}

function writeVersionTs(version) {
  let source = readFileSync(versionTsPath, "utf8");
  source = source.replace(/major:\s*\d+/, `major: ${version.major}`);
  source = source.replace(/minor:\s*\d+/, `minor: ${version.minor}`);
  source = source.replace(/patch:\s*\d+/, `patch: ${version.patch}`);
  source = source.replace(/driver:\s*\d+/, `driver: ${version.androidVersionCodes.driver}`);
  source = source.replace(/passenger:\s*\d+/, `passenger: ${version.androidVersionCodes.passenger}`);
  writeFileSync(versionTsPath, source);
}

function writeAppJson(appKey, version) {
  const appJsonPath = appJsonPaths[appKey];
  const appJson = JSON.parse(readFileSync(appJsonPath, "utf8"));
  appJson.expo.version = versionString(version);
  appJson.expo.android.versionCode = version.androidVersionCodes[appKey];
  writeFileSync(appJsonPath, `${JSON.stringify(appJson, null, 2)}\n`);
}

function versionString(version) {
  return `${version.major}.${version.minor}.${version.patch}`;
}

/** Falls back to "dev" outside a git checkout (e.g. this sandboxed sprint's working copy) rather than throwing. See docs/versioning.md. */
export function getCommit() {
  try {
    return execFileSync("git", ["rev-parse", "--short", "HEAD"], { cwd: root, stdio: ["ignore", "pipe", "ignore"] }).toString().trim();
  } catch {
    return "dev";
  }
}

export function getBuildDate() {
  return new Date().toISOString();
}

export function getVersion() {
  return readVersionTs();
}

function printShow(json) {
  const version = readVersionTs();
  const info = {
    version: versionString(version),
    ...version,
    commit: getCommit(),
    buildDate: getBuildDate(),
  };
  if (json) {
    console.log(JSON.stringify(info, null, 2));
    return;
  }
  console.log(`Version:      ${info.version}`);
  console.log(`Sprint:       ${info.sprint}`);
  console.log(`Driver code:  ${info.androidVersionCodes.driver}`);
  console.log(`Passenger code: ${info.androidVersionCodes.passenger}`);
  console.log(`Commit:       ${info.commit}`);
  console.log(`Build date:   ${info.buildDate}`);
}

function bump(segment) {
  if (!["major", "minor", "patch"].includes(segment)) {
    throw new Error(`Unknown segment "${segment}" — expected major, minor, or patch.`);
  }
  const version = readVersionTs();
  if (segment === "major") {
    version.major += 1;
    version.minor = 0;
    version.patch = 0;
  } else if (segment === "minor") {
    version.minor += 1;
    version.patch = 0;
  } else {
    version.patch += 1;
  }
  version.androidVersionCodes.driver += 1;
  version.androidVersionCodes.passenger += 1;

  writeVersionTs(version);
  writeAppJson("driver", version);
  writeAppJson("passenger", version);

  console.log(`Bumped to ${versionString(version)} (driver versionCode ${version.androidVersionCodes.driver}, passenger versionCode ${version.androidVersionCodes.passenger}).`);
}

function main() {
  const [command, arg] = process.argv.slice(2);
  if (command === "show") {
    printShow(process.argv.includes("--json"));
    return;
  }
  if (command === "bump") {
    bump(arg);
    return;
  }
  console.error("Usage: node scripts/version.mjs show [--json] | bump <major|minor|patch>");
  process.exitCode = 1;
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  main();
}
