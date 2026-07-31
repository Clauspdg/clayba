# Folder Structure Reference

```
the-ride/
├── apps/
│   ├── web/                    Next.js 15 — passenger-facing public web app
│   │   ├── src/app/             App Router routes ((marketing), (auth), api)
│   │   ├── src/features/        Web feature modules, one per domain
│   │   ├── src/components/      App-local UI components
│   │   └── src/{lib,hooks,stores,styles}/
│   ├── admin/                   Next.js 15 — internal operations dashboard
│   │   └── (same shape as web, features cover all 15 domains)
│   ├── driver-app/               Expo — driver mobile app (expo-router)
│   │   └── src/{app,features,components,lib,hooks,stores}/
│   └── passenger-app/            Expo — passenger mobile app (expo-router)
│       └── src/{app,features,components,lib,hooks,stores}/
│
├── packages/
│   ├── ui/                      Shared design-system components + theme
│   ├── config/                   Shared ESLint / TypeScript / Tailwind config
│   ├── firebase/                  Shared Firebase client + admin SDK wrappers
│   │   └── src/{client,admin,auth,firestore,storage,messaging}/
│   ├── types/                      Shared types & Zod schemas, one folder per domain
│   ├── utils/                       Shared framework-agnostic utilities, one folder per domain that needs pure logic (e.g. authentication, drivers)
│   ├── api/                          Shared API clients & React Query hooks, per domain
│   └── hooks/                         Shared cross-app React hooks
│
├── functions/                    Firebase Cloud Functions, one folder per domain
│   └── src/<domain>/
│
├── docs/                          Architecture, database, API, planning docs
├── scripts/                        PowerShell developer scripts
└── assets/                          Shared brand assets, icons, images
```

## The 15 Business Domains

`authentication`, `payments`, `maps`, `notifications`, `messaging`,
`trips`, `drivers`, `passengers`, `fleet-management`, `emergency`,
`wallet`, `reports`, `support`, `settings`, `analytics`.

Each domain is represented consistently as a folder wherever it has
logic: `packages/types/src/<domain>`, `packages/api/src/<domain>`,
`functions/src/<domain>`, and `src/features/<domain>` in whichever apps
need it (not every app needs every domain — e.g. `apps/admin` is the only
app with a `fleet-management` and `reports` feature folder today).
