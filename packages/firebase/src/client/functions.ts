import { getFunctions, type Functions } from "firebase/functions";

import { getClientApp } from "./app";

let cachedFunctions: Functions | undefined;

/**
 * Client-side Cloud Functions access (DRIVER-E2E-07) — for `onCall`
 * callables a signed-in user invokes directly, same pairing rationale as
 * `getClientFirestore()`: `firestore.rules` intentionally forbids a driver
 * from writing `rideOffers` directly ("accept/decline transitions go
 * through DispatchService server-side only"), so responding to an offer
 * has to go through a callable instead of a rules-authorized client write.
 */
export function getClientFunctions(): Functions {
  if (!cachedFunctions) {
    cachedFunctions = getFunctions(getClientApp());
  }
  return cachedFunctions;
}
