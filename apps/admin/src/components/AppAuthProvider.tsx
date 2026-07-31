"use client";

import { AuthProvider } from "@the-ride/hooks";
import type { ReactNode } from "react";

import { adminAuthAdapter } from "@/lib/firebase-client";

/**
 * Client-only wrapper (Sprint 5, Part 2) — `adminAuthAdapter` holds
 * functions (`observeSession`/`signIn`/`signOut`), which Next.js's App
 * Router cannot serialize across the Server → Client Component boundary.
 * `layout.tsx` (a Server Component) can only pass `children` down here;
 * this client component imports the adapter itself instead of receiving
 * it as a prop, so no function ever crosses that boundary.
 */
export function AppAuthProvider({ children }: { children: ReactNode }) {
  return <AuthProvider adapter={adminAuthAdapter}>{children}</AuthProvider>;
}
