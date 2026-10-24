export const EMERGENCY_CONTACTS_COLLECTION = "emergencyContacts";
export const SOS_INCIDENTS_COLLECTION = "sosIncidents";

/**
 * Best-effort national emergency-dial number, keyed by the platform's real
 * `settings.country` (already used for currency/tax elsewhere) — not a
 * fabricated field. Deliberately small and honest: only the handful of
 * countries below have a confirmed single national number; everything else
 * falls back to `DEFAULT_EMERGENCY_NUMBER` (112, the GSM standard emergency
 * code, functional on most modern phones regardless of carrier/country,
 * though not a guarantee of correct routing everywhere) rather than
 * guessing. Shared across web, passenger-app, and driver-app so the table
 * has one source of truth instead of three copies.
 */
export const EMERGENCY_NUMBER_BY_COUNTRY: Record<string, string> = {
  US: "911",
  CA: "911",
  GB: "999",
  FR: "112",
  DE: "112",
};
export const DEFAULT_EMERGENCY_NUMBER = "112";
