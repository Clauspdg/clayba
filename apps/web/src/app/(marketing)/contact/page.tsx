"use client";

import { submitContactForm } from "@the-ride/firebase/client";
import {
  Button,
  Card,
  CardContent,
  Heading,
  Icon,
  Input,
  Text,
  Textarea,
  useToast,
  useTranslation,
} from "@the-ride/ui";
import { useState, type FormEvent } from "react";

import { Hero } from "@/components/marketing/Hero";
import { MapPreview } from "@/components/marketing/MapPreview";
import { webFirestore } from "@/lib/firebase-client";

const SOCIAL_LINKS = [
  { icon: "globe" as const, label: "Website", href: "https://the-ride.app" },
  { icon: "mail" as const, label: "Email", href: "mailto:support@theride.app" },
  { icon: "phone" as const, label: "Phone", href: "tel:+18005550123" },
];

export default function ContactPage() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const [errors, setErrors] = useState<{ name?: string; email?: string; message?: string }>({});

  function validate(name: string, email: string, message: string): boolean {
    const next: typeof errors = {};
    if (!name.trim()) next.name = t("common.required");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) next.email = t("website.contact.invalidEmail");
    if (!message.trim() || message.trim().length < 10)
      next.message = t("website.contact.messageTooShort");
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const name = String(formData.get("name") ?? "").trim();
    const email = String(formData.get("email") ?? "").trim();
    const message = String(formData.get("message") ?? "").trim();

    if (!validate(name, email, message)) return;

    setSubmitting(true);
    try {
      await submitContactForm(webFirestore, { name, email, message });
      setSent(true);
      toast({ variant: "success", title: t("website.contact.sentSuccess") });
    } catch {
      toast({ variant: "danger", title: t("common.error") });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      <Hero>
        <div className="mx-auto max-w-2xl text-center">
          <h1 className="tablet:text-5xl text-4xl font-bold text-white">
            {t("website.contact.title")}
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-lg text-neutral-300">
            {t("website.contact.body")}
          </p>
        </div>
      </Hero>

      <section className="laptop:grid-cols-[1.2fr_0.8fr] mx-auto grid max-w-6xl gap-8 px-6 pb-24 pt-16">
        <Card className="shadow-elevation3">
          <CardContent className="p-8">
            {sent ? (
              <div className="flex flex-col items-center gap-3 py-8 text-center">
                <span className="text-success flex h-14 w-14 items-center justify-center rounded-full bg-green-50 dark:bg-green-950">
                  <Icon name="checkCircle" size={28} />
                </span>
                <Heading level={3}>{t("website.contact.sentSuccess")}</Heading>
                <Text tone="muted">{t("website.contact.sentSuccessBody")}</Text>
              </div>
            ) : (
              <form onSubmit={(e) => void handleSubmit(e)} className="flex flex-col gap-4">
                <Input
                  label={t("website.contact.nameLabel")}
                  name="name"
                  required
                  errorText={errors.name}
                />
                <Input
                  label={t("website.contact.emailLabel")}
                  name="email"
                  type="email"
                  required
                  errorText={errors.email}
                />
                <Textarea
                  label={t("website.contact.messageLabel")}
                  name="message"
                  required
                  rows={6}
                  errorText={errors.message}
                />
                <Button type="submit" isLoading={submitting}>
                  {t("website.contact.send")}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>

        <div className="flex flex-col gap-6">
          <Card>
            <CardContent className="flex flex-col gap-4 p-6">
              <Heading level={4}>{t("website.contact.infoTitle")}</Heading>
              <div className="flex items-start gap-3">
                <Icon name="mapPin" size={18} className="text-brand mt-0.5 shrink-0" />
                <Text size="sm">{t("website.contact.address")}</Text>
              </div>
              <div className="flex items-start gap-3">
                <Icon name="mail" size={18} className="text-brand mt-0.5 shrink-0" />
                <Text size="sm">support@theride.app</Text>
              </div>
              <div className="flex items-start gap-3">
                <Icon name="phone" size={18} className="text-brand mt-0.5 shrink-0" />
                <Text size="sm">+1 (800) 555-0123</Text>
              </div>
              <div className="flex items-start gap-3">
                <Icon name="clock" size={18} className="text-brand mt-0.5 shrink-0" />
                <Text size="sm">{t("website.contact.hours")}</Text>
              </div>
              <div className="mt-2 flex gap-2">
                {SOCIAL_LINKS.map((social) => (
                  <a
                    key={social.label}
                    href={social.href}
                    aria-label={social.label}
                    className="bg-brand-50 text-brand hover:bg-brand dark:bg-brand-900 flex h-10 w-10 items-center justify-center rounded-full transition-colors hover:text-white"
                  >
                    <Icon name={social.icon} size={18} />
                  </a>
                ))}
              </div>
            </CardContent>
          </Card>
          <MapPreview />
        </div>
      </section>
    </div>
  );
}
