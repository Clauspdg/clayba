import {
  addEmergencyContact,
  deleteEmergencyContact,
  subscribeEmergencyContacts,
} from "@the-ride/firebase/client";
import { useAuth, useTranslation } from "@the-ride/hooks";
import type { EmergencyContact } from "@the-ride/types";
import { useEffect, useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";

import { AppButton } from "@/components/AppButton";
import { AppCard } from "@/components/AppCard";
import { AppText } from "@/components/AppText";
import { AppTextField } from "@/components/AppTextField";
import { EmptyState } from "@/components/EmptyState";
import { LoadingState } from "@/components/LoadingState";
import { Screen } from "@/components/Screen";
import { passengerFirestore } from "@/lib/firebase-client";
import { spacing } from "@/theme/tokens";

/** Emergency Contacts — real `emergencyContacts` collection, surfaced from the Account tab and from the active-ride Safety panel. */
export default function EmergencyContactsScreen() {
  const { t } = useTranslation();
  const { session } = useAuth();
  const [contacts, setContacts] = useState<EmergencyContact[] | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const [adding, setAdding] = useState(false);
  const [name, setName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [relationship, setRelationship] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!session) return;
    return subscribeEmergencyContacts(passengerFirestore, session.uid, setContacts, () =>
      setContacts([]),
    );
  }, [session]);

  async function handleSave() {
    if (!session || !name.trim() || !phoneNumber.trim()) return;
    setSaving(true);
    try {
      await addEmergencyContact(passengerFirestore, session.uid, {
        name: name.trim(),
        phoneNumber: phoneNumber.trim(),
        relationship: relationship.trim() || undefined,
      });
      setName("");
      setPhoneNumber("");
      setRelationship("");
      setAdding(false);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(contactId: string) {
    setBusyId(contactId);
    try {
      await deleteEmergencyContact(passengerFirestore, contactId);
    } finally {
      setBusyId(null);
    }
  }

  if (adding) {
    return (
      <Screen style={styles.container}>
        <AppText variant="title">{t("rideHistory.safety.trustedContactTitle")}</AppText>
        <AppTextField label={t("common.name")} value={name} onChangeText={setName} />
        <AppTextField
          label={t("common.phone")}
          value={phoneNumber}
          onChangeText={setPhoneNumber}
          keyboardType="phone-pad"
        />
        <AppTextField
          label={t("common.relationship")}
          value={relationship}
          onChangeText={setRelationship}
        />
        <View style={styles.formActions}>
          <AppButton
            label={t("common.save")}
            disabled={!name.trim() || !phoneNumber.trim()}
            isLoading={saving}
            onPress={() => void handleSave()}
          />
          <AppButton
            label={t("common.cancel")}
            variant="outline"
            onPress={() => setAdding(false)}
          />
        </View>
      </Screen>
    );
  }

  return (
    <Screen style={styles.container}>
      <View style={styles.header}>
        <AppText variant="title">{t("rideHistory.safety.trustedContactTitle")}</AppText>
        <AppButton label={t("common.add")} size="md" onPress={() => setAdding(true)} />
      </View>

      {contacts === null ? (
        <LoadingState label={t("common.loading")} />
      ) : contacts.length === 0 ? (
        <EmptyState icon="shield-outline" title={t("rideHistory.safety.noTrustedContact")} />
      ) : (
        <ScrollView contentContainerStyle={styles.list}>
          {contacts.map((contact) => (
            <AppCard key={contact.id} style={styles.row}>
              <View style={styles.info}>
                <AppText variant="subheading">{contact.name}</AppText>
                <AppText variant="body" tone="muted">
                  {contact.phoneNumber}
                  {contact.relationship ? ` · ${contact.relationship}` : ""}
                </AppText>
              </View>
              <AppButton
                label={t("common.delete")}
                variant="ghost"
                size="md"
                isLoading={busyId === contact.id}
                onPress={() => void handleDelete(contact.id)}
              />
            </AppCard>
          ))}
        </ScrollView>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.md },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  list: { gap: spacing.sm, paddingBottom: spacing.xl },
  row: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  info: { flex: 1, gap: 2 },
  formActions: { gap: spacing.sm, marginTop: spacing.sm },
});
