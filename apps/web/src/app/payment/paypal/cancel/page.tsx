"use client";

import { webFirestore } from "@/lib/firebase-client";
import { PASSENGER_APP_SCHEME } from "@/lib/paypal-return";
import { cancelTripRequest } from "@the-ride/firebase/client";
import { useAuth } from "@the-ride/hooks";
import { Button, Icon, StatusScreen, useTranslation } from "@the-ride/ui";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef } from "react";

/**
 * Where PayPal sends a passenger who backed out. Nothing was held, so the
 * waiting `confirmed` booking is just cancelled (an app booking is handed
 * back to the app, which cancels it itself). The scheduled
 * `voidStaleAuthorizations` sweep is the backstop if this page never loads.
 */
function PaypalCancelContent() {
  const { t } = useTranslation();
  const router = useRouter();
  const params = useSearchParams();
  const { status: authStatus } = useAuth();
  const requestId = params.get("requestId");
  const source = params.get("source");
  const done = useRef(false);

  const appUrl = requestId
    ? `${PASSENGER_APP_SCHEME}://paypal/cancel?requestId=${encodeURIComponent(requestId)}`
    : null;

  useEffect(() => {
    if (source === "app" && appUrl) {
      window.location.replace(appUrl);
      return;
    }
    if (authStatus !== "authenticated" || !requestId || done.current) return;
    done.current = true;
    void cancelTripRequest(webFirestore, requestId).catch(() => undefined);
  }, [source, appUrl, authStatus, requestId]);

  return (
    <StatusScreen
      icon={<Icon name="xCircle" size={28} className="text-neutral-400" />}
      title={t("payments.cancelledTitle")}
      description={t("payments.cancelledBody")}
      action={
        source === "app" && appUrl ? (
          <Button onClick={() => window.location.assign(appUrl)}>
            {t("payments.returnToApp")}
          </Button>
        ) : (
          <Button onClick={() => router.replace("/book")}>{t("payments.backToBooking")}</Button>
        )
      }
    />
  );
}

export default function PaypalCancelPage() {
  return (
    <div className="mx-auto flex min-h-[60vh] w-full max-w-md flex-col justify-center px-4 py-10">
      <Suspense fallback={null}>
        <PaypalCancelContent />
      </Suspense>
    </div>
  );
}
