import { Ionicons } from "@expo/vector-icons";
import {
  getGlobalSettings,
  subscribeEmergencyContacts,
  triggerSosAlert,
} from "@the-ride/firebase/client";
import { useAuth, useTranslation } from "@the-ride/hooks";
import {
  DEFAULT_EMERGENCY_NUMBER,
  EMERGENCY_NUMBER_BY_COUNTRY,
  type EmergencyContact,
  type Trip,
} from "@the-ride/types";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Linking,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";

import { passengerFirestore, passengerFunctions } from "@/lib/firebase-client";
import { getCurrentLocation } from "@/lib/location-tracking";
import { usePalette } from "@/theme/usePalette";
import { radius, spacing } from "@/theme/tokens";

import { AppButton } from "./AppButton";
import { AppText } from "./AppText";
import { ShareRideControl } from "./ShareRideControl";

type SosState = "idle" | "sending" | "sent" | "error";

/**
 * Native port of the web app's `SafetyPanel` — same `ShareRideControl`
 * reused verbatim, same real `emergencyContacts` collection. "Call
 * Emergency Services" is a genuine `tel:` action. "Send SOS Alert" is now
 * ALSO real (`triggerSosAlert`) — it records a staff-visible incident
 * dispatch/admin can see live in the admin app.
 */
export function SafetyPanel({ trip }: { trip: Trip }) {
  const { t } = useTranslation();
  const palette = usePalette();
  const { session } = useAuth();
  const [open, setOpen] = useState(false);
  const [contacts, setContacts] = useState<EmergencyContact[] | null>(null);
  const [emergencyNumber, setEmergencyNumber] = useState(DEFAULT_EMERGENCY_NUMBER);
  const [sosState, setSosState] = useState<SosState>("idle");

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

  useEffect(() => {
    if (!open) setSosState("idle");
  }, [open]);

  async function handleSendSos() {
    setSosState("sending");
    const reading = await getCurrentLocation().catch(() => null);
    try {
      await triggerSosAlert(
        passengerFunctions,
        trip.id,
        reading ? { lat: reading.lat, lng: reading.lng, accuracy: reading.accuracy } : undefined,
      );
      setSosState("sent");
    } catch {
      setSosState("error");
    }
  }

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
            {sosState === "sent" ? (
              <View
                style={[
                  styles.emergencyRow,
                  { backgroundColor: palette.successBg, borderColor: palette.success },
                ]}
              >
                <Ionicons name="checkmark-circle" size={20} color={palette.success} />
                <View style={styles.flex}>
                  <AppText variant="body" style={styles.bold}>
                    {t("rideHistory.safety.sosSentTitle")}
                  </AppText>
                  <AppText variant="caption" tone="muted">
                    {t("rideHistory.safety.sosSentBody")}
                  </AppText>
                </View>
              </View>
            ) : (
              <View style={[styles.section, { borderColor: palette.border }]}>
                <Pressable
                  onPress={() => void handleSendSos()}
                  disabled={sosState === "sending"}
                  style={[styles.sosButton, { backgroundColor: palette.danger }]}
                >
                  {sosState === "sending" ? (
                    <ActivityIndicator color="#FFFFFF" size="small" />
                  ) : (
                    <Ionicons name="warning" size={18} color="#FFFFFF" />
                  )}
                  <AppText variant="body" style={styles.sosButtonLabel}>
                    {sosState === "sending"
                      ? t("rideHistory.safety.sosSendingCta")
                      : sosState === "error"
                        ? t("rideHistory.safety.sosRetryCta")
                        : t("rideHistory.safety.sosCta")}
                  </AppText>
                </Pressable>
                {sosState === "error" && (
                  <AppText variant="caption" tone="danger">
                    {t("rideHistory.safety.sosErrorBody")}
                  </AppText>
                )}
              </View>
            )}

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
  sosButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    borderRadius: radius.lg,
    paddingVertical: spacing.md,
  },
  sosButtonLabel: { color: "#FFFFFF", fontWeight: "600" },
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
