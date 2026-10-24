export enum PaymentStatus {
  PENDING = "pending",
  AUTHORIZED = "authorized",
  CAPTURED = "captured",
  /** An authorization released without capturing — ride cancelled, expired, or never matched. */
  VOIDED = "voided",
  FAILED = "failed",
  REFUNDED = "refunded",
}

/**
 * How a passenger pays for a ride. Only `CASH` and `PAYPAL` are offered at
 * booking today (see docs/payments.md); `CARD`/`WALLET` are kept for the
 * existing data shape but no booking flow produces them.
 */
export enum PaymentMethodType {
  CARD = "card",
  WALLET = "wallet",
  CASH = "cash",
  PAYPAL = "paypal",
}
