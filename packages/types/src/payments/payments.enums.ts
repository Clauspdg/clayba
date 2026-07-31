export enum PaymentStatus {
  PENDING = "pending",
  AUTHORIZED = "authorized",
  CAPTURED = "captured",
  FAILED = "failed",
  REFUNDED = "refunded",
}

export enum PaymentMethodType {
  CARD = "card",
  WALLET = "wallet",
  CASH = "cash",
}
