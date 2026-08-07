"use client";

import {
  Button,
  Card,
  CardContent,
  Heading,
  LoadingState,
  PasswordInput,
  Text,
  useTranslation,
} from "@the-ride/ui";
import { useAuth } from "@the-ride/hooks";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useState, type FormEvent } from "react";

function ResetPasswordForm() {
  const { t } = useTranslation();
  const { error, confirmPasswordReset } = useAuth();
  const searchParams = useSearchParams();
  const oobCode = searchParams.get("oobCode");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [mismatch, setMismatch] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!oobCode) return;

    const formData = new FormData(event.currentTarget);
    const password = String(formData.get("password") ?? "");
    const confirmPassword = String(formData.get("confirmPassword") ?? "");

    if (password !== confirmPassword) {
      setMismatch(true);
      return;
    }
    setMismatch(false);

    setSubmitting(true);
    try {
      await confirmPasswordReset(oobCode, password);
      setDone(true);
    } catch {
      // `error` from useAuth() already carries the message; the form re-renders with it below.
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Card className="w-full max-w-sm">
      <CardContent className="flex flex-col gap-6 p-8">
        <div>
          <Heading level={2}>{t("auth.resetPasswordTitle")}</Heading>
          <Text tone="muted" size="sm">
            {t("auth.resetPasswordSubtitle")}
          </Text>
        </div>
        {!oobCode ? (
          <Text tone="danger" size="sm">
            {t("auth.invalidOrExpiredLink")}
          </Text>
        ) : done ? (
          <Text size="sm">{t("auth.passwordResetSuccess")}</Text>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <PasswordInput
              label={t("auth.newPasswordLabel")}
              name="password"
              showPasswordLabel={t("common.showPassword")}
              hidePasswordLabel={t("common.hidePassword")}
              minLength={8}
              required
            />
            <PasswordInput
              label={t("auth.confirmPasswordLabel")}
              name="confirmPassword"
              showPasswordLabel={t("common.showPassword")}
              hidePasswordLabel={t("common.hidePassword")}
              errorText={mismatch ? t("auth.passwordsDontMatch") : undefined}
              required
            />
            {error && (
              <Text tone="danger" size="sm">
                {error}
              </Text>
            )}
            <Button type="submit" fullWidth isLoading={submitting}>
              {t("auth.resetPassword")}
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
  );
}

export default function ResetPasswordPage() {
  const { t } = useTranslation();
  return (
    <div className="flex min-h-[calc(100vh-8rem)] items-center justify-center bg-neutral-50 px-6 py-16 dark:bg-neutral-950">
      <Suspense fallback={<LoadingState title={t("common.loading")} />}>
        <ResetPasswordForm />
      </Suspense>
    </div>
  );
}
