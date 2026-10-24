"use client";

import { webFunctions } from "@/lib/firebase-client";
import { PASSENGER_APP_SCHEME } from "@/lib/paypal-return";
import { authorizePaypal } from "@the-ride/firebase/client";
import { useAuth } from "@the-ride/hooks";
import { Button, ErrorState, LoadingState, StatusScreen, useTranslation, Icon } from "@the-ride/ui";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef, useState } from "react";

/**
 * Where PayPal sends the passenger after they approve (docs/payments.md).
 * - Booked on the web: authorizes the hold via `authorizePaypalOrder`
 *   (which also starts the driver search), then goes to /rides.
 * - Booked in the passenger app (`source=app`): hands straight back to the
 *   app's `paypal/return` route, which does the authorization itself — the
 *   browser has no signed-in session for an app user.
 */
function PaypalReturnContent() {
  const { t } = useTranslation();
  const router = useRouter();
  const params = useSearchParams();
  const { status: authStatus } = useAuth();
  const requestId = params.get("requestId");
  const source = params.get("source");
  const [state, setState] = useState<"authorizing" | "authorized" | "failed">("authorizing");
  const started = useRef(false);

  const appUrl = requestId
    ? `${PASSENGER_APP_SCHEME}://paypal/return?requestId=${encodeURIComponent(requestId)}`
    : null;

  useEffect(() => {
    if (source === "app" && appUrl) {
      window.location.replace(appUrl);
    }
  }, [source, appUrl]);

  useEffect(() => {
    if (source === "app" || authStatus === "loading" || started.current) return;
    if (!requestId || authStatus === "unauthenticated") {
      setState("failed");
      return;
    }
    started.current = true;
    authorizePaypal(webFunctions, requestId)
      .then(() => {
        setState("authorized");
        setTimeout(() => router.replace("/rides"), 1500);
      })
      .catch(() => setState("failed"));
  }, [source, authStatus, requestId, router]);

  if (source === "app") {
    return (
      <StatusScreen
        icon={<Icon name="arrowRight" size={28} className="text-brand" />}
        title={t("payments.authorizingTitle")}
        action={
          appUrl ? (
            <Button onClick={() => window.location.assign(appUrl)}>
              {t("payments.returnToApp")}
            </Button>
          ) : undefined
        }
      />
    );
  }

  if (state === "authorizing") {
    return <LoadingState title={t("payments.authorizingTitle")} />;
  }

  if (state === "failed") {
    return (
      <ErrorState
        title={t("payments.failedTitle")}
        description={t("payments.failedBody")}
        action={
          <Button onClick={() => router.replace("/book")}>{t("payments.backToBooking")}</Button>
        }
      />
    );
  }

  return (
    <StatusScreen
      icon={<Icon name="checkCircle" size={28} className="text-success" />}
      title={t("payments.authorizedTitle")}
      description={t("payments.authorizedBody")}
      action={<Button onClick={() => router.replace("/rides")}>{t("payments.viewMyRides")}</Button>}
    />
  );
}

export default function PaypalReturnPage() {
  return (
    <div className="mx-auto flex min-h-[60vh] w-full max-w-md flex-col justify-center px-4 py-10">
      <Suspense fallback={null}>
        <PaypalReturnContent />
      </Suspense>
    </div>
  );
}
