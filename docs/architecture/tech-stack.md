# Tech Stack

| Concern | Choice | Notes |
| --- | --- | --- |
| Web/Admin framework | Next.js 15 (App Router) | React Server Components, route groups |
| UI library | React 19 | Shared across web, admin (mobile uses React Native's React) |
| Mobile framework | React Native via Expo (latest SDK) | Expo Router for file-based navigation |
| Language | TypeScript (strict mode) | Shared `tsconfig.base.json` across the monorepo |
| Styling | TailwindCSS | Shared token config in `packages/config/tailwind` |
| Backend platform | Firebase | Auth, Firestore, Storage, Cloud Functions, FCM |
| Server state | TanStack React Query | Data fetching/caching layer over `packages/api` |
| Client state | Zustand | Per-app local UI state stores |
| Forms | React Hook Form | Paired with Zod resolvers |
| Validation | Zod | Single source of truth for schemas, shared via `packages/types` |
| Monorepo build system | Turborepo | Task graph, caching, `turbo.json` pipeline |
| Package manager | pnpm (workspaces) | `pnpm-workspace.yaml` |
| Linting | ESLint 9 (flat config) | Base + Next.js + React Native + Node variants |
| Formatting | Prettier (+ Tailwind plugin) | Enforced via `lint-staged` |
| Git hooks | Husky | `pre-commit` (lint-staged), `commit-msg` (commitlint) |
| Commit convention | Conventional Commits | Enforced by `commitlint.config.js` |
| CI/CD | GitHub Actions | See `.github/workflows/` |

## Why these choices at scale

- **Next.js 15 + React 19**: React Server Components reduce client bundle
  size for the passenger web app, which matters at high traffic; App
  Router route groups (`(marketing)`, `(auth)`, `(dashboard)`) keep public
  and authenticated surfaces cleanly separated.
- **Firebase**: managed scaling for Auth, Firestore, and Storage removes
  infrastructure operations burden; Cloud Functions scale per-domain
  independently; FCM gives a single push channel across iOS/Android/Web.
- **Turborepo + pnpm**: content-addressed caching and task graph keep CI
  fast as more apps/packages are added; pnpm's strict node_modules avoids
  phantom dependency bugs across a growing workspace.
- **Zod everywhere**: one schema definition drives both compile-time types
  and runtime validation at every trust boundary (forms, API routes,
  Cloud Function triggers, webhooks) — critical for a platform handling
  payments and PII.
