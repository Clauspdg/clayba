"use client";

import {
  Button,
  Card,
  CardContent,
  Heading,
  Icon,
  Input,
  PasswordInput,
  Progress,
  Text,
  useTranslation,
} from "@the-ride/ui";
import { useAuth } from "@the-ride/hooks";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

type RoleChoice = "passenger" | "driver";

export default function RegisterPage() {
  const { t } = useTranslation();
  const { error, signUp } = useAuth();
  const router = useRouter();
  const [step, setStep] = useState<0 | 1>(0);
  const [role, setRole] = useState<RoleChoice>("passenger");
  const [submitting, setSubmitting] = useState(false);
  const [passwordMismatch, setPasswordMismatch] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const firstName = String(formData.get("firstName") ?? "").trim();
    const lastName = String(formData.get("lastName") ?? "").trim();
    const email = String(formData.get("email") ?? "");
    const password = String(formData.get("password") ?? "");
    const confirmPassword = String(formData.get("confirmPassword") ?? "");

    if (password !== confirmPassword) {
      setPasswordMismatch(true);
      return;
    }
    setPasswordMismatch(false);

    setSubmitting(true);
    try {
      await signUp(email, password, `${firstName} ${lastName}`.trim());
      router.push(role === "driver" ? "/verify-email?next=/become-a-driver" : "/verify-email");
    } catch {
      // `error` from useAuth() already carries the message; the form re-renders with it below.
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-[calc(100vh-8rem)] items-center justify-center bg-neutral-50 px-6 py-16 dark:bg-neutral-950">
      <Card className="animate-slide-up w-full max-w-md">
        <CardContent className="flex flex-col gap-6 p-8">
          <div>
            <Heading level={2}>{t("auth.registerTitle")}</Heading>
            <Text tone="muted" size="sm">
              {t("auth.registerSubtitle")}
            </Text>
          </div>

          <div className="flex flex-col gap-1">
            <Progress
              value={step === 0 ? 50 : 100}
              label={t("auth.registerStepProgress", { current: step + 1, total: 2 })}
            />
            <Text size="xs" tone="muted">
              {t("auth.registerStepProgress", { current: step + 1, total: 2 })}
            </Text>
          </div>

          {step === 0 ? (
            <div className="flex flex-col gap-4">
              <Text size="sm" weight="medium">
                {t("auth.roleSelectorPrompt")}
              </Text>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setRole("passenger")}
                  className={`flex flex-col items-center gap-2 rounded-2xl border-2 p-5 text-center transition-colors ${
                    role === "passenger"
                      ? "border-brand bg-brand-50 dark:bg-brand-900"
                      : "hover:border-brand/50 border-neutral-200 dark:border-neutral-700"
                  }`}
                >
                  <Icon
                    name="users"
                    size={24}
                    className={role === "passenger" ? "text-brand" : "text-neutral-400"}
                  />
                  <span className="font-medium text-neutral-900 dark:text-neutral-50">
                    {t("auth.roleRider")}
                  </span>
                  <span className="text-xs text-neutral-500 dark:text-neutral-400">
                    {t("auth.roleRiderBody")}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setRole("driver")}
                  className={`flex flex-col items-center gap-2 rounded-2xl border-2 p-5 text-center transition-colors ${
                    role === "driver"
                      ? "border-brand bg-brand-50 dark:bg-brand-900"
                      : "hover:border-brand/50 border-neutral-200 dark:border-neutral-700"
                  }`}
                >
                  <Icon
                    name="car"
                    size={24}
                    className={role === "driver" ? "text-brand" : "text-neutral-400"}
                  />
                  <span className="font-medium text-neutral-900 dark:text-neutral-50">
                    {t("auth.roleDriver")}
                  </span>
                  <span className="text-xs text-neutral-500 dark:text-neutral-400">
                    {t("auth.roleDriverBody")}
                  </span>
                </button>
              </div>
              {role === "driver" && (
                <Text size="xs" tone="muted">
                  {t("auth.roleDriverNote")}
                </Text>
              )}
              <Button fullWidth onClick={() => setStep(1)}>
                {t("common.next")}
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label={t("auth.firstNameLabel")}
                  name="firstName"
                  autoCapitalize="words"
                  required
                />
                <Input
                  label={t("auth.lastNameLabel")}
                  name="lastName"
                  autoCapitalize="words"
                  required
                />
              </div>
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
                minLength={8}
                required
              />
              <PasswordInput
                label={t("auth.confirmPasswordLabel")}
                name="confirmPassword"
                showPasswordLabel={t("common.showPassword")}
                hidePasswordLabel={t("common.hidePassword")}
                errorText={passwordMismatch ? t("auth.passwordsDontMatch") : undefined}
                required
              />
              {error && (
                <Text tone="danger" size="sm">
                  {error}
                </Text>
              )}
              <div className="flex gap-3">
                <Button type="button" variant="outline" onClick={() => setStep(0)}>
                  {t("common.back")}
                </Button>
                <Button type="submit" fullWidth isLoading={submitting}>
                  {t("auth.createAccount")}
                </Button>
              </div>
            </form>
          )}

          <Text size="sm" tone="muted" className="text-center">
            {t("auth.alreadyHaveAccount")}{" "}
            <Link href="/login" className="text-brand font-medium hover:underline">
              {t("auth.logIn")}
            </Link>
          </Text>
        </CardContent>
      </Card>
    </div>
  );
}
