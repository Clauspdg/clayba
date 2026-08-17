"use client";

import {
  Button,
  Card,
  CardContent,
  Heading,
  LoadingState,
  Text,
  useTranslation,
} from "@the-ride/ui";
import { useAuth } from "@the-ride/hooks";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

import { isSafeInternalPath } from "@/lib/safe-redirect";

function VerifyEmailContent() {
  const { t } = useTranslation();
  const { session, error, applyActionCode, sendEmailVerification, reloadUser } = useAuth();
  const searchParams = useSearchParams();
  const oobCode = searchParams.get("oobCode");
  // BOOKING-03 — validated so a crafted `?next=https://evil.com` link
  // can't turn this into an open redirect once "Continue" is clicked.
  const rawNext = searchParams.get("next");
  const nextHref = isSafeInternalPath(rawNext) ? rawNext : "/dashboard";

  const [applying, setApplying] = useState(Boolean(oobCode));
  const [applied, setApplied] = useState(false);
  const [resent, setResent] = useState(false);
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    if (!oobCode) return;
    applyActionCode(oobCode)
      .then(() => setApplied(true))
      .catch(() => undefined)
      .finally(() => setApplying(false));
    // Only ever run once per oobCode — re-running on every `applyActionCode` identity change would re-submit the same code.
  }, [oobCode]);

  async function handleResend() {
    setResent(false);
    await sendEmailVerification();
    setResent(true);
  }

  async function handleCheckAgain() {
    setChecking(true);
    try {
      await reloadUser();
    } finally {
      setChecking(false);
    }
  }

  if (applying) {
    return <LoadingState title={t("common.loading")} />;
  }

  const verified = applied || session?.emailVerified;

  return (
    <Card className="w-full max-w-sm">
      <CardContent className="flex flex-col gap-6 p-8 text-center">
        <div>
          <Heading level={2}>
            {verified ? t("auth.verifyEmailTitle") : t("auth.verifyEmailSentTitle")}
          </Heading>
          {!verified && (
            <Text tone="muted" size="sm">
              {t("auth.verifyEmailSentSubtitle", { email: session?.email ?? "" })}
            </Text>
          )}
        </div>

        {verified ? (
          <Text size="sm">{t("auth.verifyEmailConfirmed")}</Text>
        ) : (
          <div className="flex flex-col gap-3">
            {error && (
              <Text tone="danger" size="sm">
                {error}
              </Text>
            )}
            {resent && <Text size="sm">{t("auth.resetLinkSent")}</Text>}
            <Button variant="outline" onClick={() => void handleCheckAgain()} isLoading={checking}>
              {t("auth.checkVerificationStatus")}
            </Button>
            <Button variant="ghost" onClick={() => void handleResend()}>
              {t("auth.resendVerificationEmail")}
            </Button>
          </div>
        )}

        <Text size="sm" tone="muted">
          <Link
            href={verified ? nextHref : "/login"}
            className="text-brand font-medium hover:underline"
          >
            {verified ? t("auth.continueCta") : t("auth.backToLogin")}
          </Link>
        </Text>
      </CardContent>
    </Card>
  );
}

export default function VerifyEmailPage() {
  const { t } = useTranslation();
  return (
    <div className="flex min-h-[calc(100vh-8rem)] items-center justify-center bg-neutral-50 px-6 py-16 dark:bg-neutral-950">
      <Suspense fallback={<LoadingState title={t("common.loading")} />}>
        <VerifyEmailContent />
      </Suspense>
    </div>
  );
}
