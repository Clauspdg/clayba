import { getMessaging, getToken, isSupported, type Messaging } from "firebase/messaging";

import { getClientApp } from "./app";

let cachedMessaging: Messaging | null | undefined;

/**
 * Web-only (Sprint 5, Part 1) — `firebase/messaging`'s web push requires a
 * service worker and browser Notification API; it does not run in React
 * Native. `apps/web`/`apps/admin` can call this for browser push.
 *
 * `apps/driver-app`/`apps/passenger-app` need a *different* mechanism
 * entirely (`expo-notifications`, which can route through FCM/APNs under
 * the hood) — deliberately not built this sprint, consistent with every
 * prior sprint's explicit "no push notifications" scope boundary (Sprints
 * 3-4). This function exists so the web path is genuinely connected, per
 * Part 1; native push remains prepare-only / future work.
 */
export async function getClientMessaging(): Promise<Messaging | null> {
  if (cachedMessaging !== undefined) return cachedMessaging;
  cachedMessaging = (await isSupported()) ? getMessaging(getClientApp()) : null;
  return cachedMessaging;
}

/** Requests a browser push token — the caller must have already asked the user for Notification permission. Returns `null` if messaging isn't supported in this environment or no `vapidKey` is configured. */
export async function getWebPushToken(vapidKey: string | undefined): Promise<string | null> {
  if (!vapidKey) return null;
  const messaging = await getClientMessaging();
  if (!messaging) return null;
  return getToken(messaging, { vapidKey });
}
