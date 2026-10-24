import { PaymentMethodType } from "@the-ride/types";
import { describe, expect, it } from "vitest";

import {
  computeTripSettlement,
  driverEarningsFromFare,
  maxPaypalCaptureAmount,
  paypalAuthorizationAmount,
  paypalCaptureAmount,
} from "./settlement";

// total 13.30 = fare 10 + booking fee 1.50 + service fee 1.80; commission 2 (20% of 10).
const fare = { total: 13.3, commission: 2, bookingFee: 1.5, serviceFee: 1.8 };

describe("driverEarningsFromFare", () => {
  it("keeps the metered fare minus commission, never the platform fees", () => {
    expect(driverEarningsFromFare(fare)).toBe(8);
  });

  it("never goes negative", () => {
    expect(driverEarningsFromFare({ total: 1, commission: 5, bookingFee: 1, serviceFee: 1 })).toBe(
      0,
    );
  });
});

describe("computeTripSettlement", () => {
  it("cash: driver collects the full total and owes the platform its share", () => {
    expect(computeTripSettlement(PaymentMethodType.CASH, fare)).toEqual({
      total: 13.3,
      driverEarnings: 8,
      platformShare: 5.3,
      driverWalletDelta: -5.3,
      cashToCollect: 13.3,
    });
  });

  it("paypal: platform holds the fare and credits the driver's earnings", () => {
    expect(computeTripSettlement(PaymentMethodType.PAYPAL, fare)).toEqual({
      total: 13.3,
      driverEarnings: 8,
      platformShare: 5.3,
      driverWalletDelta: 8,
      cashToCollect: 0,
    });
  });

  it("driver earnings + platform share always add up to the total", () => {
    for (const method of [PaymentMethodType.CASH, PaymentMethodType.PAYPAL]) {
      const s = computeTripSettlement(method, {
        total: 27.77,
        commission: 4.1,
        bookingFee: 1.5,
        serviceFee: 2.05,
      });
      expect(Math.round((s.driverEarnings + s.platformShare) * 100) / 100).toBe(s.total);
    }
  });
});

describe("PayPal capture ceiling", () => {
  it("is 115% of the authorization for small amounts", () => {
    expect(maxPaypalCaptureAmount(20)).toBe(23);
  });

  it("is capped at +75 for large amounts", () => {
    expect(maxPaypalCaptureAmount(1000)).toBe(1075);
  });

  it("captures the final fare when it fits under the ceiling", () => {
    expect(paypalCaptureAmount(21.5, 20)).toEqual({ amount: 21.5, shortfall: 0 });
  });

  it("captures the ceiling and reports the shortfall above it", () => {
    expect(paypalCaptureAmount(30, 20)).toEqual({ amount: 23, shortfall: 7 });
  });

  it("captures less than authorized when the ride was cheaper", () => {
    expect(paypalCaptureAmount(12, 20)).toEqual({ amount: 12, shortfall: 0 });
  });
});

describe("paypalAuthorizationAmount", () => {
  it("never holds less than the server floor, whatever the client sent", () => {
    expect(paypalAuthorizationAmount(0.01, 9.4)).toBe(9.4);
    expect(paypalAuthorizationAmount(undefined, 9.4)).toBe(9.4);
  });

  it("uses the client estimate when it is higher than the floor", () => {
    expect(paypalAuthorizationAmount(14.2, 9.4)).toBe(14.2);
  });
});
