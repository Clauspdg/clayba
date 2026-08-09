"use client";

import { webFirestore } from "@/lib/firebase-client";
import { getOrCreatePassengerProfile } from "@the-ride/firebase/client";
import { useAuth } from "@the-ride/hooks";
import { useEffect, type ReactNode } from "react";

import { PassengerHeader } from "./PassengerHeader";
import { PassengerSidebar } from "./PassengerSidebar";
import { RequireAuth } from "./RequireAuth";

/**
 * Passenger dashboard chrome (Sprint 6) — mirrors `apps/admin`'s
 * `AdminShell` pattern. Also bootstraps the signed-in user's `passengers/{uid}`
 * profile document on first render so every page underneath (saved places,
 * emergency contacts, preferences) can assume it already exists — see
 * `getOrCreatePassengerProfile`'s doc comment on why `firestore.rules`'s
 * `isPassengerOwner()` cross-reference needs that document to be present.
 */
function PassengerBootstrap() {
  const { session } = useAuth();

  useEffect(() => {
    if (session) {
      void getOrCreatePassengerProfile(webFirestore, session.uid);
    }
  }, [session]);

  return null;
}

export function PassengerShell({ children }: { children: ReactNode }) {
  return (
    <RequireAuth>
      <PassengerBootstrap />
      <div className="laptop:flex-row flex h-screen flex-col overflow-hidden">
        <PassengerSidebar />
        <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
          <PassengerHeader />
          <main className="flex-1 overflow-y-auto overflow-x-hidden p-6">{children}</main>
        </div>
      </div>
    </RequireAuth>
  );
}
