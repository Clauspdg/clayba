"use client";

import { webFirestore } from "@/lib/firebase-client";
import { getGlobalSettings, subscribeEmergencyContacts } from "@the-ride/firebase/client";
import {
  Button,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  Icon,
  Text,
  useTranslation,
} from "@the-ride/ui";
import { useAuth } from "@the-ride/hooks";
import type { EmergencyContact, Trip } from "@the-ride/types";
import Link from "next/link";
import { useEffect, useState } from "react";

import { ShareRideControl } from "./ShareRideControl";

/**
 * CLAYBA P1.1, section 4 — best-effort emergency dial number derived from
 * the platform's real `settings.country` (already used for currency/tax
 * elsewhere), not a fabricated field. Deliberately small and honest: only
 * the handful of countries below have a confirmed single national number;
 * everything else falls back to 112 (the GSM standard emergency code,
 * functional on most modern phones regardless of carrier/country, though
 * not a guarantee of correct routing everywhere) rather than guessing.
 */
const EMERGENCY_NUMBER_BY_COUNTRY: Record<string, string> = {
  US: "911",
  CA: "911",
  GB: "999",
  FR: "112",
  DE: "112",
};
const DEFAULT_EMERGENCY_NUMBER = "112";

/**
 * CLAYBA P1.1, section 4 — the SOS/Safety panel. `createRideShare`'s real
 * flow (`ShareRideControl`) is reused verbatim, not re-implemented.
 * "Call Emergency Services" is a genuine `tel:` action, never a simulated
 * alert (no automatic dispatch/notification system exists — this sprint
 * explicitly forbids pretending one does). "Trusted Contact" is NOT a
 * placeholder: `emergencyContacts` (Sprint 6) is a real, owner-writable
 * Firestore collection already manageable at /profile — shown here for
 * real, with an honest "none saved yet" state (not fabricated data) when
 * empty.
 */
export function SafetyPanel({ trip }: { trip: Trip }) {
  const { t } = useTranslation();
  const { session } = useAuth();
  const [open, setOpen] = useState(false);
  const [contacts, setContacts] = useState<EmergencyContact[] | null>(null);
  const [emergencyNumber, setEmergencyNumber] = useState(DEFAULT_EMERGENCY_NUMBER);

  useEffect(() => {
    if (!open || !session) return;
    return subscribeEmergencyContacts(webFirestore, session.uid, setContacts, () =>
      setContacts([]),
    );
  }, [open, session]);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    getGlobalSettings(webFirestore)
      .then((settings) => {
        if (cancelled || !settings?.country) return;
        setEmergencyNumber(
          EMERGENCY_NUMBER_BY_COUNTRY[settings.country] ?? DEFAULT_EMERGENCY_NUMBER,
        );
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [open]);

  return (
    <>
      <Button variant="destructive" size="sm" onClick={() => setOpen(true)}>
        <Icon name="alertCircle" size={14} className="mr-1.5" />
        {t("rideHistory.safety.cta")}
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent closeLabel={t("common.close")}>
          <DialogHeader>
            <DialogTitle>{t("rideHistory.safety.title")}</DialogTitle>
          </DialogHeader>

          <div className="flex flex-col gap-4">
            <a
              href={`tel:${emergencyNumber}`}
              className="border-danger/30 bg-danger/5 text-danger flex items-center gap-3 rounded-xl border p-4 font-medium transition-colors hover:bg-red-50 dark:hover:bg-red-950"
            >
              <Icon name="phone" size={20} />
              <div>
                <Text weight="semibold" className="text-danger">
                  {t("rideHistory.safety.callEmergencyCta")}
                </Text>
                <Text size="xs" tone="muted">
                  {t("rideHistory.safety.callEmergencyNumber", { number: emergencyNumber })}
                </Text>
              </div>
            </a>

            <div className="flex flex-col gap-2 rounded-xl border border-neutral-200 p-4 dark:border-neutral-800">
              <Text weight="medium" size="sm">
                {t("rideHistory.safety.shareTitle")}
              </Text>
              <ShareRideControl trip={trip} />
            </div>

            <div className="flex flex-col gap-2 rounded-xl border border-neutral-200 p-4 dark:border-neutral-800">
              <Text weight="medium" size="sm">
                {t("rideHistory.safety.trustedContactTitle")}
              </Text>
              {contacts === null ? (
                <Text size="xs" tone="muted">
                  {t("common.loading")}
                </Text>
              ) : contacts.length === 0 ? (
                <>
                  <Text size="xs" tone="muted">
                    {t("rideHistory.safety.noTrustedContact")}
                  </Text>
                  <Link href="/profile" className="text-brand w-fit text-xs hover:underline">
                    {t("rideHistory.safety.addTrustedContactCta")}
                  </Link>
                </>
              ) : (
                <div className="flex flex-col gap-2">
                  {contacts.map((contact) => (
                    <a
                      key={contact.id}
                      href={`tel:${contact.phoneNumber}`}
                      className="hover:border-brand flex items-center justify-between rounded-lg border border-neutral-200 px-3 py-2 text-sm transition-colors dark:border-neutral-800"
                    >
                      <span>{contact.name}</span>
                      <span className="text-brand flex items-center gap-1">
                        <Icon name="phone" size={14} />
                        {contact.phoneNumber}
                      </span>
                    </a>
                  ))}
                </div>
              )}
            </div>

            <Link
              href="/support"
              className="flex items-center gap-3 rounded-xl border border-neutral-200 p-4 transition-colors hover:border-neutral-300 dark:border-neutral-800 dark:hover:border-neutral-700"
            >
              <Icon name="lifeBuoy" size={20} className="text-brand" />
              <Text weight="medium">{t("rideHistory.safety.contactSupportCta")}</Text>
            </Link>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
