"use client";

import { adminFirestore } from "@/lib/firebase-client";
import { exportToCsv } from "@/lib/csv";
import { updateUserRole } from "@/lib/user-admin";
import { useTableState } from "@/lib/useTableState";
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  EmptyState,
  ErrorState,
  Heading,
  Illustration,
  LoadingState,
  Pagination,
  SearchBar,
  Select,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  useToast,
  useTranslation,
} from "@the-ride/ui";
import { Role, type User } from "@the-ride/types";
import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
import { useEffect, useState } from "react";

const STATUS_TONE: Record<string, "neutral" | "brand" | "success" | "warning" | "danger"> = {
  active: "success",
  suspended: "warning",
  deleted: "danger",
};

/**
 * Users (Web Phase W1, Parts 5-6) — live list of every `users` document
 * with a role editor. Disclosed limitation (see `updateUserRole` doc
 * comment): editing the role here changes the Firestore record only, not
 * the Firebase Auth custom claim RBAC actually enforces.
 */
export function UsersPage() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [users, setUsers] = useState<User[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<User | null>(null);
  const [newRole, setNewRole] = useState<string>("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const q = query(collection(adminFirestore, "users"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => setUsers(snapshot.docs.map((d) => ({ id: d.id, ...d.data() }) as User)),
      (err) => setError(err.message),
    );
    return unsubscribe;
  }, []);

  const table = useTableState({
    data: users ?? [],
    searchFields: ["displayName", "email", "role"],
    pageSize: 15,
  });

  function openEdit(user: User) {
    setEditing(user);
    setNewRole(user.role);
  }

  async function handleSave() {
    if (!editing) return;
    setSaving(true);
    try {
      await updateUserRole(adminFirestore, editing.id, newRole as Role);
      toast({ variant: "success", title: t("admin.users.roleUpdated") });
      setEditing(null);
    } catch (err) {
      toast({ variant: "danger", title: err instanceof Error ? err.message : t("common.error") });
    } finally {
      setSaving(false);
    }
  }

  function handleExport() {
    exportToCsv(
      "users",
      table.pageItems.map((user) => ({
        id: user.id,
        name: user.displayName ?? "",
        email: user.email,
        role: user.role,
        status: user.status,
      })),
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <Heading level={2}>{t("admin.users.title")}</Heading>

      <Card>
        <CardHeader>
          <CardTitle>{t("admin.users.title")}</CardTitle>
          <CardDescription>{t("admin.users.roleUpdateWarning")}</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {error ? (
            <div className="p-6">
              <ErrorState title={t("admin.emptyStates.errorTitle")} description={error} />
            </div>
          ) : users === null ? (
            <div className="p-6">
              <LoadingState title={t("common.loading")} />
            </div>
          ) : (
            <div className="flex flex-col gap-4 p-6">
              <div className="flex flex-wrap items-end gap-3">
                <SearchBar
                  label={t("common.search")}
                  placeholder={t("common.searchPlaceholder")}
                  value={table.search}
                  onChange={(e) => table.setSearch(e.target.value)}
                />
                <Button
                  variant="secondary"
                  onClick={handleExport}
                  disabled={table.pageItems.length === 0}
                >
                  {t("admin.table.exportCsv")}
                </Button>
              </div>

              {table.totalCount === 0 ? (
                <EmptyState
                  icon={<Illustration name="empty" size={80} />}
                  title={t("admin.users.noUsers")}
                />
              ) : (
                <>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t("admin.passengers.name")}</TableHead>
                        <TableHead>{t("admin.users.email")}</TableHead>
                        <TableHead>{t("admin.users.role")}</TableHead>
                        <TableHead>{t("admin.users.status")}</TableHead>
                        <TableHead>{t("admin.users.actions")}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {table.pageItems.map((user) => (
                        <TableRow key={user.id}>
                          <TableCell>{user.displayName ?? "—"}</TableCell>
                          <TableCell>{user.email}</TableCell>
                          <TableCell>
                            <Badge tone="brand">{user.role}</Badge>
                          </TableCell>
                          <TableCell>
                            <Badge tone={STATUS_TONE[user.status] ?? "neutral"}>
                              {user.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Button size="sm" variant="outline" onClick={() => openEdit(user)}>
                              {t("admin.users.changeRole")}
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  <Pagination
                    page={table.page}
                    pageCount={table.pageCount}
                    onPageChange={table.setPage}
                    previousLabel={t("common.previous")}
                    nextLabel={t("common.next")}
                    summary={t("admin.table.pageSummary", {
                      current: table.page,
                      total: table.pageCount,
                    })}
                  />
                </>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={Boolean(editing)} onOpenChange={(open) => !open && setEditing(null)}>
        <DialogContent closeLabel={t("common.close")}>
          <DialogHeader>
            <DialogTitle>{t("admin.users.changeRole")}</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-neutral-500 dark:text-neutral-400">
            {t("admin.users.roleUpdateWarning")}
          </p>
          <Select
            label={t("admin.users.role")}
            value={newRole}
            onValueChange={setNewRole}
            options={Object.values(Role).map((role) => ({ value: role, label: role }))}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(null)}>
              {t("common.cancel")}
            </Button>
            <Button onClick={() => void handleSave()} isLoading={saving}>
              {t("admin.settingsForm.save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
