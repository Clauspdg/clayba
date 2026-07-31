"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

import { AdminHeader } from "./AdminHeader";
import { AdminSidebar } from "./AdminSidebar";
import { RoleGuard } from "./RoleGuard";

const SHELL_LESS_ROUTES = ["/login"];

/** The dashboard chrome (Sidebar + Header + RoleGuard) around every page except the login screen. */
export function AdminShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  if (SHELL_LESS_ROUTES.includes(pathname)) {
    return <>{children}</>;
  }

  return (
    <RoleGuard>
      <div className="flex h-screen overflow-hidden">
        <AdminSidebar />
        <div className="flex flex-1 flex-col overflow-hidden">
          <AdminHeader />
          <main className="flex-1 overflow-y-auto p-6">{children}</main>
        </div>
      </div>
    </RoleGuard>
  );
}
