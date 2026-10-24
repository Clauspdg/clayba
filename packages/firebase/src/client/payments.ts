import type { PaymentMethodType, PaymentStatus } from "@the-ride/types";
import { httpsCallable, type Functions } from "firebase/functions";

/**
 * Client side of the PayPal booking flow (docs/payments.md). Both steps
 * are trusted callables — `payments` documents are never written by a
 * client (`firestore.rules`):
 * 1. `startPaypalCheckout` — after `createTripRequest(..., paymentMethod: "paypal")`,
 *    returns the PayPal URL to send the passenger to;
 * 2. `authorizePaypal` — from the return page once they approved; holds
 *    the fare and starts the driver search.
 */
export async function startPaypalCheckout(
  functions: Functions,
  tripRequestId: string,
  source: "web" | "app",
): Promise<{ orderId: string; approveUrl: string }> {
  const call = httpsCallable<
    { tripRequestId: string; source: "web" | "app" },
    { orderId: string; approveUrl: string }
  >(functions, "createPaypalOrder");
  const result = await call({ tripRequestId, source });
  return result.data;
}

export async function authorizePaypal(
  functions: Functions,
  tripRequestId: string,
): Promise<{ status: PaymentStatus; tripRequestStatus: string }> {
  const call = httpsCallable<
    { tripRequestId: string },
    { status: PaymentStatus; tripRequestStatus: string }
  >(functions, "authorizePaypalOrder");
  const result = await call({ tripRequestId });
  return result.data;
}

/** Returned by `completeTrip` — what the driver's app shows once the ride ends. */
export interface TripSettlementSummary {
  paymentMethod: PaymentMethodType;
  paymentStatus: PaymentStatus;
  total: number;
  currency: string;
  cashToCollect: number;
  driverEarnings: number;
}

/** Admin only: a cash deposit from a driver (positive) or a payout to them (negative). */
export async function recordDriverCashDeposit(
  functions: Functions,
  input: { driverId: string; amount: number; note?: string; clientRequestId: string },
): Promise<{ balance: number; applied: boolean }> {
  const call = httpsCallable<typeof input, { balance: number; applied: boolean }>(
    functions,
    "recordDriverCashDeposit",
  );
  const result = await call(input);
  return result.data;
}
