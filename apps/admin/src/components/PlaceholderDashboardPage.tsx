"use client";

import { Card, CardContent, CardHeader, CardTitle, Heading, useTranslation } from "@the-ride/ui";

export interface PlaceholderDashboardPageProps {
  title: string;
}

/** Shared "title + 3 placeholder cards" layout for every dashboard domain page — see docs/design-system.md. */
export function PlaceholderDashboardPage({ title }: PlaceholderDashboardPageProps) {
  const { t } = useTranslation();
  const cardTitles = [t("admin.placeholderCard.overview"), t("admin.placeholderCard.recentActivity"), t("admin.placeholderCard.quickActions")];

  return (
    <div className="flex flex-col gap-6">
      <Heading level={2}>{title}</Heading>
      <div className="grid gap-4 tablet:grid-cols-2 laptop:grid-cols-3">
        {cardTitles.map((cardTitle) => (
          <Card key={cardTitle}>
            <CardHeader>
              <CardTitle>{cardTitle}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-neutral-500 dark:text-neutral-400">{t("admin.placeholderCard.comingSoon")}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
