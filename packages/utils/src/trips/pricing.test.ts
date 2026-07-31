import { describe, expect, it } from "vitest";

import { calculateFare, type FareCategoryInput, type FareSettingsInput } from "./pricing";

const economyCategory: FareCategoryInput = { baseFare: 2.5, perKmRate: 1.1, perMinuteRate: 0.18, minimumFare: 5 };
const baseSettings: FareSettingsInput = { bookingFee: 1, serviceFeeRate: 0.05, commissionRate: 0.2 };

describe("calculateFare", () => {
  it("sums base + distance + time fare before fees", () => {
    // 5km * 1.1 = 5.5, 10min * 0.18 = 1.8, base 2.5 => metered 9.8 (above minimum)
    const result = calculateFare({ distanceMeters: 5000, durationSeconds: 600, category: economyCategory, settings: baseSettings });
    expect(result.baseFare).toBe(2.5);
    expect(result.distanceFare).toBe(5.5);
    expect(result.timeFare).toBe(1.8);
  });

  it("applies the category minimum fare when the metered fare is lower", () => {
    // Tiny trip: 0.1km, 30s -> metered fare well under the $5 minimum.
    const result = calculateFare({ distanceMeters: 100, durationSeconds: 30, category: economyCategory, settings: baseSettings });
    const meteredBeforeMinimum = economyCategory.baseFare + (100 / 1000) * economyCategory.perKmRate + (30 / 60) * economyCategory.perMinuteRate;
    expect(meteredBeforeMinimum).toBeLessThan(economyCategory.minimumFare);
    // subtotal = minimumFare(5) + bookingFee(1) + serviceFee(5*0.05=0.25) = 6.25
    expect(result.subtotal).toBe(6.25);
  });

  it("adds the booking fee and service fee into the subtotal", () => {
    const result = calculateFare({ distanceMeters: 5000, durationSeconds: 600, category: economyCategory, settings: baseSettings });
    // metered = 9.8, serviceFee = 9.8*0.05 = 0.49, subtotal = 9.8+1+0.49 = 11.29
    expect(result.bookingFee).toBe(1);
    expect(result.serviceFee).toBe(0.49);
    expect(result.subtotal).toBe(11.29);
    expect(result.total).toBe(11.29);
  });

  it("applies surge multiplier to the metered fare only, not to fees", () => {
    const surged = calculateFare({
      distanceMeters: 5000,
      durationSeconds: 600,
      category: economyCategory,
      settings: { ...baseSettings, surgeMultiplier: 2 },
    });
    // metered = 9.8*2 = 19.6, serviceFee = 19.6*0.05 = 0.98, subtotal = 19.6+1+0.98 = 21.58
    expect(surged.subtotal).toBe(21.58);
    expect(surged.surgeMultiplier).toBe(2);
  });

  it("subtracts discount and promo code before applying tax", () => {
    const result = calculateFare({
      distanceMeters: 5000,
      durationSeconds: 600,
      category: economyCategory,
      settings: { ...baseSettings, discount: 2, promoCodeDiscount: 1, taxRate: 0.1 },
    });
    // subtotal = 11.29, afterDiscounts = 11.29-2-1 = 8.29, tax = 0.829, total = 9.119 -> rounds to 9.12
    expect(result.discount).toBe(2);
    expect(result.promoCodeDiscount).toBe(1);
    expect(result.total).toBeCloseTo(9.12, 2);
  });

  it("never lets discounts push the fare below zero before tax", () => {
    const result = calculateFare({
      distanceMeters: 100,
      durationSeconds: 30,
      category: economyCategory,
      settings: { ...baseSettings, discount: 1000 },
    });
    expect(result.total).toBe(0);
  });

  it("computes commission on the fare after the category minimum, not on fees", () => {
    const result = calculateFare({ distanceMeters: 100, durationSeconds: 30, category: economyCategory, settings: baseSettings });
    // fareAfterMinimum = 5 (the category minimum), commission = 5*0.2 = 1
    expect(result.commission).toBe(1);
  });

  it("defaults currency to USD when not provided", () => {
    const result = calculateFare({ distanceMeters: 1000, durationSeconds: 60, category: economyCategory, settings: baseSettings });
    expect(result.currency).toBe("USD");
  });
});
