"use client";

import {
  Button,
  Card,
  CardContent,
  Heading,
  Icon,
  Input,
  Text,
  useTranslation,
} from "@the-ride/ui";
import { useAuth } from "@the-ride/hooks";
import Link from "next/link";
import { useState, type FormEvent } from "react";

export default function ForgotPasswordPage() {
  const { t } = useTranslation();
  const { error, sendPasswordReset } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email") ?? "");

    setSubmitting(true);
    try {
      // Errors are swallowed deliberately: the success message is identical
      // whether or not an account exists for this email, so a client can
      // never enumerate registered addresses via this form.
      await sendPasswordReset(email).catch(() => undefined);
      setSent(true);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-[calc(100vh-8rem)] items-center justify-center bg-neutral-50 px-6 py-16 dark:bg-neutral-950">
      <Card className="animate-slide-up w-full max-w-sm">
        <CardContent className="flex flex-col gap-6 p-8">
          <span className="bg-brand-50 text-brand dark:bg-brand-900 mx-auto flex h-12 w-12 items-center justify-center rounded-2xl">
            <Icon name={sent ? "checkCircle" : "helpCircle"} size={22} />
          </span>
          <div className="text-center">
            <Heading level={2}>{t("auth.forgotPasswordTitle")}</Heading>
            <Text tone="muted" size="sm">
              {t("auth.forgotPasswordSubtitle")}
            </Text>
          </div>
          {sent ? (
            <Text size="sm" className="text-center">
              {t("auth.resetLinkSent")}
            </Text>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <Input
                label={t("auth.emailLabel")}
                name="email"
                type="email"
                placeholder={t("auth.emailPlaceholder")}
                required
              />
              {error && (
                <Text tone="danger" size="sm">
                  {error}
                </Text>
              )}
              <Button type="submit" fullWidth isLoading={submitting}>
                {t("auth.sendResetLink")}
              </Button>
            </form>
          )}
          <Text size="sm" tone="muted" className="text-center">
            <Link href="/login" className="text-brand font-medium hover:underline">
              {t("auth.backToLogin")}
            </Link>
          </Text>
        </CardContent>
      </Card>
    </div>
  );
}
