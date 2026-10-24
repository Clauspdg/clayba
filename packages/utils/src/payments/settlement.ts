import { PaymentMethodType, type FareBreakdown } from "@the-ride/types";

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

/**
 * What the driver keeps from a fare: the metered ride price minus the
 * platform commission. Booking and service fees are the platform's, never
 * the driver's. The single source for this number — `DispatchService`'s
 * offer `estimatedEarnings` and the completion settlement both call it, so
 * the earnings a driver is shown on the offer are computed the same way as
 * what's actually credited.
 */
export function driverEarningsFromFare(
  fare: Pick<FareBreakdown, "total" | "commission" | "bookingFee" | "serviceFee">,
): number {
  return round2(Math.max(0, fare.total - fare.commission - fare.bookingFee - fare.serviceFee));
}

export interface TripSettlement {
  /** What the passenger pays in total. */
  total: number;
  driverEarnings: number;
  /** Everything that isn't the driver's: commission + booking fee + service fee. */
  platformShare: number;
  /**
   * Signed change to the driver's wallet. Cash: the driver already holds
   * the whole fare, so they owe the platform its share (negative). PayPal:
   * the platform holds the whole fare, so it owes the driver their
   * earnings (positive).
   */
  driverWalletDelta: number;
  /** Cash only — what the driver must collect from the passenger. 0 for PayPal. */
  cashToCollect: number;
}

/** Pure settlement math for a completed ride — see docs/payments.md. */
export function computeTripSettlement(
  method: PaymentMethodType,
  fare: Pick<FareBreakdown, "total" | "commission" | "bookingFee" | "serviceFee">,
): TripSettlement {
  const total = round2(fare.total);
  const driverEarnings = driverEarningsFromFare(fare);
  const platformShare = round2(total - driverEarnings);

  if (method === PaymentMethodType.PAYPAL) {
    return {
      total,
      driverEarnings,
      platformShare,
      driverWalletDelta: driverEarnings,
      cashToCollect: 0,
    };
  }
  return {
    total,
    driverEarnings,
    platformShare,
    driverWalletDelta: -platformShare,
    cashToCollect: total,
  };
}

/**
 * PayPal lets a merchant capture more than it authorized, up to 115% of
 * the authorization or +75 in the same currency, whichever is lower. A
 * longer-than-estimated ride is captured up to that ceiling; anything
 * above it is a shortfall logged for staff rather than a failed capture.
 */
export function maxPaypalCaptureAmount(authorizedAmount: number): number {
  return round2(Math.min(authorizedAmount * 1.15, authorizedAmount + 75));
}

export function paypalCaptureAmount(
  finalTotal: number,
  authorizedAmount: number,
): { amount: number; shortfall: number } {
  const cap = maxPaypalCaptureAmount(authorizedAmount);
  const amount = round2(Math.min(finalTotal, cap));
  return { amount, shortfall: round2(Math.max(0, finalTotal - amount)) };
}

/**
 * The amount to hold on PayPal at booking. The passenger's own estimate is
 * client-supplied, so it's never trusted below a server-computed floor
 * (fare over the straight-line distance — a real route is never shorter).
 */
export function paypalAuthorizationAmount(
  clientEstimateTotal: number | undefined,
  serverFloorTotal: number,
): number {
  return round2(Math.max(clientEstimateTotal ?? 0, serverFloorTotal));
}
