#!/usr/bin/env node
// CLAYBA Driver P0 local Android build pipeline — no EAS Cloud required.
//
// Usage:
//   node scripts/build-android-local.mjs driver
//   node scripts/build-android-local.mjs passenger
//
// What it does, in order (matches docs/android-build.md's "Local QA APK
// build" section):
//   1. validate the local environment (JDK, Android SDK, adb)
//   2. validate the app's required EXPO_PUBLIC_FIREBASE_* client config
//   3. validate a release signing keystore exists (never generates one
//      silently — see docs/android-build.md if it's missing)
//   4. `expo prebuild --platform android` (never --clean; that would
//      destroy the hand-wired release signingConfig in android/app/build.gradle)
//   5. `gradlew assembleRelease`
//   6. locate the produced .apk, compute its SHA-256, print a summary
//
// Deliberately does not touch EAS, does not upload anywhere, does not
// modify the web download section — copying the artifact into
// apps/web/public/downloads/android/ and updating latest.json is a
// separate, explicit step (see docs/android-build.md), so a QA build
// never silently becomes "what the website serves."
//
// No credentials are embedded here. The keystore and its passwords live
// entirely outside this repo (default: ~/.clayba-driver-keys/), read via
// CLAYBA_DRIVER_KEYSTORE_PROPERTIES / CLAYBA_PASSENGER_KEYSTORE_PROPERTIES.

import { execFileSync, spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "..");

const APPS = {
  driver: {
    dir: "apps/driver-app",
    appName: "CLAYBA Driver",
    keystoreEnvVar: "CLAYBA_DRIVER_KEYSTORE_PROPERTIES",
    defaultKeystoreProps: path.join(homedir(), ".clayba-driver-keys", "keystore.properties"),
  },
  passenger: {
    dir: "apps/passenger-app",
    appName: "CLAYBA",
    keystoreEnvVar: "CLAYBA_PASSENGER_KEYSTORE_PROPERTIES",
    defaultKeystoreProps: path.join(homedir(), ".clayba-passenger-keys", "keystore.properties"),
  },
};

const REQUIRED_FIREBASE_VARS = [
  "EXPO_PUBLIC_FIREBASE_API_KEY",
  "EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN",
  "EXPO_PUBLIC_FIREBASE_PROJECT_ID",
  "EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET",
  "EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID",
  "EXPO_PUBLIC_FIREBASE_APP_ID",
];

function fail(message) {
  console.error(`\n[build-android-local] FAILED: ${message}\n`);
  process.exit(1);
}

function step(label) {
  console.log(`\n=== ${label} ===`);
}

function findJdk17() {
  const candidates = [
    process.env.JAVA_HOME,
    "C:/Users/CLAUS_PDG/AppData/Local/Programs/Eclipse Adoptium/jdk-17.0.19.10-hotspot",
  ].filter(Boolean);
  for (const c of candidates) {
    if (existsSync(path.join(c, "bin", "java.exe")) || existsSync(path.join(c, "bin", "java"))) {
      return c;
    }
  }
  return null;
}

function findAndroidSdk() {
  const candidates = [
    process.env.ANDROID_HOME,
    process.env.ANDROID_SDK_ROOT,
    path.join(process.env.LOCALAPPDATA ?? "", "Android", "Sdk"),
  ].filter(Boolean);
  for (const c of candidates) {
    if (existsSync(path.join(c, "platform-tools"))) return c;
  }
  return null;
}

function main() {
  const target = process.argv[2];
  const app = APPS[target];
  if (!app) fail(`Usage: node scripts/build-android-local.mjs <${Object.keys(APPS).join("|")}>`);

  const appDir = path.join(REPO_ROOT, app.dir);
  if (!existsSync(appDir)) fail(`${app.dir} does not exist`);

  step("1/6 — Environment validation");
  const javaHome = findJdk17();
  if (!javaHome) fail("JDK not found. Install a JDK 17 (matching react-native 0.76's requirement) and set JAVA_HOME.");
  console.log("JAVA_HOME:", javaHome);

  const androidHome = findAndroidSdk();
  if (!androidHome) fail("Android SDK not found. Set ANDROID_HOME, or install via Android Studio / sdkmanager (see docs/android-build.md).");
  console.log("ANDROID_HOME:", androidHome);

  const env = {
    ...process.env,
    JAVA_HOME: javaHome,
    ANDROID_HOME: androidHome,
    ANDROID_SDK_ROOT: androidHome,
    PATH: `${path.join(javaHome, "bin")}${path.delimiter}${path.join(androidHome, "platform-tools")}${path.delimiter}${process.env.PATH}`,
    // Expo CLI auto-detects this monorepo's workspace root (the pnpm
    // lockfile at the repo root) and — as of the @expo/cli version this
    // project is pinned to — silently redirects Metro's bundling "server
    // root" to it by default, regardless of metro.config.js's own
    // `projectRoot`. That conflicts with this app's manual monorepo Metro
    // config (watchFolders/nodeModulesPaths/disableHierarchicalLookup)
    // and produces a broken, doubly-relative entry-file path — reliably
    // reproduced via `expo export:embed` and root-caused by reading
    // @expo/config's paths/env.js. This app's metro.config.js already
    // handles monorepo resolution correctly by itself, so the built-in
    // auto-detection is redundant and actively wrong here.
    EXPO_NO_METRO_WORKSPACE_ROOT: "1",
    // If this script is itself invoked from Git Bash/MSYS, HOME is
    // inherited as an MSYS-style path (e.g. /c/Users/name) rather than a
    // real Windows path. Gradle/AGP internals (build-profiling code, at
    // minimum) read HOME directly and fail with a raw, unhelpful
    // "filename, directory name, or volume label syntax is incorrect"
    // IOException when handed that — os.homedir() always returns a real
    // Windows path, so prefer it explicitly rather than trusting whatever
    // shell launched this process.
    ...(process.platform === "win32" ? { HOME: homedir() } : {}),
  };

  step("2/6 — Firebase client configuration");
  const envLocalPath = path.join(appDir, ".env.local");
  if (!existsSync(envLocalPath)) {
    fail(`${app.dir}/.env.local is missing. Local builds read the real client config from it (see docs/android-build.md) — this is the exact class of bug that shipped the white-screen v0.1.0 build.`);
  }
  const envLocalContent = readFileSync(envLocalPath, "utf8");
  const missing = REQUIRED_FIREBASE_VARS.filter((name) => !new RegExp(`^${name}=.+$`, "m").test(envLocalContent));
  if (missing.length > 0) {
    fail(`${app.dir}/.env.local is missing required values: ${missing.join(", ")}`);
  }
  console.log("All required EXPO_PUBLIC_FIREBASE_* values present in .env.local.");

  step("3/6 — Release signing keystore");
  const keystorePropsPath = process.env[app.keystoreEnvVar] || app.defaultKeystoreProps;
  if (!existsSync(keystorePropsPath)) {
    fail(
      `No release keystore properties found at ${keystorePropsPath}.\n` +
        `Generate one (see docs/android-build.md, "Local QA APK build" -> "Signing") or set ${app.keystoreEnvVar} to point at an existing one.\n` +
        `This script never generates a keystore silently.`,
    );
  }
  env[app.keystoreEnvVar] = keystorePropsPath;
  console.log("Using keystore properties:", keystorePropsPath);

  step("4/6 — expo prebuild (android)");
  const prebuild = spawnSync("npx", ["expo", "prebuild", "--platform", "android", "--no-install"], {
    cwd: appDir,
    env,
    stdio: "inherit",
    shell: true,
  });
  if (prebuild.status !== 0) fail("expo prebuild failed.");

  const androidDir = path.join(appDir, "android");

  // Gradle's SdkLocator reads local.properties as a Java Properties file,
  // where a bare backslash starts an escape sequence — `\U`, `\A`, `\L`
  // etc. (as in a Windows path like C:\Users\...\AppData\Local) are all
  // invalid `\uXXXX` unicode escapes, which corrupts the parsed sdk.dir
  // value into garbage and fails with an opaque "filename, directory
  // name, or volume label syntax is incorrect" deep inside AGP's
  // analytics code, nowhere near the real cause. Forward slashes need no
  // escaping and are accepted on Windows by every JVM file API.
  const localPropertiesPath = path.join(androidDir, "local.properties");
  writeFileSync(localPropertiesPath, `sdk.dir=${androidHome.replace(/\\/g, "/")}\n`);
  console.log("Wrote", localPropertiesPath);

  step("5/6 — gradlew assembleRelease");
  const gradlew = process.platform === "win32" ? "gradlew.bat" : "./gradlew";
  const gradle = spawnSync(gradlew, ["assembleRelease", "--no-daemon"], {
    cwd: androidDir,
    env,
    stdio: "inherit",
    shell: true,
  });
  if (gradle.status !== 0) fail("Gradle release build failed.");

  step("6/6 — Locate artifact");
  const outDir = path.join(androidDir, "app", "build", "outputs", "apk", "release");
  if (!existsSync(outDir)) fail(`Expected output directory not found: ${outDir}`);
  const apkFile = readdirSync(outDir).find((f) => f.endsWith(".apk"));
  if (!apkFile) fail(`No .apk found in ${outDir}`);
  const apkPath = path.join(outDir, apkFile);
  const size = statSync(apkPath).size;
  const sha256 = createHash("sha256").update(readFileSync(apkPath)).digest("hex");

  console.log("\n=== Build complete ===");
  console.log("App:", app.appName);
  console.log("APK:", apkPath);
  console.log("Size:", size, "bytes");
  console.log("SHA-256:", sha256);
  console.log("\nNext: copy/rename into the web download directory and update latest.json — see docs/android-build.md.");
}

main();
