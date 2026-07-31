"use client";

import type { ThemeMode } from "@the-ride/hooks";
import type { ReactNode } from "react";

import { ToastProvider } from "../components/toast/ToastProvider";
import { TooltipProvider } from "../components/tooltip/Tooltip";
import { useTranslation } from "../i18n/RideI18nProvider";
import { RideI18nProvider } from "../i18n/RideI18nProvider";
import { RideThemeProvider } from "../theme/RideThemeProvider";

function ToastProviderWithTranslatedCloseLabel({ children }: { children: ReactNode }) {
  const { t } = useTranslation();
  return <ToastProvider closeLabel={t("common.close")}>{children}</ToastProvider>;
}

export interface RideProvidersProps {
  children: ReactNode;
  defaultThemeMode?: ThemeMode;
}

/**
 * The full provider stack every web app (apps/web, apps/admin) wraps its
 * root layout in: theme -> i18n -> toast queue -> tooltip. One composition
 * shared by both apps instead of duplicating the nesting order twice — see
 * docs/ui-architecture.md.
 */
export function RideProviders({ children, defaultThemeMode = "system" }: RideProvidersProps) {
  return (
    <RideThemeProvider defaultMode={defaultThemeMode}>
      <RideI18nProvider>
        <ToastProviderWithTranslatedCloseLabel>
          <TooltipProvider>{children}</TooltipProvider>
        </ToastProviderWithTranslatedCloseLabel>
      </RideI18nProvider>
    </RideThemeProvider>
  );
}
