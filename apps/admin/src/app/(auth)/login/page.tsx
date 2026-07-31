"use client";

import { Button, Card, CardContent, Heading, Input, PasswordInput, Text, useTranslation } from "@the-ride/ui";
import { useAuth } from "@the-ride/hooks";
import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";

export default function AdminLoginPage() {
  const { t } = useTranslation();
  const { status, error, signIn } = useAuth();
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (status === "authenticated") {
      router.replace("/");
    }
  }, [status, router]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email") ?? "");
    const password = String(formData.get("password") ?? "");

    setSubmitting(true);
    try {
      await signIn(email, password);
    } catch {
      // `error` from useAuth() already carries the message; nothing further to do here.
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-50 px-6 dark:bg-neutral-950">
      <Card className="w-full max-w-sm">
        <CardContent className="flex flex-col gap-6 p-6">
          <div>
            <Heading level={3}>{t("admin.login.title")}</Heading>
            <Text tone="muted" size="sm">
              {t("admin.login.subtitle")}
            </Text>
          </div>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <Input label={t("auth.emailLabel")} name="email" type="email" placeholder={t("auth.emailPlaceholder")} required />
            <PasswordInput
              label={t("auth.passwordLabel")}
              name="password"
              placeholder={t("auth.passwordPlaceholder")}
              showPasswordLabel={t("common.showPassword")}
              hidePasswordLabel={t("common.hidePassword")}
              required
            />
            {error && (
              <Text tone="danger" size="sm">
                {error}
              </Text>
            )}
            <Button type="submit" fullWidth disabled={submitting}>
              {t("auth.logIn")}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
