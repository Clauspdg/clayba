"use client";

import { useVehicleCategories } from "@/hooks/useSiteContent";
import { Badge, Icon, useTranslation, type IconName } from "@the-ride/ui";
import type { VehicleCategory } from "@the-ride/types";
import { motion } from "framer-motion";

import { Reveal } from "./Reveal";
import { VehicleIllustration } from "./VehicleIllustration";
import { VEHICLE_TYPES } from "./vehicle-types";

/**
 * Ride Categories (Sprint 7.2) — reads the real `vehicleCategories`
 * collection instead of this file's old hardcoded array, so pricing shown
 * here always matches what booking actually charges. `VEHICLE_TYPES`
 * (`./vehicle-types.ts`) survives only as the fallback shown until that
 * collection has at least one active category — see `useVehicleCategories`
 * in `apps/web/src/hooks/useSiteContent.ts`.
 */
export function VehicleTypeGrid() {
  const { t } = useTranslation();

  const fallback: VehicleCategory[] = VEHICLE_TYPES.map((vehicle, index) => ({
    id: vehicle.id,
    name: t(vehicle.nameKey),
    description: t(vehicle.descriptionKey),
    icon: vehicle.icon,
    color: "#E86A2F",
    baseFare: vehicle.basePrice,
    perKmRate: 0,
    perMinuteRate: 0,
    minimumFare: 0,
    maximumPassengers: vehicle.capacity,
    isActive: true,
    sortOrder: index,
    createdAt: new Date(),
    updatedAt: new Date(),
  }));

  const categories = useVehicleCategories(fallback);

  return (
    <div className="tablet:grid-cols-2 laptop:grid-cols-3 grid gap-5">
      {categories.map((vehicle, index) => (
        <Reveal key={vehicle.id} delay={index * 0.06}>
          <motion.div
            whileHover={{ y: -6 }}
            transition={{ type: "spring", stiffness: 300, damping: 22 }}
            className="shadow-elevation1 duration-normal hover:shadow-elevation3 group h-full overflow-hidden rounded-2xl border border-neutral-100 bg-white transition-shadow dark:border-neutral-800 dark:bg-neutral-900"
          >
            <div className="from-brand-50 to-brand-100 text-brand dark:from-brand-900 dark:to-brand-800 dark:text-brand-300 relative flex h-28 items-center justify-center overflow-hidden bg-gradient-to-br transition-transform duration-500 group-hover:scale-105">
              {vehicle.imageUrl ? (
                <img src={vehicle.imageUrl} alt="" className="h-full w-full object-cover" />
              ) : (
                <VehicleIllustration tall={vehicle.maximumPassengers >= 6} className="h-16 w-32" />
              )}
            </div>
            <div className="flex flex-col gap-3 p-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-50">
                  {vehicle.name}
                </h3>
                <Icon name={vehicle.icon as IconName} size={18} className="text-brand shrink-0" />
              </div>
              <p className="text-sm text-neutral-500 dark:text-neutral-400">
                {vehicle.description}
              </p>

              <div className="flex flex-wrap gap-2">
                <Badge tone="neutral">
                  <Icon name="users" size={12} />
                  {vehicle.maximumPassengers} {t("website.vehicleTypes.seats")}
                </Badge>
              </div>

              <p className="text-brand mt-1 text-2xl font-bold">${vehicle.baseFare.toFixed(2)}+</p>
            </div>
          </motion.div>
        </Reveal>
      ))}
    </div>
  );
}
