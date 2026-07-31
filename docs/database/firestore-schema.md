# Firestore Schema Reference

> See [../firestore-schema.md](../firestore-schema.md) for the full,
> up-to-date field-level reference — implemented in Sprint 1. This page
> keeps the original template for domains added after Sprint 1.

## Template

```
### <collectionName>

Source of truth: `packages/types/src/<domain>/<schema>.ts`

| Field | Type | Notes |
| --- | --- | --- |
| id | string | Firestore document ID |
| ... | ... | ... |

Indexes: see `firestore.indexes.json`
Security rules: see `firestore.rules` (section: <domain>)
```

No collections have been defined yet.
