"use client";

import { AuthProvider } from "@the-ride/hooks";
import type { ReactNode } from "react";

import { webAuthAdapter } from "@/lib/firebase-client";

/**
 * Client-only wrapper (Web Phase W1, Part 3) — `webAuthAdapter` holds
 * functions (`observeSession`/`signIn`/`signUp`/...), which Next.js's App
 * Router cannot serialize across the Server → Client Component boundary.
 * `layout.tsx` (a Server Component) can only pass `children` down here;
 * this client component imports the adapter itself instead of receiving
 * it as a prop, so no function ever crosses that boundary. Mirrors
 * apps/admin/src/components/AppAuthProvider.tsx exactly.
 */
export function AppAuthProvider({ children }: { children: ReactNode }) {
  return <AuthProvider adapter={webAuthAdapter}>{children}</AuthProvider>;
}
