"use client";

import { Button, Heading, Input, Text, Textarea, useTranslation } from "@the-ride/ui";
import type { FormEvent } from "react";

export default function ContactPage() {
  const { t } = useTranslation();

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    // UI foundation only this sprint — no submission endpoint yet.
    event.preventDefault();
  }

  return (
    <section className="mx-auto max-w-xl px-6 py-16">
      <Heading level={1} className="mb-2">
        {t("website.contact.title")}
      </Heading>
      <Text size="lg" tone="muted" className="mb-8">
        {t("website.contact.body")}
      </Text>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Input label={t("website.contact.nameLabel")} name="name" required />
        <Input label={t("website.contact.emailLabel")} name="email" type="email" required />
        <Textarea label={t("website.contact.messageLabel")} name="message" required rows={5} />
        <Button type="submit" className="self-start">
          {t("website.contact.send")}
        </Button>
      </form>
    </section>
  );
}
