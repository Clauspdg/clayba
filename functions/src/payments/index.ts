import { randomUUID } from "node:crypto";

import { onDocumentUpdated } from "firebase-functions/v2/firestore";
import { onCall, HttpsError } from "firebase-functions/v2/https";
import { onSchedule } from "firebase-functions/v2/scheduler";
import * as logger from "firebase-functions/logger";
import { initializeAdminApp, getAdminFirestore } from "@the-ride/firebase/admin";
import { createRepositories, type Repositories } from "@the-ride/firebase/firestore";
import {
  PaymentMethodType,
  PaymentStatus,
  TransactionType,
  TripRequestStatus,
  TripStatus,
  WalletOwnerType,
  type Role,
  type TripRequest,
} from "@the-ride/types";
import {
  calculateFare,
  estimateEtaSeconds,
  haversineDistanceMeters,
  paypalAuthorizationAmount,
} from "@the-ride/utils";

import { runDispatch } from "../trips/dispatch-runner";
import { PAYPAL_SECRETS, WEB_APP_URL, getPaypalClient, voidOpenAuthorization } from "./settlement";

initializeAdminApp();

/** Never authorize less than the fare over the straight-line distance — the client's own estimate isn't trusted below that. */
async function serverAuthorizationAmount(
  repos: Repositories,
  request: TripRequest,
): Promise<number> {
  const [category, settings] = await Promise.all([
    request.vehicleCategoryId ? repos.vehicleCategories.findById(request.vehicleCategoryId) : null,
    repos.settings.getGlobal(),
  ]);
  if (!category || !settings) {
    throw new HttpsError("failed-precondition", "Pricing for this ride could not be resolved.");
  }
  const straightLineMeters = haversineDistanceMeters(request.pickup, request.dropoff);
  const floor = calculateFare({
    distanceMeters: straightLineMeters,
    durationSeconds: estimateEtaSeconds(straightLineMeters),
    category: {
      baseFare: category.baseFare,
      perKmRate: category.perKmRate,
      perMinuteRate: category.perMinuteRate,
      minimumFare: category.minimumFare,
    },
    settings: {
      bookingFee: settings.bookingFee,
      serviceFeeRate: settings.serviceFeeRate,
      commissionRate: settings.commissionRate,
      taxRate: settings.taxRate,
      surgeMultiplier: settings.surgeMultiplierDefault,
      currency: settings.currency,
    },
  });
  return paypalAuthorizationAmount(request.fareEstimate?.total, floor.total);
}

async function requireOwnPaypalRequest(
  repos: Repositories,
  uid: string,
  tripRequestId: string | undefined,
) {
  if (!tripRequestId) {
    throw new HttpsError("invalid-argument", "tripRequestId is required.");
  }
  const request = await repos.tripRequests.findById(tripRequestId);
  if (!request) {
    throw new HttpsError("not-found", "This booking no longer exists.");
  }
  if (request.passengerId !== uid) {
    throw new HttpsError("permission-denied", "This isn't your booking.");
  }
  if (request.paymentMethod !== PaymentMethodType.PAYPAL) {
    throw new HttpsError("failed-precondition", "This booking isn't paid with PayPal.");
  }
  return request;
}

interface CreatePaypalOrderData {
  tripRequestId: string;
  /** Where the passenger booked from — decides where PayPal's return page sends them next. */
  source?: "web" | "app";
}

/**
 * Step 1 of a PayPal booking: creates an AUTHORIZE order for a request
 * still at `confirmed` and returns PayPal's approval URL. The amount is
 * computed here, never taken from the client.
 */
export const createPaypalOrder = onCall<CreatePaypalOrderData>(
  { secrets: PAYPAL_SECRETS },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError("unauthenticated", "Sign in required.");
    }
    const repos = createRepositories(getAdminFirestore());
    const tripRequest = await requireOwnPaypalRequest(
      repos,
      request.auth.uid,
      request.data?.tripRequestId,
    );
    if (tripRequest.status !== TripRequestStatus.CONFIRMED) {
      throw new HttpsError("failed-precondition", "This booking is no longer awaiting payment.");
    }

    const amount = await serverAuthorizationAmount(repos, tripRequest);
    const currency = tripRequest.fareEstimate?.currency ?? "USD";
    const source = request.data?.source === "app" ? "app" : "web";
    const query = `requestId=${encodeURIComponent(tripRequest.id)}&source=${source}`;
    const baseUrl = WEB_APP_URL.value().replace(/\/$/, "");

    const { orderId, approveUrl } = await getPaypalClient().createAuthorizeOrder({
      referenceId: tripRequest.id,
      amount,
      currency,
      description: "CLAYBA ride",
      returnUrl: `${baseUrl}/payment/paypal/return?${query}`,
      cancelUrl: `${baseUrl}/payment/paypal/cancel?${query}`,
    });

    const now = new Date();
    const existing = await repos.payments.findById(tripRequest.id);
    if (existing) {
      await repos.payments.update(tripRequest.id, {
        paypalOrderId: orderId,
        authorizedAmount: amount,
        updatedAt: now,
      });
    } else {
      await repos.payments.create(tripRequest.id, {
        id: tripRequest.id,
        tripRequestId: tripRequest.id,
        payerId: tripRequest.passengerId,
        amount,
        authorizedAmount: amount,
        currency,
        method: PaymentMethodType.PAYPAL,
        status: PaymentStatus.PENDING,
        paypalOrderId: orderId,
        createdAt: now,
        updatedAt: now,
      });
    }
    logger.info("PayPal order created", { tripRequestId: tripRequest.id, orderId, amount });
    return { orderId, approveUrl };
  },
);

interface AuthorizePaypalOrderData {
  tripRequestId: string;
}

/**
 * Step 2, called from the return page once the passenger approved on
 * PayPal: places the hold, then releases the request into dispatch.
 * Idempotent — calling it again after success just reports success.
 */
export const authorizePaypalOrder = onCall<AuthorizePaypalOrderData>(
  { secrets: PAYPAL_SECRETS },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError("unauthenticated", "Sign in required.");
    }
    const repos = createRepositories(getAdminFirestore());
    const tripRequest = await requireOwnPaypalRequest(
      repos,
      request.auth.uid,
      request.data?.tripRequestId,
    );
    const payment = await repos.payments.findById(tripRequest.id);
    if (!payment?.paypalOrderId) {
      throw new HttpsError("failed-precondition", "No PayPal order was started for this booking.");
    }

    if (payment.status === PaymentStatus.AUTHORIZED) {
      return { status: payment.status, tripRequestStatus: tripRequest.status };
    }
    if (payment.status !== PaymentStatus.PENDING) {
      throw new HttpsError("failed-precondition", "This payment can no longer be authorized.");
    }

    const authorization = await getPaypalClient().authorizeOrder(payment.paypalOrderId);
    const now = new Date();
    if (authorization.status !== "CREATED" && authorization.status !== "PENDING") {
      await repos.payments.update(tripRequest.id, {
        status: PaymentStatus.FAILED,
        failureReason: `authorization_${authorization.status.toLowerCase()}`,
        updatedAt: now,
      });
      if (tripRequest.status === TripRequestStatus.CONFIRMED) {
        await repos.tripRequests.cancel(tripRequest.id, "payment_declined");
      }
      throw new HttpsError("failed-precondition", "PayPal declined this payment.");
    }

    await repos.payments.update(tripRequest.id, {
      status: PaymentStatus.AUTHORIZED,
      paypalAuthorizationId: authorization.id,
      authorizedAmount: authorization.amount,
      updatedAt: now,
    });

    // The passenger may have cancelled while on PayPal's page — release
    // the brand-new hold instead of dispatching a dead booking.
    if (tripRequest.status !== TripRequestStatus.CONFIRMED) {
      await voidOpenAuthorization(repos, tripRequest.id, "booking_no_longer_active");
      throw new HttpsError("failed-precondition", "This booking was cancelled.");
    }

    const released = await repos.tripRequests.releaseAfterPaymentAuthorized(tripRequest.id);
    logger.info("PayPal authorized — dispatching", {
      tripRequestId: tripRequest.id,
      authorizationId: authorization.id,
    });
    await runDispatch(repos, tripRequest.id);
    return { status: PaymentStatus.AUTHORIZED, tripRequestStatus: released.status };
  },
);

const TERMINAL_REQUEST_STATUSES: string[] = [
  TripRequestStatus.CANCELLED,
  TripRequestStatus.EXPIRED,
];

/** Booking cancelled or expired → release its PayPal hold. */
export const onTripRequestUpdatedForPayments = onDocumentUpdated(
  { document: "tripRequests/{requestId}", secrets: PAYPAL_SECRETS },
  async (event) => {
    const before = event.data?.before.data();
    const after = event.data?.after.data();
    if (!before || !after || before.status === after.status) return;
    if (
      after.paymentMethod !== PaymentMethodType.PAYPAL ||
      !TERMINAL_REQUEST_STATUSES.includes(after.status)
    )
      return;

    try {
      await voidOpenAuthorization(
        createRepositories(getAdminFirestore()),
        event.params.requestId,
        `request_${after.status}`,
      );
    } catch (error) {
      logger.error("Failed to void PayPal authorization for ended request", {
        requestId: event.params.requestId,
        error,
      });
    }
  },
);

/** Ride cancelled after matching → release its PayPal hold. */
export const onTripUpdatedForPayments = onDocumentUpdated(
  { document: "trips/{tripId}", secrets: PAYPAL_SECRETS },
  async (event) => {
    const before = event.data?.before.data();
    const after = event.data?.after.data();
    if (!before || !after || before.status === after.status) return;
    if (
      after.status !== TripStatus.CANCELLED ||
      after.paymentMethod !== PaymentMethodType.PAYPAL ||
      !after.tripRequestId
    ) {
      return;
    }

    try {
      await voidOpenAuthorization(
        createRepositories(getAdminFirestore()),
        after.tripRequestId,
        "trip_cancelled",
      );
    } catch (error) {
      logger.error("Failed to void PayPal authorization for cancelled trip", {
        tripId: event.params.tripId,
        error,
      });
    }
  },
);

/** How long past `expiresAt` a still-searching request is left before its hold is released. */
const STALE_GRACE_MS = 5 * 60 * 1000;

/**
 * Safety net for holds no trigger releases: a request whose search ran out
 * of drivers stays at `searching_driver` until its `expiresAt` passes (the
 * apps treat it as inactive from then on — nothing writes `expired`), and
 * a passenger who abandoned PayPal's page leaves a `confirmed` request
 * with a `pending` payment behind.
 */
export const voidStaleAuthorizations = onSchedule(
  { schedule: "every 15 minutes", secrets: PAYPAL_SECRETS },
  async () => {
    const repos = createRepositories(getAdminFirestore());
    const open = [
      ...(await repos.payments.findWhere("status", "==", PaymentStatus.AUTHORIZED)),
      ...(await repos.payments.findWhere("status", "==", PaymentStatus.PENDING)),
    ].filter((p) => p.method === PaymentMethodType.PAYPAL && p.tripRequestId && !p.tripId);

    const cutoff = Date.now() - STALE_GRACE_MS;
    for (const payment of open) {
      try {
        const request = await repos.tripRequests.findById(payment.tripRequestId!);
        const expired = !request?.expiresAt || request.expiresAt.getTime() < cutoff;
        const stillWaiting =
          request?.status === TripRequestStatus.CONFIRMED ||
          request?.status === TripRequestStatus.SEARCHING_DRIVER;
        if (
          request &&
          (!expired || !stillWaiting) &&
          !TERMINAL_REQUEST_STATUSES.includes(request.status)
        )
          continue;

        await voidOpenAuthorization(repos, payment.id, "request_stale");
        if (request?.status === TripRequestStatus.SEARCHING_DRIVER) {
          await repos.tripRequests.expire(request.id);
        } else if (request?.status === TripRequestStatus.CONFIRMED) {
          await repos.tripRequests.cancel(request.id, "payment_not_completed");
        }
      } catch (error) {
        logger.error("voidStaleAuthorizations: failed for payment", {
          paymentId: payment.id,
          error,
        });
      }
    }
  },
);

interface RecordDriverCashDepositData {
  driverId: string;
  amount: number;
  note?: string;
  /** Generated once per form submission by the admin UI — makes a double click a no-op. */
  clientRequestId?: string;
}

/**
 * Admin-only: records money a driver handed over against what they owe
 * from cash rides (or a payout made to them, as a negative amount), as a
 * ledger entry + audit log — wallet balances are never edited directly.
 */
export const recordDriverCashDeposit = onCall<RecordDriverCashDepositData>(async (request) => {
  const role = request.auth?.token.role as string | undefined;
  if (!request.auth || (role !== "admin" && role !== "super_admin")) {
    throw new HttpsError("permission-denied", "Admins only.");
  }
  const { driverId, amount, note, clientRequestId } =
    request.data ?? ({} as RecordDriverCashDepositData);
  if (!driverId || !Number.isFinite(amount) || amount === 0 || Math.abs(amount) > 100_000) {
    throw new HttpsError("invalid-argument", "driverId and a non-zero amount are required.");
  }

  const repos = createRepositories(getAdminFirestore());
  const roundedAmount = Math.round(amount * 100) / 100;
  const settings = await repos.settings.getGlobal();
  const result = await repos.wallets.applyLedgerEntry({
    ownerId: driverId,
    ownerType: WalletOwnerType.DRIVER,
    amount: roundedAmount,
    type: roundedAmount > 0 ? TransactionType.ADJUSTMENT : TransactionType.PAYOUT,
    currency: settings?.currency ?? "USD",
    idempotencyKey: `deposit_${clientRequestId ?? randomUUID()}`,
    description: note?.trim() || (roundedAmount > 0 ? "Cash deposit received" : "Payout to driver"),
  });

  if (result.applied) {
    await repos.auditLogs.record({
      action: "wallet.adjusted",
      actorId: request.auth.uid,
      actorRole: role as Role,
      targetId: driverId,
      targetType: "wallet",
      reason: note,
      metadata: { amount: roundedAmount },
    });
  }
  return { balance: result.balance, applied: result.applied };
});
