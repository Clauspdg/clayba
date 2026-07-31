# Security Policy

## Reporting a Vulnerability

If you discover a security vulnerability in The Ride, please report it
privately rather than opening a public issue. Send a report including:

- A description of the vulnerability and its potential impact
- Steps to reproduce (proof-of-concept if possible)
- Affected app(s)/package(s) and version/commit

We aim to acknowledge reports within 3 business days and to provide a
remediation timeline once the issue is confirmed.

## Scope

This policy covers all apps and packages in this monorepo:
`apps/web`, `apps/admin`, `apps/driver-app`, `apps/passenger-app`,
`functions`, and shared `packages/*`.

## Sensitive Data Handling

- Firebase service account keys, Stripe secret keys, and Twilio
  credentials must never be committed. `.gitignore` blocks common patterns
  (`*serviceAccountKey.json`, `.env*`), but always double-check diffs.
- Firestore and Storage security rules (`firestore.rules`, `storage.rules`)
  default to **deny-all** until each domain's access rules are explicitly
  authored and reviewed.
- Personally identifiable information (passenger/driver identity
  documents, location history, payment details) must be handled per the
  data classification rules documented in
  [docs/database/DATABASE.md](docs/database/DATABASE.md) once authored.

## Supported Versions

This project has not yet reached a versioned release. Security fixes are
applied to the `main` branch.
