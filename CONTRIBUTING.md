# Contributing to The Ride

Thank you for your interest in contributing. This document covers the
workflow, coding standards, and pull request process for this monorepo.

## Development Workflow

1. Fork or branch from `main` using the pattern `type/short-description`
   (e.g. `feat/trip-matching`, `fix/wallet-balance-race`).
2. Install dependencies with `.\scripts\install.ps1` (pnpm workspaces).
3. Make your changes inside the appropriate app or package. Keep changes
   scoped to a single domain/feature where possible.
4. Run `pnpm lint`, `pnpm type-check`, and `pnpm test` before opening a PR
   (or use `.\scripts\build.ps1` / `.\scripts\test.ps1`).
5. Commits must follow [Conventional Commits](https://www.conventionalcommits.org/)
   (enforced by commitlint via a Husky `commit-msg` hook):
   `feat:`, `fix:`, `chore:`, `docs:`, `refactor:`, `test:`, `ci:`.
6. Open a pull request against `main` with a clear description of the
   change and any relevant screenshots (for UI work) or migration notes
   (for schema/rules changes).

## Code Standards

- **TypeScript everywhere.** No implicit `any`; prefer `unknown` + narrowing.
- **Zod at every boundary.** Validate external input (forms, API payloads,
  webhooks, Cloud Function triggers) with schemas from `packages/types`.
- **Domain-first organization.** Business logic belongs in the matching
  domain folder (`authentication`, `payments`, `trips`, etc.) across
  `packages/types`, `packages/api`, `functions/src`, and each app's
  `src/features` — not scattered ad hoc.
- **Shared code goes in `packages/`.** If two apps need the same
  component, hook, or utility, it belongs in `packages/ui`,
  `packages/hooks`, or `packages/utils` — not duplicated.
- **No secrets in source.** Use `.env` (git-ignored) locally and a secrets
  manager in CI/CD. Never commit Firebase service account keys.
- Formatting is enforced by Prettier and linting by ESLint — both run
  automatically via the pre-commit hook (`lint-staged`).

## Project Structure Reference

See [README.md](README.md) and [docs/architecture/ARCHITECTURE.md](docs/architecture/ARCHITECTURE.md)
for the full monorepo layout and rationale.

## Reporting Issues

Use the issue tracker to report bugs or propose features. Include
reproduction steps, expected vs. actual behavior, and environment details.
Security vulnerabilities should **not** be filed as public issues — see
[SECURITY.md](SECURITY.md).
