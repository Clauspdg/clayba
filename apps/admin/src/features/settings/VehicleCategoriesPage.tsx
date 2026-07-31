"use client";

import { DEFAULT_VEHICLE_CATEGORIES } from "@the-ride/types";
import { Badge, Card, CardContent, CardHeader, CardTitle, Heading, Table, TableBody, TableCell, TableHead, TableHeader, TableRow, useTranslation } from "@the-ride/ui";

/**
 * Vehicle Categories (Sprint 3, Part 3/9). Shows the seed data from
 * `DEFAULT_VEHICLE_CATEGORIES` — the admin dashboard now has a real
 * Firebase session (Sprint 5), but this page's data hasn't been migrated
 * to a live Firestore query yet, so it's real UI over real seed data
 * rather than a live-editable table. Full CRUD is a follow-up once each
 * page is wired to `@the-ride/firebase/client`'s Firestore accessor.
 */
export function VehicleCategoriesPage() {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col gap-6">
      <Heading level={2}>{t("admin.sidebar.vehicleCategories")}</Heading>

      <Card>
        <CardHeader>
          <CardTitle>{t("admin.vehicleCategories.tableTitle")}</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
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
              </TableRow>
            </TableHeader>
            <TableBody>
              {DEFAULT_VEHICLE_CATEGORIES.map((category) => (
                <TableRow key={category.id}>
                  <TableCell className="font-medium text-neutral-900 dark:text-neutral-50">{category.name}</TableCell>
                  <TableCell>${category.baseFare.toFixed(2)}</TableCell>
                  <TableCell>${category.perKmRate.toFixed(2)}</TableCell>
                  <TableCell>${category.perMinuteRate.toFixed(2)}</TableCell>
                  <TableCell>${category.minimumFare.toFixed(2)}</TableCell>
                  <TableCell>{category.maximumPassengers}</TableCell>
                  <TableCell>
                    <Badge tone="success">{t("admin.vehicleCategories.active")}</Badge>
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
