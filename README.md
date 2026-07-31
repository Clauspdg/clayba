# The Ride

Production-grade ride-hailing platform monorepo — passenger web app, admin
back-office, driver mobile app, and passenger mobile app, sharing a common
type-safe foundation of Firebase services, UI components, and API clients.

> **Status:** Architecture foundation only. No business logic, booking flows,
> or UI screens have been implemented yet. See [Roadmap](docs/ROADMAP.md).

## Tech Stack

| Layer            | Technology                                              |
| ----------------- | -------------------------------------------------------- |
| Web / Admin       | Next.js 15 (App Router), React 19, TypeScript, TailwindCSS |
| Mobile            | React Native (Expo, latest SDK), Expo Router              |
| Backend           | Firebase (Authentication, Firestore, Storage, Cloud Functions, FCM) |
| State             | Zustand (client state), React Query (server state)        |
| Forms/Validation  | React Hook Form + Zod                                     |
| Monorepo tooling  | Turborepo, pnpm workspaces                                 |
| Quality           | ESLint, Prettier, Husky, lint-staged, commitlint           |

## Monorepo Layout

```
the-ride/
├── apps/
│   ├── web/              # Next.js 15 — public passenger-facing web app
│   ├── admin/             # Next.js 15 — internal operations dashboard
│   ├── driver-app/        # Expo — driver mobile app
│   └── passenger-app/     # Expo — passenger mobile app
├── packages/
│   ├── ui/                # Shared design-system components
│   ├── config/             # Shared ESLint / TypeScript / Tailwind configs
│   ├── firebase/           # Shared Firebase client + admin SDK wrappers
│   ├── types/               # Shared TypeScript types & Zod schemas (by domain)
│   ├── utils/                # Shared framework-agnostic utilities
│   ├── api/                   # Shared API clients & React Query hooks (by domain)
│   └── hooks/                  # Shared cross-app React hooks
├── functions/               # Firebase Cloud Functions (by domain)
├── docs/                     # Architecture, database, API, and planning docs
├── scripts/                   # PowerShell developer scripts
└── assets/                     # Shared brand assets, icons, images
```

Every app and package that touches business logic is organized into the
same 15 domains: **authentication, payments, maps, notifications,
messaging, trips, drivers, passengers, fleet-management, emergency,
wallet, reports, support, settings, analytics** — so a feature's code
lives in a predictable place across the stack (`packages/types/src/trips`,
`packages/api/src/trips`, `functions/src/trips`,
`apps/admin/src/features/trips`, etc).

## Getting Started

Prerequisites: Node.js 20+, pnpm 9+, the Firebase CLI, and the Expo CLI/EAS
CLI for mobile builds.

```powershell
# Install all workspace dependencies
.\scripts\install.ps1

# Run an individual app
.\scripts\run-web.ps1
.\scripts\run-admin.ps1
.\scripts\run-driver.ps1
.\scripts\run-passenger.ps1

# Build, test, and deploy
.\scripts\build.ps1
.\scripts\test.ps1
.\scripts\deploy.ps1
```

Copy `.env.example` to `.env` at the root (and in each app under `apps/*`)
and fill in your Firebase, Maps, and payment provider credentials before
running anything.

## Documentation

- [Architecture](docs/architecture/ARCHITECTURE.md)
- [Database](docs/database/DATABASE.md)
- [API](docs/api/API.md)
- [Roadmap](docs/ROADMAP.md)
- [Sprint Planning](docs/SPRINT-PLANNING.md)
- [Requirements](docs/REQUIREMENTS.md)

## Contributing

Please read [CONTRIBUTING.md](CONTRIBUTING.md) and our
[Code of Conduct](CODE_OF_CONDUCT.md) before opening a pull request.

## Security

To report a vulnerability, see [SECURITY.md](SECURITY.md).

## License

See [LICENSE](LICENSE).
