# Data Model Diagram

> Placeholder. Once core domains (trips, drivers, passengers, payments,
> wallet) have real Firestore collections, replace this with an entity
> relationship diagram, e.g.:

```mermaid
erDiagram
  USERS ||--o| DRIVERS : "may be"
  USERS ||--o| PASSENGERS : "may be"
  DRIVERS ||--o{ VEHICLES : drives
  PASSENGERS ||--o{ TRIPS : requests
  DRIVERS ||--o{ TRIPS : fulfills
  TRIPS ||--o| CHARGES : bills
  USERS ||--|| WALLETS : owns
  WALLETS ||--o{ LEDGER_ENTRIES : records
```

This is illustrative only — no collections currently exist. Update this
diagram alongside [firestore-schema.md](firestore-schema.md) as each
domain's data model is finalized.
