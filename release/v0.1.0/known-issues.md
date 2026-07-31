# Known Issues — this release

- **Placeholder binaries:** Passenger.apk, Passenger.aab, Driver.apk, Driver.aab are placeholder files, not real Android binaries. This sandboxed environment has no Expo/EAS credentials or network access to Expo's build service, so it cannot produce signed APK/AAB files. Run `eas build` per docs/android-build.md and re-run `pnpm release --artifacts-dir <downloaded-output>` to replace them with real binaries.
