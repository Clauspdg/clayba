"use client";

import {
  Button,
  Heading,
  Icon,
  Input,
  Logo,
  PasswordInput,
  Text,
  useTranslation,
} from "@the-ride/ui";
import { useAuth } from "@the-ride/hooks";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";

const SOCIAL_PROVIDERS = [
  { id: "google", label: "Google" },
  { id: "apple", label: "Apple" },
  { id: "facebook", label: "Facebook" },
] as const;

export default function LoginPage() {
  const { t } = useTranslation();
  const { status, error, signIn } = useAuth();
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (status === "authenticated") {
      router.replace("/dashboard");
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
      // `error` from useAuth() already carries the message; the form re-renders with it below.
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="laptop:grid-cols-2 grid min-h-[calc(100vh-8rem)]">
      <div className="laptop:flex relative hidden flex-col justify-between overflow-hidden bg-neutral-900 p-12 text-white">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_rgba(232,106,47,0.35),_transparent_55%)]" />
        <div className="bg-brand/30 absolute -bottom-24 -right-24 h-80 w-80 rounded-full blur-[110px]" />
        <Logo withWordmark className="relative text-white" />
        <div className="relative flex flex-col gap-3">
          <Heading level={2} className="text-white">
            {t("auth.loginHeroTitle")}
          </Heading>
          <Text className="max-w-sm text-neutral-300">{t("auth.loginHeroBody")}</Text>
        </div>
      </div>

      <div className="flex items-center justify-center bg-neutral-50 px-6 py-16 dark:bg-neutral-950">
        <div className="animate-slide-up w-full max-w-sm">
          <div className="mb-8">
            <Heading level={2}>{t("auth.loginTitle")}</Heading>
            <Text tone="muted" size="sm">
              {t("auth.loginSubtitle")}
            </Text>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <Input
              label={t("auth.emailLabel")}
              name="email"
              type="email"
              placeholder={t("auth.emailPlaceholder")}
              required
            />
            <PasswordInput
              label={t("auth.passwordLabel")}
              name="password"
              placeholder={t("auth.passwordPlaceholder")}
              showPasswordLabel={t("common.showPassword")}
              hidePasswordLabel={t("common.hidePassword")}
              required
            />
            <div className="text-right">
              <Link href="/forgot-password" className="text-brand text-sm hover:underline">
                {t("auth.forgotPasswordTitle")}
              </Link>
            </div>
            {error && (
              <Text tone="danger" size="sm">
                {error}
              </Text>
            )}
            <Button type="submit" fullWidth isLoading={submitting}>
              {t("auth.logIn")}
            </Button>
          </form>

          <div className="my-6 flex items-center gap-3">
            <div className="h-px flex-1 bg-neutral-200 dark:bg-neutral-800" />
            <span className="text-xs uppercase tracking-wide text-neutral-400">
              {t("auth.orContinueWith")}
            </span>
            <div className="h-px flex-1 bg-neutral-200 dark:bg-neutral-800" />
          </div>

          <div className="grid grid-cols-3 gap-3">
            {SOCIAL_PROVIDERS.map((provider) => (
              <button
                key={provider.id}
                type="button"
                disabled
                title={t("auth.socialComingSoon")}
                aria-label={provider.label}
                className="flex h-11 cursor-not-allowed items-center justify-center rounded-lg border border-neutral-200 text-neutral-400 opacity-60 dark:border-neutral-700"
              >
                <Icon name="globe" size={18} />
              </button>
            ))}
          </div>

          <Text size="sm" tone="muted" className="mt-6 text-center">
            {t("auth.noAccount")}{" "}
            <Link href="/register" className="text-brand font-medium hover:underline">
              {t("auth.signUp")}
            </Link>
          </Text>
        </div>
      </div>
    </div>
  );
}
