"use client";

import { DEFAULT_PLATFORM_SETTINGS, SEARCH_RADIUS_EXPANSION_KM } from "@the-ride/types";
import { Badge, Card, CardContent, CardDescription, CardHeader, CardTitle, useTranslation } from "@the-ride/ui";

/**
 * Search Radius Settings (Sprint 4, Part 7/10). The expansion tiers here
 * are `@the-ride/utils`'s `getRadiusForAttempt` sequence — the same one
 * `DispatchService.dispatch()` walks through. See docs/search-expansion.md.
 */
export function SearchRadiusTab() {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader>
          <CardTitle>{t("admin.searchRadius.initialRadius")}</CardTitle>
          <CardDescription>{t("admin.searchRadius.initialRadiusDescription")}</CardDescription>
        </CardHeader>
        <CardContent>
          <span className="text-2xl font-semibold text-neutral-900 dark:text-neutral-50">{DEFAULT_PLATFORM_SETTINGS.searchRadiusKm} km</span>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("admin.searchRadius.expansionTiers")}</CardTitle>
          <CardDescription>{t("admin.searchRadius.expansionTiersDescription")}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          {SEARCH_RADIUS_EXPANSION_KM.map((radiusKm, index) => (
            <Badge key={radiusKm} tone={index === 0 ? "brand" : "neutral"}>
              {t("admin.searchRadius.tier", { number: index + 1, km: radiusKm })}
            </Badge>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
