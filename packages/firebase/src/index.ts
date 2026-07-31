export {};
// Intentionally empty. Import from a specific subpath instead of the bare
// package: "@the-ride/firebase/client" (browser/Expo-safe), "@the-ride/firebase/admin",
// "@the-ride/firebase/auth", or "@the-ride/firebase/firestore" (the latter three
// are server-only — they import firebase-admin). Re-exporting them all from
// here would let a client bundle accidentally pull in firebase-admin. See
// "Client vs. server Firebase SDKs are strictly separated" in
// docs/architecture-sprint1.md.
