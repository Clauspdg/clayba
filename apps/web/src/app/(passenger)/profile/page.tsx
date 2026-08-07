"use client";

import { webFirestore } from "@/lib/firebase-client";
import {
  addEmergencyContact,
  deleteEmergencyContact,
  getOrCreatePassengerProfile,
  subscribeEmergencyContacts,
  updatePassengerPreferences,
  updateUserPhoneNumber,
  uploadPassengerAvatar,
} from "@the-ride/firebase/client";
import {
  Avatar,
  Badge,
  Button,
  Card,
  CardContent,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Heading,
  Input,
  Select,
  useToast,
  useTranslation,
} from "@the-ride/ui";
import { useAuth, LOCALES, LOCALE_LABELS } from "@the-ride/hooks";
import type { EmergencyContact } from "@the-ride/types";
import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";

export default function ProfilePage() {
  const { t, setLocale } = useTranslation();
  const { session, signOut, updateDisplayName, updatePhotoURL, sendEmailVerification } = useAuth();
  const { toast } = useToast();
  const router = useRouter();

  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [resendingVerification, setResendingVerification] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [savingPhone, setSavingPhone] = useState(false);
  const [language, setLanguage] = useState("en");
  const [savingLanguage, setSavingLanguage] = useState(false);
  const [contacts, setContacts] = useState<EmergencyContact[] | null>(null);
  const [addingContact, setAddingContact] = useState(false);
  const [contactForm, setContactForm] = useState({ name: "", phoneNumber: "", relationship: "" });
  const [savingContact, setSavingContact] = useState(false);
  const [busyContactId, setBusyContactId] = useState<string | null>(null);

  useEffect(() => {
    if (!session) return;
    void getOrCreatePassengerProfile(webFirestore, session.uid).then((p) => {
      setLanguage(p.preferences.language);
    });
    return subscribeEmergencyContacts(webFirestore, session.uid, setContacts, (message) =>
      toast({ variant: "danger", title: message }),
    );
  }, [session, toast]);

  if (!session) return null;
  const uid = session.uid;

  async function handleLogout() {
    await signOut();
    router.push("/");
  }

  async function handleSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const displayName = String(formData.get("displayName") ?? "").trim();

    setSaving(true);
    try {
      await updateDisplayName(displayName);
      toast({ variant: "success", title: t("profile.editProfile"), description: displayName });
      setEditing(false);
    } catch {
      toast({ variant: "danger", title: t("common.error") });
    } finally {
      setSaving(false);
    }
  }

  async function handleResendVerification() {
    setResendingVerification(true);
    try {
      await sendEmailVerification();
      toast({ variant: "success", title: t("auth.resetLinkSent") });
    } catch {
      toast({ variant: "danger", title: t("common.error") });
    } finally {
      setResendingVerification(false);
    }
  }

  async function handleAvatarChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.currentTarget.files?.[0];
    if (!file || !session) return;
    setUploadingAvatar(true);
    try {
      const url = await uploadPassengerAvatar(uid, file);
      await updatePhotoURL(url);
      toast({ variant: "success", title: t("profile.avatarUpdated") });
    } catch (err) {
      toast({ variant: "danger", title: err instanceof Error ? err.message : t("common.error") });
    } finally {
      setUploadingAvatar(false);
    }
  }

  async function handleSavePhone() {
    setSavingPhone(true);
    try {
      await updateUserPhoneNumber(webFirestore, uid, phoneNumber);
      toast({ variant: "success", title: t("profile.phoneUpdated") });
    } catch (err) {
      toast({ variant: "danger", title: err instanceof Error ? err.message : t("common.error") });
    } finally {
      setSavingPhone(false);
    }
  }

  async function handleSaveLanguage(next: string) {
    setLanguage(next);
    setLocale(next as (typeof LOCALES)[number]);
    setSavingLanguage(true);
    try {
      await updatePassengerPreferences(webFirestore, uid, { language: next });
      toast({ variant: "success", title: t("profile.languageUpdated") });
    } catch (err) {
      toast({ variant: "danger", title: err instanceof Error ? err.message : t("common.error") });
    } finally {
      setSavingLanguage(false);
    }
  }

  async function handleAddContact() {
    setSavingContact(true);
    try {
      await addEmergencyContact(webFirestore, uid, {
        name: contactForm.name,
        phoneNumber: contactForm.phoneNumber,
        relationship: contactForm.relationship || undefined,
      });
      toast({ variant: "success", title: t("profile.emergencyContactAdded") });
      setAddingContact(false);
      setContactForm({ name: "", phoneNumber: "", relationship: "" });
    } catch (err) {
      toast({ variant: "danger", title: err instanceof Error ? err.message : t("common.error") });
    } finally {
      setSavingContact(false);
    }
  }

  async function handleDeleteContact(contactId: string) {
    setBusyContactId(contactId);
    try {
      await deleteEmergencyContact(webFirestore, contactId);
    } catch (err) {
      toast({ variant: "danger", title: err instanceof Error ? err.message : t("common.error") });
    } finally {
      setBusyContactId(null);
    }
  }

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <Heading level={1}>{t("profile.title")}</Heading>

      <Card>
        <CardContent className="flex flex-col gap-6 p-8">
          <div className="flex items-center justify-between">
            <Heading level={3}>{t("profile.accountDetails")}</Heading>
            <Badge tone={session.emailVerified ? "success" : "warning"}>
              {session.emailVerified ? t("profile.emailVerified") : t("profile.emailNotVerified")}
            </Badge>
          </div>

          {editing ? (
            <form onSubmit={handleSave} className="flex flex-col gap-4">
              <Input
                label={t("auth.fullNameLabel")}
                name="displayName"
                defaultValue={session.displayName ?? ""}
                autoCapitalize="words"
                required
              />
              <div className="flex gap-3">
                <Button type="submit" isLoading={saving}>
                  {t("common.save")}
                </Button>
                <Button type="button" variant="outline" onClick={() => setEditing(false)}>
                  {t("common.cancel")}
                </Button>
              </div>
            </form>
          ) : (
            <>
              <dl className="grid gap-3">
                <div className="flex justify-between border-b border-neutral-100 py-2 dark:border-neutral-800">
                  <dt className="text-sm text-neutral-500 dark:text-neutral-400">
                    {t("auth.fullNameLabel")}
                  </dt>
                  <dd className="text-sm font-medium">{session.displayName || "—"}</dd>
                </div>
                <div className="flex justify-between border-b border-neutral-100 py-2 dark:border-neutral-800">
                  <dt className="text-sm text-neutral-500 dark:text-neutral-400">
                    {t("auth.emailLabel")}
                  </dt>
                  <dd className="text-sm font-medium">{session.email}</dd>
                </div>
                <div className="flex justify-between py-2">
                  <dt className="text-sm text-neutral-500 dark:text-neutral-400">
                    {t("profile.role")}
                  </dt>
                  <dd className="text-sm font-medium capitalize">{session.claims.role}</dd>
                </div>
              </dl>
              <Button variant="outline" onClick={() => setEditing(true)} className="self-start">
                {t("profile.editProfile")}
              </Button>
            </>
          )}

          {!session.emailVerified && (
            <Button
              variant="ghost"
              onClick={() => void handleResendVerification()}
              isLoading={resendingVerification}
              className="self-start"
            >
              {t("auth.resendVerificationEmail")}
            </Button>
          )}

          <Button variant="destructive" onClick={() => void handleLogout()} className="self-start">
            {t("settings.logOut")}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="flex flex-col gap-4 p-8">
          <Heading level={3}>{t("profile.uploadAvatar")}</Heading>
          <div className="flex items-center gap-4">
            <Avatar
              src={session.photoURL ?? undefined}
              alt={session.displayName ?? session.email ?? ""}
              fallback={(session.displayName ?? session.email ?? "?").charAt(0).toUpperCase()}
              size="lg"
            />
            <input
              type="file"
              accept="image/*"
              onChange={(e) => void handleAvatarChange(e)}
              aria-label={t("profile.uploadAvatar")}
              className="text-sm"
              disabled={uploadingAvatar}
            />
            {uploadingAvatar && (
              <span className="text-sm text-neutral-500 dark:text-neutral-400">
                {t("common.loading")}
              </span>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="flex flex-col gap-4 p-8">
          <Heading level={3}>{t("profile.phoneNumber")}</Heading>
          <div className="flex gap-3">
            <Input
              type="tel"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder={t("profile.phoneNumberPlaceholder")}
            />
            <Button
              onClick={() => void handleSavePhone()}
              isLoading={savingPhone}
              disabled={!phoneNumber.trim()}
            >
              {t("common.save")}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="flex flex-col gap-4 p-8">
          <Heading level={3}>{t("profile.language")}</Heading>
          <Select
            label={t("profile.language")}
            value={language}
            onValueChange={(next) => void handleSaveLanguage(next)}
            options={LOCALES.map((code) => ({ value: code, label: LOCALE_LABELS[code] }))}
            disabled={savingLanguage}
          />
        </CardContent>
      </Card>

      <Card>
        <CardContent className="flex flex-col gap-4 p-8">
          <div className="flex items-center justify-between">
            <Heading level={3}>{t("profile.emergencyContacts")}</Heading>
            <Button size="sm" onClick={() => setAddingContact(true)}>
              {t("profile.addEmergencyContact")}
            </Button>
          </div>
          {contacts === null ? (
            <span className="text-sm text-neutral-500 dark:text-neutral-400">
              {t("common.loading")}
            </span>
          ) : contacts.length === 0 ? (
            <span className="text-sm text-neutral-500 dark:text-neutral-400">
              {t("profile.noEmergencyContacts")}
            </span>
          ) : (
            <ul className="flex flex-col gap-2">
              {contacts.map((contact) => (
                <li
                  key={contact.id}
                  className="flex items-center justify-between border-b border-neutral-100 py-2 dark:border-neutral-800"
                >
                  <div>
                    <p className="text-sm font-medium">{contact.name}</p>
                    <p className="text-sm text-neutral-500 dark:text-neutral-400">
                      {contact.phoneNumber}
                      {contact.relationship ? ` — ${contact.relationship}` : ""}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    isLoading={busyContactId === contact.id}
                    onClick={() => void handleDeleteContact(contact.id)}
                  >
                    {t("common.delete")}
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Dialog open={addingContact} onOpenChange={setAddingContact}>
        <DialogContent closeLabel={t("common.close")}>
          <DialogHeader>
            <DialogTitle>{t("profile.addEmergencyContact")}</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4">
            <Input
              label={t("profile.contactName")}
              value={contactForm.name}
              onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
            />
            <Input
              type="tel"
              label={t("profile.contactPhone")}
              value={contactForm.phoneNumber}
              onChange={(e) => setContactForm({ ...contactForm, phoneNumber: e.target.value })}
            />
            <Input
              label={t("profile.contactRelationship")}
              value={contactForm.relationship}
              onChange={(e) => setContactForm({ ...contactForm, relationship: e.target.value })}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddingContact(false)}>
              {t("common.cancel")}
            </Button>
            <Button
              onClick={() => void handleAddContact()}
              isLoading={savingContact}
              disabled={!contactForm.name.trim() || !contactForm.phoneNumber.trim()}
            >
              {t("common.save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
