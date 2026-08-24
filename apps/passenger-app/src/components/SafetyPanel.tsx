import { Ionicons } from "@expo/vector-icons";
import { getGlobalSettings, subscribeEmergencyContacts } from "@the-ride/firebase/client";
import { useAuth, useTranslation } from "@the-ride/hooks";
import type { EmergencyContact, Trip } from "@the-ride/types";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import { Linking, Modal, Pressable, ScrollView, StyleSheet, View } from "react-native";

import { passengerFirestore } from "@/lib/firebase-client";
import { usePalette } from "@/theme/usePalette";
import { radius, spacing } from "@/theme/tokens";

import { AppButton } from "./AppButton";
import { AppText } from "./AppText";
import { ShareRideControl } from "./ShareRideControl";

/**
 * Best-effort emergency dial number derived from the platform's real
 * `settings.country`, not a fabricated field — same small table as the web
 * app's `SafetyPanel` (duplicated here rather than shared: two call sites,
 * six rows, not worth a shared-package entry). Only the handful of
 * countries below have a confirmed single national number; everything
 * else falls back to 112 (the GSM standard emergency code) rather than
 * guessing.
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
 * Native port of the web app's `SafetyPanel` — same `ShareRideControl`
 * reused verbatim, same real `emergencyContacts` collection. "Call
 * Emergency Services" is a genuine `tel:` action, never a simulated alert
 * — no automatic dispatch/notification system exists anywhere in this
 * codebase, and this must not pretend one does.
 */
export function SafetyPanel({ trip }: { trip: Trip }) {
  const { t } = useTranslation();
  const palette = usePalette();
  const { session } = useAuth();
  const [open, setOpen] = useState(false);
  const [contacts, setContacts] = useState<EmergencyContact[] | null>(null);
  const [emergencyNumber, setEmergencyNumber] = useState(DEFAULT_EMERGENCY_NUMBER);

  useEffect(() => {
    if (!open || !session) return;
    return subscribeEmergencyContacts(passengerFirestore, session.uid, setContacts, () =>
      setContacts([]),
    );
  }, [open, session]);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    getGlobalSettings(passengerFirestore)
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
      <AppButton
        label={t("rideHistory.safety.cta")}
        variant="danger"
        size="md"
        onPress={() => setOpen(true)}
      />

      <Modal visible={open} animationType="slide" onRequestClose={() => setOpen(false)}>
        <View style={[styles.modal, { backgroundColor: palette.background }]}>
          <View style={styles.header}>
            <AppText variant="title">{t("rideHistory.safety.title")}</AppText>
            <Pressable onPress={() => setOpen(false)} accessibilityRole="button">
              <Ionicons name="close" size={24} color={palette.textPrimary} />
            </Pressable>
          </View>

          <ScrollView contentContainerStyle={styles.content}>
            <Pressable
              onPress={() => void Linking.openURL(`tel:${emergencyNumber}`)}
              style={[
                styles.emergencyRow,
                { backgroundColor: palette.dangerBg, borderColor: palette.danger },
              ]}
            >
              <Ionicons name="call" size={20} color={palette.danger} />
              <View style={styles.flex}>
                <AppText variant="body" tone="danger" style={styles.bold}>
                  {t("rideHistory.safety.callEmergencyCta")}
                </AppText>
                <AppText variant="caption" tone="muted">
                  {t("rideHistory.safety.callEmergencyNumber", { number: emergencyNumber })}
                </AppText>
              </View>
            </Pressable>

            <View style={[styles.section, { borderColor: palette.border }]}>
              <AppText variant="subheading">{t("rideHistory.safety.shareTitle")}</AppText>
              <ShareRideControl trip={trip} />
            </View>

            <View style={[styles.section, { borderColor: palette.border }]}>
              <AppText variant="subheading">{t("rideHistory.safety.trustedContactTitle")}</AppText>
              {contacts === null ? (
                <AppText variant="caption" tone="muted">
                  {t("common.loading")}
                </AppText>
              ) : contacts.length === 0 ? (
                <>
                  <AppText variant="caption" tone="muted">
                    {t("rideHistory.safety.noTrustedContact")}
                  </AppText>
                  <AppText
                    variant="caption"
                    tone="brand"
                    onPress={() => {
                      setOpen(false);
                      router.push("/emergency-contacts");
                    }}
                  >
                    {t("rideHistory.safety.addTrustedContactCta")}
                  </AppText>
                </>
              ) : (
                <View style={styles.contactList}>
                  {contacts.map((contact) => (
                    <Pressable
                      key={contact.id}
                      onPress={() => void Linking.openURL(`tel:${contact.phoneNumber}`)}
                      style={[styles.contactRow, { borderColor: palette.border }]}
                    >
                      <AppText variant="body">{contact.name}</AppText>
                      <AppText variant="body" tone="brand">
                        {contact.phoneNumber}
                      </AppText>
                    </Pressable>
                  ))}
                </View>
              )}
            </View>

            <Pressable
              onPress={() => {
                setOpen(false);
                router.push("/help");
              }}
              style={[styles.section, styles.supportRow, { borderColor: palette.border }]}
            >
              <Ionicons name="help-buoy-outline" size={20} color={palette.primary} />
              <AppText variant="body">{t("rideHistory.safety.contactSupportCta")}</AppText>
            </Pressable>
          </ScrollView>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  modal: { flex: 1, paddingTop: 60, paddingHorizontal: spacing.lg },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.md,
  },
  content: { gap: spacing.md, paddingBottom: spacing.xl },
  flex: { flex: 1 },
  bold: { fontWeight: "600" },
  emergencyRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: spacing.md,
  },
  section: { borderWidth: 1, borderRadius: radius.lg, padding: spacing.md, gap: spacing.sm },
  contactList: { gap: spacing.xs },
  contactRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderWidth: 1,
    borderRadius: radius.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
  },
  supportRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
});
