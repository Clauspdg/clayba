"use client";

import { Badge, Text, useTranslation } from "@the-ride/ui";
import { Role, type DriverLifecycleState } from "@the-ride/types";

const ROLE_LABEL_KEY: Record<Role, string> = {
  [Role.PASSENGER]: "driverSpace.role.passenger",
  [Role.DRIVER]: "driverSpace.role.driver",
  [Role.DISPATCHER]: "driverSpace.role.dispatcher",
  [Role.SUPPORT]: "driverSpace.role.support",
  [Role.MODERATOR]: "driverSpace.role.moderator",
  [Role.ADMIN]: "driverSpace.role.admin",
  [Role.SUPER_ADMIN]: "driverSpace.role.superAdmin",
  [Role.CONTENT_MANAGER]: "driverSpace.role.contentManager",
};

const LIFECYCLE_TONE: Record<
  DriverLifecycleState["stage"],
  "success" | "warning" | "danger" | "neutral"
> = {
  active: "success",
  suspended: "warning",
  inactive: "danger",
  applicant: "neutral",
  none: "neutral",
};

/**
 * UX-3 sprint (Dedicated Driver Space), Part 14 — fixes the exact bug the
 * spec calls out: an active driver's `/profile` page used to hardcode
 * `session.claims.role` (always literally "passenger" — see
 * `resolveUserExperience`'s doc comment on why the driver claim is never
 * actually set), so a real activated driver saw only "Role: Passenger"
 * with no mention of their driver capability at all. This reads the SAME
 * resolved `roles`/`lifecycleState` every other UX-1/UX-3 surface already
 * uses instead of a second, incomplete signal — shared by `/profile` and
 * `/driver/account` so both tell the truth identically.
 */
export function CapabilitySummary({
  roles,
  lifecycleState,
}: {
  roles: Role[];
  lifecycleState: DriverLifecycleState | null;
}) {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-1.5">
        <Text size="sm" tone="muted">
          {t("driverSpace.account.capabilitiesLabel")}
        </Text>
        <div className="flex flex-wrap gap-2">
          {roles.length === 0 ? (
            <Text size="sm">—</Text>
          ) : (
            roles.map((role) => (
              <Badge key={role} tone="neutral">
                {t(ROLE_LABEL_KEY[role])}
              </Badge>
            ))
          )}
        </div>
      </div>
      {lifecycleState && lifecycleState.stage !== "none" && (
        <div className="flex flex-col gap-1.5">
          <Text size="sm" tone="muted">
            {t("driverSpace.account.driverStatusLabel")}
          </Text>
          <Badge tone={LIFECYCLE_TONE[lifecycleState.stage]}>
            {t(`driverSpace.lifecycleStage.${lifecycleState.stage}`)}
          </Badge>
        </div>
      )}
    </div>
  );
}
