import { Ionicons } from "@expo/vector-icons";
import { getGlobalSettings, triggerSosAlert } from "@the-ride/firebase/client";
import { useTranslation } from "@the-ride/hooks";
import { DEFAULT_EMERGENCY_NUMBER, EMERGENCY_NUMBER_BY_COUNTRY, type Trip } from "@the-ride/types";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import { Linking, Modal, Pressable, ScrollView, StyleSheet, View } from "react-native";

import { driverFirestore, driverFunctions } from "@/lib/firebase-client";
import { getCurrentLocation } from "@/lib/location-tracking";
import { usePalette } from "@/theme/usePalette";
import { radius, spacing } from "@/theme/tokens";

import { AppButton } from "./AppButton";
import { AppText } from "./AppText";

type SosState = "idle" | "sending" | "sent" | "error";

/**
 * Driver-app Safety panel — smaller than the passenger app's (no
 * `ShareRideControl`/trusted contacts, neither of which exist for a
 * driver today): the real `tel:` emergency-number call, the real "Send
 * SOS Alert" (`triggerSosAlert`, same callable the passenger apps use —
 * the server derives `triggeredBy: "driver"` from `trip.driverId`
 * matching the caller, no client flag needed), and Contact Support.
 * Previously there was no Safety/SOS UI anywhere in this app.
 */
export function SafetyPanel({ trip }: { trip: Trip }) {
  const { t } = useTranslation();
  const palette = usePalette();
  const [open, setOpen] = useState(false);
  const [emergencyNumber, setEmergencyNumber] = useState(DEFAULT_EMERGENCY_NUMBER);
  const [sosState, setSosState] = useState<SosState>("idle");

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    getGlobalSettings(driverFirestore)
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
        driverFunctions,
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
      <Pressable
        onPress={() => setOpen(true)}
        accessibilityRole="button"
        style={[styles.trigger, { backgroundColor: palette.dangerBg, borderColor: palette.danger }]}
      >
        <Ionicons name="alert-circle" size={16} color={palette.danger} />
        <AppText variant="caption" tone="danger" style={styles.bold}>
          {t("rideHistory.safety.cta")}
        </AppText>
      </Pressable>

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
                  styles.row,
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
              <View style={styles.section}>
                <AppButton
                  label={
                    sosState === "sending"
                      ? t("rideHistory.safety.sosSendingCta")
                      : sosState === "error"
                        ? t("rideHistory.safety.sosRetryCta")
                        : t("rideHistory.safety.sosCta")
                  }
                  variant="danger"
                  size="lg"
                  isLoading={sosState === "sending"}
                  onPress={() => void handleSendSos()}
                />
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
                styles.row,
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

            <Pressable
              onPress={() => {
                setOpen(false);
                router.push("/help");
              }}
              style={[styles.row, { borderColor: palette.border }]}
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
  trigger: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    borderWidth: 1,
    borderRadius: radius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
  },
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
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: spacing.md,
  },
  section: { gap: spacing.sm },
});
