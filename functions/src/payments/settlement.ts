import { HttpsError } from "firebase-functions/v2/https";
import { defineSecret, defineString } from "firebase-functions/params";
import * as logger from "firebase-functions/logger";
import type { Repositories } from "@the-ride/firebase/firestore";
import {
  DEFAULT_PLATFORM_SETTINGS,
  PaymentMethodType,
  PaymentStatus,
  TransactionType,
  WalletOwnerType,
  type Payment,
  type Trip,
} from "@the-ride/types";
import { computeTripSettlement, paypalCaptureAmount } from "@the-ride/utils";

import { PaypalClient, type PaypalEnvironment } from "./paypal";

/**
 * PayPal credentials live in Secret Manager (`firebase functions:secrets:set
 * PAYPAL_CLIENT_ID` / `PAYPAL_CLIENT_SECRET`), never in a committed `.env`.
 * Any function that talks to PayPal must list `PAYPAL_SECRETS` in its
 * options. See docs/payments.md for setup.
 */
export const PAYPAL_CLIENT_ID = defineSecret("PAYPAL_CLIENT_ID");
export const PAYPAL_CLIENT_SECRET = defineSecret("PAYPAL_CLIENT_SECRET");
export const PAYPAL_SECRETS = [PAYPAL_CLIENT_ID, PAYPAL_CLIENT_SECRET];
export const PAYPAL_ENV = defineString("PAYPAL_ENV", { default: "sandbox" });
/** Public web app origin PayPal sends the passenger back to (`/payment/paypal/return`). */
export const WEB_APP_URL = defineString("WEB_APP_URL", { default: "http://localhost:3000" });

let cachedClient: PaypalClient | null = null;

/** Throws `failed-precondition` rather than calling PayPal with placeholder credentials. */
export function getPaypalClient(): PaypalClient {
  if (cachedClient) return cachedClient;
  const clientId = PAYPAL_CLIENT_ID.value();
  const clientSecret = PAYPAL_CLIENT_SECRET.value();
  if (!clientId || !clientSecret || clientId === "unset" || clientSecret === "unset") {
    throw new HttpsError("failed-precondition", "PayPal is not configured yet.");
  }
  const environment: PaypalEnvironment = PAYPAL_ENV.value() === "live" ? "live" : "sandbox";
  cachedClient = new PaypalClient({ clientId, clientSecret, environment });
  return cachedClient;
}

export interface SettlementSummary {
  paymentMethod: PaymentMethodType;
  paymentStatus: PaymentStatus;
  total: number;
  currency: string;
  /** Cash only — what the driver collects from the passenger. */
  cashToCollect: number;
  driverEarnings: number;
}

/**
 * Settles a just-completed ride (docs/payments.md):
 * - cash: records the payment as collected by the driver and debits the
 *   driver's wallet the platform's share (commission + fees);
 * - PayPal: captures the held authorization for the final fare (within
 *   PayPal's over-capture ceiling) and credits the driver their earnings.
 * Idempotent: the payment doc is keyed by trip request and the ledger
 * entry by trip, so a retry never charges or credits twice. Never throws —
 * a settlement problem must not undo a completed ride; it's recorded on
 * the payment (`failed`) for staff instead.
 */
export async function settleCompletedTrip(
  repos: Repositories,
  trip: Trip,
): Promise<SettlementSummary | null> {
  // Same fallback `completeWithFare` uses: no recomputed final fare means
  // the passenger is charged the pre-trip estimate.
  const fare =
    trip.finalFareBreakdown ??
    (trip.tripRequestId
      ? (await repos.tripRequests.findById(trip.tripRequestId))?.fareEstimate
      : undefined);
  if (!fare || !trip.driverId) {
    logger.error("settleCompletedTrip: trip has no final fare or driver — not settled", {
      tripId: trip.id,
    });
    return null;
  }

  const method =
    trip.paymentMethod === PaymentMethodType.PAYPAL
      ? PaymentMethodType.PAYPAL
      : PaymentMethodType.CASH;
  const paymentId = trip.tripRequestId ?? trip.id;
  const settlement = computeTripSettlement(method, fare);
  const now = new Date();
  const summary = (paymentStatus: PaymentStatus): SettlementSummary => ({
    paymentMethod: method,
    paymentStatus,
    total: settlement.total,
    currency: fare.currency,
    cashToCollect: settlement.cashToCollect,
    driverEarnings: settlement.driverEarnings,
  });

  try {
    const existing = await repos.payments.findById(paymentId);
    if (existing?.settledAt) {
      return summary(existing.status);
    }

    if (method === PaymentMethodType.PAYPAL) {
      if (
        !existing ||
        existing.status !== PaymentStatus.AUTHORIZED ||
        !existing.paypalAuthorizationId
      ) {
        await upsertPayment(repos, paymentId, existing, {
          tripId: trip.id,
          driverId: trip.driverId,
          payerId: trip.passengerId,
          amount: settlement.total,
          currency: fare.currency,
          method,
          status: PaymentStatus.FAILED,
          failureReason: "no_authorization_to_capture",
        });
        logger.error("settleCompletedTrip: PayPal ride has no open authorization", {
          tripId: trip.id,
          paymentId,
        });
        return summary(PaymentStatus.FAILED);
      }

      const { amount, shortfall } = paypalCaptureAmount(
        settlement.total,
        existing.authorizedAmount ?? 0,
      );
      try {
        const capture = await getPaypalClient().captureAuthorization({
          authorizationId: existing.paypalAuthorizationId,
          amount,
          currency: fare.currency,
          invoiceId: trip.id,
        });
        await repos.payments.update(paymentId, {
          tripId: trip.id,
          driverId: trip.driverId,
          amount: settlement.total,
          capturedAmount: amount,
          paypalCaptureId: capture.id,
          commissionAmount: fare.commission,
          status: PaymentStatus.CAPTURED,
          ...(shortfall > 0 ? { failureReason: `capture_shortfall:${shortfall}` } : {}),
          updatedAt: now,
        });
        if (shortfall > 0) {
          logger.warn("PayPal capture hit the over-capture ceiling — shortfall not collected", {
            tripId: trip.id,
            shortfall,
          });
        }
      } catch (error) {
        await repos.payments.update(paymentId, {
          tripId: trip.id,
          driverId: trip.driverId,
          status: PaymentStatus.FAILED,
          failureReason: error instanceof Error ? error.message : "capture_failed",
          updatedAt: now,
        });
        logger.error("PayPal capture failed — driver not credited", { tripId: trip.id, error });
        return summary(PaymentStatus.FAILED);
      }
    } else {
      await upsertPayment(repos, paymentId, existing, {
        tripId: trip.id,
        driverId: trip.driverId,
        payerId: trip.passengerId,
        amount: settlement.total,
        currency: fare.currency,
        method,
        // Collected in hand by the driver — there's nothing left to capture.
        status: PaymentStatus.CAPTURED,
        commissionAmount: fare.commission,
      });
    }

    await repos.wallets.applyLedgerEntry({
      ownerId: trip.driverId,
      ownerType: WalletOwnerType.DRIVER,
      amount: settlement.driverWalletDelta,
      type:
        method === PaymentMethodType.PAYPAL ? TransactionType.CREDIT : TransactionType.COMMISSION,
      currency: fare.currency,
      idempotencyKey: `trip_${trip.id}_settlement`,
      referenceId: trip.id,
      description:
        method === PaymentMethodType.PAYPAL
          ? "PayPal ride earnings"
          : "Platform share of a cash ride",
    });

    const settings = await repos.settings.getGlobal();
    await repos.commissions.create(trip.id, {
      id: trip.id,
      tripId: trip.id,
      driverId: trip.driverId,
      rate: settings?.commissionRate ?? DEFAULT_PLATFORM_SETTINGS.commissionRate,
      amount: fare.commission,
      currency: fare.currency,
      createdAt: now,
    });

    await repos.payments.update(paymentId, { settledAt: now, updatedAt: now });
    logger.info("Trip settled", {
      tripId: trip.id,
      method,
      driverWalletDelta: settlement.driverWalletDelta,
    });
    return summary(PaymentStatus.CAPTURED);
  } catch (error) {
    logger.error("settleCompletedTrip failed", { tripId: trip.id, error });
    return null;
  }
}

async function upsertPayment(
  repos: Repositories,
  paymentId: string,
  existing: Payment | null,
  fields: Omit<Payment, "id" | "createdAt" | "updatedAt" | "tripRequestId">,
): Promise<void> {
  const now = new Date();
  if (existing) {
    await repos.payments.update(paymentId, { ...stripUndefined(fields), updatedAt: now });
    return;
  }
  await repos.payments.create(paymentId, {
    ...(stripUndefined(fields) as typeof fields),
    id: paymentId,
    ...(paymentId !== fields.tripId ? { tripRequestId: paymentId } : {}),
    createdAt: now,
    updatedAt: now,
  });
}

function stripUndefined<T extends object>(value: T): Partial<T> {
  return Object.fromEntries(Object.entries(value).filter(([, v]) => v !== undefined)) as Partial<T>;
}

/**
 * Releases a booking's PayPal hold — ride cancelled, expired, or never
 * matched. Safe to call more than once and for cash bookings (no-op). A
 * `pending` payment (passenger never finished approving on PayPal) has no
 * hold to release; it's just closed out.
 */
export async function voidOpenAuthorization(
  repos: Repositories,
  tripRequestId: string,
  reason: string,
): Promise<void> {
  const payment = await repos.payments.findById(tripRequestId);
  if (!payment || payment.method !== PaymentMethodType.PAYPAL) return;
  if (payment.status !== PaymentStatus.AUTHORIZED && payment.status !== PaymentStatus.PENDING)
    return;

  if (payment.status === PaymentStatus.AUTHORIZED && payment.paypalAuthorizationId) {
    await getPaypalClient().voidAuthorization(payment.paypalAuthorizationId);
  }
  await repos.payments.update(tripRequestId, {
    status: PaymentStatus.VOIDED,
    failureReason: reason,
    updatedAt: new Date(),
  });
  logger.info("PayPal authorization voided", { tripRequestId, reason });
}
