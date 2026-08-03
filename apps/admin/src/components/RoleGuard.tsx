"use client";

import { Role } from "@the-ride/types";
import { EmptyState, Illustration, LoadingState, useTranslation } from "@the-ride/ui";
import { useAuth, useHasRole } from "@the-ride/hooks";
import { useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";

/**
 * Roles allowed into the admin dashboard shell at all — page-level
 * permission checks (Part 2, RBAC) come in a later sprint.
 * `Role.CONTENT_MANAGER` (Sprint 8.3) can reach this shell, but every Site
 * Content Firestore write is still denied by `firestore.rules`'s
 * `isAdmin()` until a future rules change recognizes the role — see that
 * enum member's doc comment.
 */
const ADMIN_DASHBOARD_ROLES: Role[] = [
  Role.ADMIN,
  Role.SUPER_ADMIN,
  Role.DISPATCHER,
  Role.SUPPORT,
  Role.MODERATOR,
  Role.CONTENT_MANAGER,
];

export function RoleGuard({ children }: { children: ReactNode }) {
  const { t } = useTranslation();
  const { status } = useAuth();
  const isAllowedRole = useHasRole(ADMIN_DASHBOARD_ROLES);
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/login");
    }
  }, [status, router]);

  if (status === "loading" || status === "unauthenticated") {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <LoadingState title={t("common.loading")} />
      </div>
    );
  }

  if (!isAllowedRole) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <EmptyState
          icon={<Illustration name="error" size={100} />}
          title={t("admin.accessDenied.title")}
          description={t("admin.accessDenied.body")}
        />
      </div>
    );
  }

  return <>{children}</>;
}
