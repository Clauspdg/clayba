# Sprint Planning

> Template for tracking sprint work. Duplicate the section below per
> sprint once feature development begins; this file currently reflects
> the architecture-setup sprint only.

## Sprint 0 — Architecture Foundation

**Dates:** 2026-07-26 – TBD
**Goal:** Stand up the monorepo skeleton with no business logic, so
feature sprints can start immediately in Phase 1 of the
[Roadmap](ROADMAP.md).

| Task | Owner | Status |
| --- | --- | --- |
| Turborepo + pnpm workspace setup | — | Done |
| Scaffold apps (web, admin, driver-app, passenger-app) | — | Done |
| Scaffold shared packages (ui, config, firebase, types, utils, api, hooks) | — | Done |
| Scaffold Cloud Functions by domain | — | Done |
| Firebase project config + deny-all rules | — | Done |
| Tooling: ESLint/Prettier/Husky/commitlint | — | Done |
| CI (GitHub Actions) + PowerShell dev scripts | — | Done |
| Documentation (architecture, database, API, roadmap) | — | Done |
| Provision real Firebase projects (dev/staging/prod) | — | Not started |

## Sprint Template

```
## Sprint N — <theme>

**Dates:** <start> – <end>
**Goal:** <one sentence>

| Task | Owner | Status |
| --- | --- | --- |
| ... | ... | Not started / In progress / Done |

### Retro notes
- What went well:
- What didn't:
- Carry-over to next sprint:
```
