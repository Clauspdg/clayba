"use client";

import { adminFirestore } from "@/lib/firebase-client";
import { exportToCsv } from "@/lib/csv";
import { uploadAndCatalogSiteMedia } from "@/lib/site-media-admin";
import { useTableState } from "@/lib/useTableState";
import {
  createVehicleCategory,
  deleteVehicleCategory,
  toCreateInput,
  updateVehicleCategory,
} from "@/lib/vehicle-category-admin";
import { useAuth } from "@the-ride/hooks";
import {
  Badge,
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  EmptyState,
  ErrorState,
  Heading,
  Illustration,
  Input,
  LoadingState,
  Pagination,
  SearchBar,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Textarea,
  useToast,
  useTranslation,
} from "@the-ride/ui";
import type { CreateVehicleCategoryInput, VehicleCategory } from "@the-ride/types";
import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
import { useEffect, useState } from "react";

const EMPTY_FORM: CreateVehicleCategoryInput = {
  name: "",
  description: "",
  icon: "car",
  color: "#0F62FE",
  baseFare: 0,
  perKmRate: 0,
  perMinuteRate: 0,
  minimumFare: 0,
  maximumPassengers: 4,
  isActive: true,
  sortOrder: 0,
};

/**
 * Vehicle Categories full CRUD (Web Phase W1, Parts 5-6) — live Firestore
 * list + add/edit/delete dialogs, replacing the earlier seed-data-only
 * read view.
 */
export function VehicleCategoriesPage() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const { session } = useAuth();
  const [categories, setCategories] = useState<VehicleCategory[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<VehicleCategory | "new" | null>(null);
  const [form, setForm] = useState<CreateVehicleCategoryInput>(EMPTY_FORM);
  const [deleting, setDeleting] = useState<VehicleCategory | null>(null);
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  async function handleImageUpload(file: File) {
    setUploadingImage(true);
    try {
      const item = await uploadAndCatalogSiteMedia(
        adminFirestore,
        "vehicles",
        session?.uid ?? "",
        file,
      );
      setForm((prev) => ({ ...prev, imageUrl: item.url }));
    } catch (err) {
      toast({ variant: "danger", title: err instanceof Error ? err.message : t("common.error") });
    } finally {
      setUploadingImage(false);
    }
  }

  useEffect(() => {
    const q = query(collection(adminFirestore, "vehicleCategories"), orderBy("sortOrder", "asc"));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) =>
        setCategories(snapshot.docs.map((d) => ({ id: d.id, ...d.data() }) as VehicleCategory)),
      (err) => setError(err.message),
    );
    return unsubscribe;
  }, []);

  const table = useTableState({
    data: categories ?? [],
    searchFields: ["name", "description"],
    pageSize: 10,
  });

  function openCreate() {
    setForm(EMPTY_FORM);
    setEditing("new");
  }

  function openEdit(category: VehicleCategory) {
    setForm(toCreateInput(category));
    setEditing(category);
  }

  async function handleSave() {
    setSaving(true);
    try {
      if (editing === "new") {
        await createVehicleCategory(adminFirestore, form);
        toast({ variant: "success", title: t("admin.vehicleCategoriesCrud.created") });
      } else if (editing) {
        await updateVehicleCategory(adminFirestore, editing.id, form);
        toast({ variant: "success", title: t("admin.vehicleCategoriesCrud.updated") });
      }
      setEditing(null);
    } catch (err) {
      toast({ variant: "danger", title: err instanceof Error ? err.message : t("common.error") });
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!deleting) return;
    setBusyId(deleting.id);
    try {
      await deleteVehicleCategory(adminFirestore, deleting.id);
      toast({ variant: "success", title: t("admin.vehicleCategoriesCrud.deleted") });
      setDeleting(null);
    } catch (err) {
      toast({ variant: "danger", title: err instanceof Error ? err.message : t("common.error") });
    } finally {
      setBusyId(null);
    }
  }

  function handleExport() {
    exportToCsv(
      "vehicle-categories",
      table.pageItems.map((category) => ({
        id: category.id,
        name: category.name,
        baseFare: category.baseFare,
        perKmRate: category.perKmRate,
        perMinuteRate: category.perMinuteRate,
        minimumFare: category.minimumFare,
        maximumPassengers: category.maximumPassengers,
        isActive: category.isActive,
      })),
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Heading level={2}>{t("admin.sidebar.vehicleCategories")}</Heading>
        <Button onClick={openCreate}>{t("admin.vehicleCategoriesCrud.addNew")}</Button>
      </div>

      {error ? (
        <ErrorState title={t("admin.emptyStates.errorTitle")} description={error} />
      ) : categories === null ? (
        <LoadingState title={t("common.loading")} />
      ) : (
        <div className="flex flex-col gap-4">
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
              title={t("admin.emptyStates.noDataTitle")}
            />
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("admin.vehicleCategories.name")}</TableHead>
                    <TableHead>{t("admin.vehicleCategories.baseFare")}</TableHead>
                    <TableHead>{t("admin.vehicleCategories.perKm")}</TableHead>
                    <TableHead>{t("admin.vehicleCategories.perMinute")}</TableHead>
                    <TableHead>{t("admin.vehicleCategories.minimumFare")}</TableHead>
                    <TableHead>{t("admin.vehicleCategories.maxPassengers")}</TableHead>
                    <TableHead>{t("admin.vehicleCategories.status")}</TableHead>
                    <TableHead>{t("admin.vehicleCategoriesCrud.actions")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {table.pageItems.map((category) => (
                    <TableRow key={category.id}>
                      <TableCell className="font-medium text-neutral-900 dark:text-neutral-50">
                        {category.name}
                      </TableCell>
                      <TableCell>${category.baseFare.toFixed(2)}</TableCell>
                      <TableCell>${category.perKmRate.toFixed(2)}</TableCell>
                      <TableCell>${category.perMinuteRate.toFixed(2)}</TableCell>
                      <TableCell>${category.minimumFare.toFixed(2)}</TableCell>
                      <TableCell>{category.maximumPassengers}</TableCell>
                      <TableCell>
                        <Badge tone={category.isActive ? "success" : "neutral"}>
                          {category.isActive
                            ? t("admin.vehicleCategories.active")
                            : t("admin.vehicleCategories.inactive")}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" onClick={() => openEdit(category)}>
                            {t("admin.vehicleCategoriesCrud.edit")}
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => setDeleting(category)}
                          >
                            {t("admin.vehicleCategoriesCrud.delete")}
                          </Button>
                        </div>
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

      <Dialog open={editing !== null} onOpenChange={(open) => !open && setEditing(null)}>
        <DialogContent closeLabel={t("common.close")}>
          <DialogHeader>
            <DialogTitle>
              {editing === "new"
                ? t("admin.vehicleCategoriesCrud.addTitle")
                : t("admin.vehicleCategoriesCrud.editTitle")}
            </DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4">
            <Input
              label={t("admin.vehicleCategoriesCrud.nameLabel")}
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
            <Textarea
              label={t("admin.vehicleCategoriesCrud.descriptionLabel")}
              value={form.description ?? ""}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={2}
            />
            <div className="grid grid-cols-2 gap-4">
              <Input
                label={t("admin.vehicleCategoriesCrud.iconLabel")}
                value={form.icon}
                onChange={(e) => setForm({ ...form, icon: e.target.value })}
              />
              <Input
                label={t("admin.vehicleCategoriesCrud.colorLabel")}
                value={form.color}
                onChange={(e) => setForm({ ...form, color: e.target.value })}
              />
            </div>
            <div className="flex flex-col gap-2">
              <span className="text-sm font-medium text-neutral-900 dark:text-neutral-50">
                {t("admin.vehicleCategoriesCrud.imageLabel")}
              </span>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                aria-label={t("admin.vehicleCategoriesCrud.imageLabel")}
                className="text-sm"
                disabled={uploadingImage}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) void handleImageUpload(file);
                }}
              />
              {form.imageUrl && (
                <img src={form.imageUrl} alt="" className="h-24 w-full rounded-lg object-cover" />
              )}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Input
                type="number"
                step="0.01"
                label={t("admin.vehicleCategoriesCrud.baseFareLabel")}
                value={form.baseFare}
                onChange={(e) => setForm({ ...form, baseFare: Number(e.target.value) })}
              />
              <Input
                type="number"
                step="0.01"
                label={t("admin.vehicleCategoriesCrud.perKmLabel")}
                value={form.perKmRate}
                onChange={(e) => setForm({ ...form, perKmRate: Number(e.target.value) })}
              />
              <Input
                type="number"
                step="0.01"
                label={t("admin.vehicleCategoriesCrud.perMinuteLabel")}
                value={form.perMinuteRate}
                onChange={(e) => setForm({ ...form, perMinuteRate: Number(e.target.value) })}
              />
              <Input
                type="number"
                step="0.01"
                label={t("admin.vehicleCategoriesCrud.minimumFareLabel")}
                value={form.minimumFare}
                onChange={(e) => setForm({ ...form, minimumFare: Number(e.target.value) })}
              />
              <Input
                type="number"
                label={t("admin.vehicleCategoriesCrud.maxPassengersLabel")}
                value={form.maximumPassengers}
                onChange={(e) => setForm({ ...form, maximumPassengers: Number(e.target.value) })}
              />
              <Input
                type="number"
                label={t("admin.vehicleCategoriesCrud.sortOrderLabel")}
                value={form.sortOrder}
                onChange={(e) => setForm({ ...form, sortOrder: Number(e.target.value) })}
              />
            </div>
            <Switch
              label={t("admin.vehicleCategoriesCrud.activeLabel")}
              checked={form.isActive}
              onCheckedChange={(checked) => setForm({ ...form, isActive: checked })}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(null)}>
              {t("common.cancel")}
            </Button>
            <Button
              onClick={() => void handleSave()}
              isLoading={saving}
              disabled={!form.name.trim()}
            >
              {t("admin.settingsForm.save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(deleting)} onOpenChange={(open) => !open && setDeleting(null)}>
        <DialogContent closeLabel={t("common.close")}>
          <DialogHeader>
            <DialogTitle>{t("admin.vehicleCategoriesCrud.deleteConfirmTitle")}</DialogTitle>
            <DialogDescription>
              {t("admin.vehicleCategoriesCrud.deleteConfirmDescription")}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleting(null)}>
              {t("common.cancel")}
            </Button>
            <Button
              variant="destructive"
              onClick={() => void handleDelete()}
              isLoading={busyId === deleting?.id}
            >
              {t("admin.vehicleCategoriesCrud.delete")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
