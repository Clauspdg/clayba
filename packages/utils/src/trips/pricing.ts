import type { FareBreakdown } from "@the-ride/types";

export interface FareCategoryInput {
  baseFare: number;
  perKmRate: number;
  perMinuteRate: number;
  minimumFare: number;
}

export interface FareSettingsInput {
  bookingFee: number;
  serviceFeeRate: number;
  commissionRate: number;
  /** Placeholder — pass 0 until tax rules ship. */
  taxRate?: number;
  /** Placeholder — pass 1 until real surge pricing ships. */
  surgeMultiplier?: number;
  /** Placeholder flat discount — pass 0 until a discount engine ships. */
  discount?: number;
  /** Placeholder flat discount — pass 0 until promo codes ship. */
  promoCodeDiscount?: number;
  currency?: string;
}

export interface CalculateFareInput {
  distanceMeters: number;
  durationSeconds: number;
  category: FareCategoryInput;
  settings: FareSettingsInput;
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

/**
 * Clayba's fare calculator (Sprint 3, Part 4). Pure function — no
 * Firestore/network access — so the passenger app, admin dashboard, and
 * dispatch engine can all compute (or re-verify) the same estimate the
 * same way. See docs/pricing-engine.md for the worked formula.
 */
export function calculateFare({
  distanceMeters,
  durationSeconds,
  category,
  settings,
}: CalculateFareInput): FareBreakdown {
  const surgeMultiplier = settings.surgeMultiplier ?? 1;
  const discount = settings.discount ?? 0;
  const promoCodeDiscount = settings.promoCodeDiscount ?? 0;
  const taxRate = settings.taxRate ?? 0;
  const currency = settings.currency ?? "USD";

  const baseFare = category.baseFare;
  const distanceFare = (distanceMeters / 1000) * category.perKmRate;
  const timeFare = (durationSeconds / 60) * category.perMinuteRate;

  const meteredFare = (baseFare + distanceFare + timeFare) * surgeMultiplier;
  const fareAfterMinimum = Math.max(meteredFare, category.minimumFare);

  const bookingFee = settings.bookingFee;
  const serviceFee = fareAfterMinimum * settings.serviceFeeRate;
  const subtotal = fareAfterMinimum + bookingFee + serviceFee;

  const afterDiscounts = Math.max(0, subtotal - discount - promoCodeDiscount);
  const tax = afterDiscounts * taxRate;
  const total = afterDiscounts + tax;

  const commission = fareAfterMinimum * settings.commissionRate;

  return {
    baseFare: round2(baseFare),
    distanceFare: round2(distanceFare),
    timeFare: round2(timeFare),
    bookingFee: round2(bookingFee),
    serviceFee: round2(serviceFee),
    surgeMultiplier,
    discount: round2(discount),
    promoCodeDiscount: round2(promoCodeDiscount),
    tax: round2(tax),
    commission: round2(commission),
    subtotal: round2(subtotal),
    total: round2(total),
    currency,
  };
}
