# Release Process (Sprint 4.6, Part 5)

`scripts/generate-release.mjs` assembles `/release/v{version}/` from the
current state of `packages/types/src/version.ts` (see docs/versioning.md).

```
node scripts/generate-release.mjs                              # placeholder Android binaries
node scripts/generate-release.mjs --artifacts-dir ./eas-output # real binaries, if you have them
node scripts/generate-release.mjs --notes ./my-notes.md        # custom release-notes.md content
```

or via the root script: `pnpm release` (same flags work after `--`, e.g.
`pnpm release -- --artifacts-dir ./eas-output`).

## What gets generated

```
release/
  v0.1.0/
    Passenger.apk
    Passenger.aab
    Driver.apk
    Driver.aab
    release-notes.md
    version.json
    known-issues.md
    checksum.txt
```

| File | Content |
| --- | --- |
| `Passenger.apk`/`.aab`, `Driver.apk`/`.aab` | Copied in from `--artifacts-dir` if provided; otherwise a small placeholder text file (see below) |
| `release-notes.md` | Version, sprint, date, and a per-app version/versionCode table — or your own file's content, via `--notes` |
| `version.json` | Machine-readable snapshot: version, sprint, both apps' versionCodes, commit, build date |
| `known-issues.md` | Auto-flags any placeholder binaries in this release; otherwise "none known" |
| `checksum.txt` | SHA-256 of every file in the folder, one line each — `sha256sum -c checksum.txt` to verify |

## Why placeholders instead of fake binaries

Without `--artifacts-dir`, `Passenger.apk`/`.aab`/`Driver.apk`/`.aab` are
plain-text files that say so explicitly — not zero-byte stubs and not
files that could be mistaken for a real, installable APK. Fabricating a
file that merely *looks* like a working binary (same name, wrong content)
is worse than clearly labeling it: someone could ship it by accident.
`known-issues.md` calls out exactly which files are placeholders, every
time. Real binaries come from `eas build` (see docs/android-build.md);
point `--artifacts-dir` at wherever you download that build's output and
re-run the generator to replace the placeholders with real files
(re-run also regenerates `checksum.txt` against the real bytes).

## Bumping the version before a release

```
pnpm version:bump -- patch   # or minor / major
pnpm release
```

`version:bump` updates `packages/types/src/version.ts` and both apps'
`app.json` together (see docs/versioning.md) — always run it before
`generate-release.mjs` for a new release, so the folder name and
`version.json` reflect the version you actually mean to ship.

## Publishing (deliberately not automatic)

Neither `scripts/generate-release.mjs` nor the `release.yml` GitHub
Actions workflow publishes anything — the workflow uploads
`/release/v{version}/` as a downloadable workflow artifact and stops
there. Publishing a GitHub Release from it is a separate, deliberate step:

```
gh release create v0.1.0 release/v0.1.0/* --title "v0.1.0" --notes-file release/v0.1.0/release-notes.md
```

Run that by hand once you've reviewed the generated folder — see
docs/deployment.md for how this fits into the full pipeline.

## Related Docs

- [Versioning](./versioning.md)
- [Android Build](./android-build.md)
- [Deployment](./deployment.md)
