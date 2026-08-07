"use client";

import {
  Badge,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Heading,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  useTranslation,
} from "@the-ride/ui";
import { ROLE_PERMISSIONS } from "@the-ride/types";

/**
 * Permissions (Web Phase W1, Parts 5-6) — read-only display of the
 * compile-time `ROLE_PERMISSIONS` matrix (`@the-ride/types`), the single
 * source of truth RBAC checks throughout the platform read from. No
 * Firestore involved: this is data baked into the app, not a document.
 */
export function PermissionsPage() {
  const { t } = useTranslation();
  const roles = Object.entries(ROLE_PERMISSIONS) as Array<[string, string[]]>;

  return (
    <div className="flex flex-col gap-6">
      <Heading level={2}>{t("admin.permissions.title")}</Heading>

      <Card>
        <CardHeader>
          <CardTitle>{t("admin.permissions.title")}</CardTitle>
          <CardDescription>{t("admin.permissions.description")}</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("admin.permissions.role")}</TableHead>
                <TableHead>{t("admin.permissions.permission")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {roles.map(([role, permissions]) => (
                <TableRow key={role}>
                  <TableCell className="align-top font-medium text-neutral-900 dark:text-neutral-50">
                    {role}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1.5">
                      {permissions.map((permission) => (
                        <Badge key={permission} tone="neutral">
                          {permission}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
