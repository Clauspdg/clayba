"use client";

import { useVehicleCategories } from "@/hooks/useSiteContent";
import { Badge, Icon, useTranslation, type IconName } from "@the-ride/ui";
import { motion } from "framer-motion";
import { useState } from "react";

import { Reveal } from "./Reveal";
import { VehicleIllustration } from "./VehicleIllustration";
import { buildDefaultVehicleCategories, getBundledImageForCategoryName } from "./vehicle-types";

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

  const { categories, error } = useVehicleCategories(buildDefaultVehicleCategories(t));

  return (
    <div className="flex flex-col gap-4">
      {error && <p className="text-danger text-sm">{error}</p>}
      <div className="tablet:grid-cols-2 laptop:grid-cols-3 grid gap-5">
        {categories.map((vehicle, index) => (
          <Reveal key={vehicle.id} delay={index * 0.06}>
            <motion.div
              whileHover={{ y: -6 }}
              transition={{ type: "spring", stiffness: 300, damping: 22 }}
              className="shadow-elevation1 duration-normal hover:shadow-elevation3 group h-full overflow-hidden rounded-2xl border border-neutral-100 bg-white transition-shadow dark:border-neutral-800 dark:bg-neutral-900"
            >
              <div className="from-brand-50 to-brand-100 text-brand dark:from-brand-900 dark:to-brand-800 dark:text-brand-300 relative flex h-44 items-center justify-center overflow-hidden bg-gradient-to-br transition-transform duration-500 group-hover:scale-105">
                <VehicleCardMedia
                  imageUrl={vehicle.imageUrl}
                  name={vehicle.name}
                  tall={vehicle.maximumPassengers >= 6}
                />
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

                <p className="text-brand mt-1 text-2xl font-bold">
                  ${vehicle.baseFare.toFixed(2)}+
                </p>
              </div>
            </motion.div>
          </Reveal>
        ))}
      </div>
    </div>
  );
}

/**
 * HOME-05B.1 — renders the real category photo when one is set, silently
 * swapping to the existing `VehicleIllustration` fallback if the image
 * fails to load (e.g. a broken/removed asset), so a card can never show
 * a broken-image glyph. BOOKING-04 — a real category with no `imageUrl`
 * of its own tries the bundled-photo name mapping next, before falling
 * through to the generic illustration.
 */
function VehicleCardMedia({
  imageUrl,
  name,
  tall,
}: {
  imageUrl?: string;
  name: string;
  tall: boolean;
}) {
  const [failed, setFailed] = useState(false);
  const resolvedUrl = imageUrl ?? getBundledImageForCategoryName(name);

  if (!resolvedUrl || failed) {
    return <VehicleIllustration tall={tall} className="h-16 w-32" />;
  }

  return (
    <img
      src={resolvedUrl}
      alt=""
      className="h-full w-full object-cover"
      onError={() => setFailed(true)}
    />
  );
}
