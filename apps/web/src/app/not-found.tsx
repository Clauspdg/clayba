"use client";

import { Button, EmptyState, Illustration, useTranslation } from "@the-ride/ui";
import Link from "next/link";

export default function NotFound() {
  const { t } = useTranslation();

  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <EmptyState
        icon={<Illustration name="empty" size={120} />}
        title={t("website.notFound.title")}
        description={t("website.notFound.body")}
        action={
          <Button asChild className="mt-2">
            <Link href="/">{t("website.notFound.cta")}</Link>
          </Button>
        }
      />
    </div>
  );
}
