"use client";

import { webFirestore, webFunctions } from "@/lib/firebase-client";
import {
  getGlobalSettings,
  subscribeEmergencyContacts,
  triggerSosAlert,
} from "@the-ride/firebase/client";
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
import {
  DEFAULT_EMERGENCY_NUMBER,
  EMERGENCY_NUMBER_BY_COUNTRY,
  type EmergencyContact,
  type Trip,
} from "@the-ride/types";
import Link from "next/link";
import { useEffect, useState } from "react";

import { ShareRideControl } from "./ShareRideControl";

type SosState = "idle" | "sending" | "sent" | "error";

/**
 * Best-effort one-shot location for the SOS alert — mirrors the
 * `navigator.geolocation.getCurrentPosition` shape already used in
 * `apps/web/src/app/(driver)/driver/page.tsx`, but with a shorter timeout
 * (SOS is urgent) and, critically, NEVER rejects: permission denial or an
 * unsupported browser resolves `undefined` so the alert is always sent,
 * with or without a location fix.
 */
function getBestEffortLocation(): Promise<
  { lat: number; lng: number; accuracy?: number } | undefined
> {
  return new Promise((resolve) => {
    if (!("geolocation" in navigator)) {
      resolve(undefined);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) =>
        resolve({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: position.coords.accuracy,
        }),
      () => resolve(undefined),
      { enableHighAccuracy: false, timeout: 5000, maximumAge: 0 },
    );
  });
}

/**
 * CLAYBA P1.1, section 4 — the SOS/Safety panel. `createRideShare`'s real
 * flow (`ShareRideControl`) is reused verbatim, not re-implemented.
 * "Call Emergency Services" is a genuine `tel:` action. "Send SOS Alert"
 * is now ALSO real (`triggerSosAlert`) — it records a staff-visible
 * incident dispatch/admin can see live at `/emergency`, closing the gap
 * this comment used to document ("no automatic dispatch/notification
 * system exists"). "Trusted Contact" is NOT a placeholder:
 * `emergencyContacts` (Sprint 6) is a real, owner-writable Firestore
 * collection already manageable at /profile — shown here for real, with
 * an honest "none saved yet" state (not fabricated data) when empty.
 */
export function SafetyPanel({ trip }: { trip: Trip }) {
  const { t } = useTranslation();
  const { session } = useAuth();
  const [open, setOpen] = useState(false);
  const [contacts, setContacts] = useState<EmergencyContact[] | null>(null);
  const [emergencyNumber, setEmergencyNumber] = useState(DEFAULT_EMERGENCY_NUMBER);
  const [sosState, setSosState] = useState<SosState>("idle");

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

  useEffect(() => {
    if (!open) setSosState("idle");
  }, [open]);

  async function handleSendSos() {
    setSosState("sending");
    const location = await getBestEffortLocation();
    try {
      await triggerSosAlert(webFunctions, trip.id, location);
      setSosState("sent");
    } catch {
      setSosState("error");
    }
  }

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
            {sosState === "sent" ? (
              <div className="border-success/30 bg-success/5 flex items-center gap-3 rounded-xl border p-4">
                <Icon name="checkCircle" size={20} className="text-success" />
                <div>
                  <Text weight="semibold">{t("rideHistory.safety.sosSentTitle")}</Text>
                  <Text size="xs" tone="muted">
                    {t("rideHistory.safety.sosSentBody")}
                  </Text>
                </div>
              </div>
            ) : (
              <div className="border-danger/30 bg-danger/5 flex flex-col gap-2 rounded-xl border p-4">
                <Button
                  variant="destructive"
                  onClick={() => void handleSendSos()}
                  disabled={sosState === "sending"}
                >
                  <Icon name="alertCircle" size={16} className="mr-1.5" />
                  {sosState === "sending"
                    ? t("rideHistory.safety.sosSendingCta")
                    : sosState === "error"
                      ? t("rideHistory.safety.sosRetryCta")
                      : t("rideHistory.safety.sosCta")}
                </Button>
                {sosState === "error" && (
                  <Text size="xs" className="text-danger">
                    {t("rideHistory.safety.sosErrorBody")}
                  </Text>
                )}
              </div>
            )}

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
