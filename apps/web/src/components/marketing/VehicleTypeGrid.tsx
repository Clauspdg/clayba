"use client";

import { Badge, Icon, useTranslation } from "@the-ride/ui";
import { motion } from "framer-motion";

import { Reveal } from "./Reveal";
import { VehicleIllustration } from "./VehicleIllustration";
import { VEHICLE_TYPES } from "./vehicle-types";

export function VehicleTypeGrid() {
  const { t } = useTranslation();

  return (
    <div className="tablet:grid-cols-2 laptop:grid-cols-3 grid gap-5">
      {VEHICLE_TYPES.map((vehicle, index) => (
        <Reveal key={vehicle.id} delay={index * 0.06}>
          <motion.div
            whileHover={{ y: -6 }}
            transition={{ type: "spring", stiffness: 300, damping: 22 }}
            className="shadow-elevation1 duration-normal hover:shadow-elevation3 group h-full overflow-hidden rounded-2xl border border-neutral-100 bg-white transition-shadow dark:border-neutral-800 dark:bg-neutral-900"
          >
            <div className="from-brand-50 to-brand-100 text-brand dark:from-brand-900 dark:to-brand-800 dark:text-brand-300 flex h-28 items-center justify-center bg-gradient-to-br transition-transform duration-500 group-hover:scale-105">
              <VehicleIllustration
                tall={vehicle.id === "van" || vehicle.id === "suv"}
                className="h-16 w-32"
              />
            </div>
            <div className="flex flex-col gap-3 p-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-50">
                  {t(vehicle.nameKey)}
                </h3>
                <span className="flex items-center gap-1 text-sm font-medium text-neutral-700 dark:text-neutral-300">
                  <Icon name="star" size={14} className="text-brand fill-current" />
                  {vehicle.rating.toFixed(1)}
                </span>
              </div>
              <p className="text-sm text-neutral-500 dark:text-neutral-400">
                {t(vehicle.descriptionKey)}
              </p>

              <div className="flex flex-wrap gap-2">
                <Badge tone="neutral">
                  <Icon name="users" size={12} />
                  {vehicle.capacity} {t("website.vehicleTypes.seats")}
                </Badge>
                <Badge tone="neutral">
                  <Icon name="fileText" size={12} />
                  {vehicle.luggage} {t("website.vehicleTypes.bags")}
                </Badge>
                {vehicle.hasAc && (
                  <Badge tone="neutral">
                    <Icon name="checkCircle" size={12} />
                    {t("website.vehicleTypes.ac")}
                  </Badge>
                )}
                {vehicle.hasWifi && (
                  <Badge tone="neutral">
                    <Icon name="globe" size={12} />
                    {t("website.vehicleTypes.wifi")}
                  </Badge>
                )}
              </div>

              <p className="text-brand mt-1 text-2xl font-bold">${vehicle.basePrice.toFixed(2)}+</p>
            </div>
          </motion.div>
        </Reveal>
      ))}
    </div>
  );
}
