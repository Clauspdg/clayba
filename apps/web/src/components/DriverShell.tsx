"use client";

import type { ReactNode } from "react";

import { DriverHeader } from "./DriverHeader";
import { DriverSidebar } from "./DriverSidebar";
import { RequireDriverAccess } from "./RequireDriverAccess";

/**
 * UX-3 sprint (Dedicated Driver Space), Part 3 — the Driver Space's own
 * chrome, structurally identical to `PassengerShell` (same responsive
 * rail/drawer via the shared `Sidebar`) but with entirely separate content:
 * `DriverSidebar` instead of `PassengerSidebar`, `DriverHeader` instead of
 * `PassengerHeader`. `RequireDriverAccess` gates every page under this
 * shell in one place (Part 2) — no individual `/driver/*` page re-checks
 * access itself.
 */
export function DriverShell({ children }: { children: ReactNode }) {
  return (
    <RequireDriverAccess>
      <div className="laptop:flex-row flex h-screen flex-col overflow-hidden">
        <DriverSidebar />
        <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
          <DriverHeader />
          <main className="flex-1 overflow-y-auto overflow-x-hidden p-6">{children}</main>
        </div>
      </div>
    </RequireDriverAccess>
  );
}
