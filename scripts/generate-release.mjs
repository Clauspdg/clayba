#!/usr/bin/env node
// -----------------------------------------------------------------------------
// The Ride — Release Folder Generator (Sprint 4.6, Part 5)
//
// Produces /release/v{version}/ with the release metadata (release-notes.md,
// version.json, known-issues.md, checksum.txt) always, and copies in real
// Android binaries when they're available.
//
// Real Passenger.apk/Passenger.aab/Driver.apk/Driver.aab only exist after
// `eas build` has actually run against Expo's build service (real Expo
// credentials + network access this sandboxed environment doesn't have —
// see docs/android-build.md). Pass --artifacts-dir pointing at a folder of
// downloaded EAS build outputs to have this script copy+checksum them in;
// without it, this script writes clearly-labeled placeholder files instead
// of fabricating binaries that look real but aren't — see docs/release-process.md
// for why that distinction matters.
//
// Usage:
//   node scripts/generate-release.mjs [--artifacts-dir <path>] [--notes <path>]
// -----------------------------------------------------------------------------
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync, copyFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { getBuildDate, getCommit, getVersion } from "./version.mjs";

const root = path.resolve(fileURLToPath(import.meta.url), "..", "..");

function parseArgs(argv) {
  const args = { artifactsDir: null, notes: null };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === "--artifacts-dir") args.artifactsDir = argv[++i];
    if (argv[i] === "--notes") args.notes = argv[++i];
  }
  return args;
}

const ARTIFACTS = [
  { app: "Passenger", ext: "apk", envKey: "passenger", buildType: "apk" },
  { app: "Passenger", ext: "aab", envKey: "passenger", buildType: "app-bundle" },
  { app: "Driver", ext: "apk", envKey: "driver", buildType: "apk" },
  { app: "Driver", ext: "aab", envKey: "driver", buildType: "app-bundle" },
];

function sha256(filePath) {
  return createHash("sha256").update(readFileSync(filePath)).digest("hex");
}

function findArtifact(artifactsDir, app, ext) {
  if (!artifactsDir || !existsSync(artifactsDir)) return null;
  const match = readdirSync(artifactsDir).find((name) => name.toLowerCase().includes(app.toLowerCase()) && name.toLowerCase().endsWith(`.${ext}`));
  return match ? path.join(artifactsDir, match) : null;
}

function writePlaceholder(filePath, app, ext, versionString) {
  const contents = [
    `THE RIDE — PLACEHOLDER ARTIFACT`,
    ``,
    `This is NOT a real Android ${ext.toUpperCase()}. It stands in for`,
    `${app}.${ext} until a real \`eas build\` (see docs/android-build.md) has`,
    `produced one and this generator was re-run with --artifacts-dir pointing`,
    `at the downloaded EAS output.`,
    ``,
    `App:     ${app}`,
    `Version: ${versionString}`,
    `Format:  ${ext.toUpperCase()}`,
  ].join("\n");
  writeFileSync(filePath, `${contents}\n`);
}

function renderReleaseNotes(version, versionString, notesPath) {
  if (notesPath) return readFileSync(notesPath, "utf8");
  return `# The Ride — Release v${versionString}

**Sprint:** ${version.sprint}
**Date:** ${new Date().toISOString().slice(0, 10)}

## Highlights

- Release pipeline (Sprint 4.6): Firebase Hosting prep for web/admin, Android
  release configuration (EAS) for Passenger/Driver, a centralized version
  system, and Build Info screens in both native apps.

## Apps in this release

| App | Version | Android versionCode |
| --- | --- | --- |
| Passenger | ${versionString} | ${version.androidVersionCodes.passenger} |
| Driver | ${versionString} | ${version.androidVersionCodes.driver} |

See docs/release-process.md for how this release was assembled and
docs/versioning.md for what each version field means.
`;
}

function renderKnownIssues(artifactStatus) {
  const missing = artifactStatus.filter((a) => a.placeholder);
  const lines = [`# Known Issues — this release`, ``];
  if (missing.length > 0) {
    lines.push(
      `- **Placeholder binaries:** ${missing.map((a) => `${a.app}.${a.ext}`).join(", ")} ${missing.length === 1 ? "is" : "are"} placeholder files, not real Android binaries. This sandboxed environment has no Expo/EAS credentials or network access to Expo's build service, so it cannot produce signed APK/AAB files. Run \`eas build\` per docs/android-build.md and re-run \`pnpm release --artifacts-dir <downloaded-output>\` to replace them with real binaries.`,
      ``,
    );
  } else {
    lines.push(`- None known at release time.`, ``);
  }
  return lines.join("\n");
}

function renderVersionJson(version, versionString, commit, buildDate) {
  return JSON.stringify(
    {
      version: versionString,
      major: version.major,
      minor: version.minor,
      patch: version.patch,
      sprint: version.sprint,
      androidVersionCodes: version.androidVersionCodes,
      commit,
      buildDate,
    },
    null,
    2,
  );
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const version = getVersion();
  const versionString = `${version.major}.${version.minor}.${version.patch}`;
  const commit = getCommit();
  const buildDate = getBuildDate();

  const releaseDir = path.join(root, "release", `v${versionString}`);
  mkdirSync(releaseDir, { recursive: true });

  const artifactStatus = [];
  for (const artifact of ARTIFACTS) {
    const destName = `${artifact.app}.${artifact.ext}`;
    const destPath = path.join(releaseDir, destName);
    const source = findArtifact(args.artifactsDir, artifact.app, artifact.ext);

    if (source) {
      copyFileSync(source, destPath);
      artifactStatus.push({ ...artifact, name: destName, placeholder: false, sizeBytes: statSync(destPath).size });
    } else {
      writePlaceholder(destPath, artifact.app, artifact.ext, versionString);
      artifactStatus.push({ ...artifact, name: destName, placeholder: true, sizeBytes: statSync(destPath).size });
    }
  }

  writeFileSync(path.join(releaseDir, "release-notes.md"), renderReleaseNotes(version, versionString, args.notes));
  writeFileSync(path.join(releaseDir, "known-issues.md"), renderKnownIssues(artifactStatus));
  writeFileSync(path.join(releaseDir, "version.json"), renderVersionJson(version, versionString, commit, buildDate));

  const checksumLines = artifactStatus.map((a) => `${sha256(path.join(releaseDir, a.name))}  ${a.name}`);
  writeFileSync(path.join(releaseDir, "checksum.txt"), `${checksumLines.join("\n")}\n`);

  console.log(`Release folder generated: ${path.relative(root, releaseDir)}`);
  for (const a of artifactStatus) {
    console.log(`  ${a.name}${a.placeholder ? " (placeholder — see known-issues.md)" : ""}`);
  }
}

main();
