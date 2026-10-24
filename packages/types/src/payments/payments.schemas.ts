import { z } from "zod";

import { firestoreDateSchema } from "../common/firestore-date.schema";
import { PaymentMethodType, PaymentStatus } from "./payments.enums";

export const paymentStatusSchema = z.nativeEnum(PaymentStatus);
export const paymentMethodTypeSchema = z.nativeEnum(PaymentMethodType);

/** The two methods a passenger can actually pick at booking. */
export const BOOKABLE_PAYMENT_METHODS = [PaymentMethodType.CASH, PaymentMethodType.PAYPAL] as const;
export type BookablePaymentMethod = (typeof BOOKABLE_PAYMENT_METHODS)[number];

/**
 * Source of truth for the `payments` collection document shape — one
 * document per ride, keyed by its `tripRequestId` (so a retried callable
 * can never create a second payment for the same booking). Written only
 * by Cloud Functions (`functions/src/payments`); see docs/payments.md for
 * the cash and PayPal lifecycles.
 */
export const paymentSchema = z.object({
  id: z.string().min(1),
  tripRequestId: z.string().min(1).optional(),
  /** Set once the ride exists — a PayPal payment is created at booking, before any trip. */
  tripId: z.string().min(1).optional(),
  payerId: z.string().min(1),
  driverId: z.string().min(1).optional(),
  /** The final amount owed — the frozen final fare once the ride completes. */
  amount: z.number().min(0),
  currency: z.string().length(3).default("USD"),
  method: paymentMethodTypeSchema,
  status: paymentStatusSchema,
  /** Platform commission on this ride, frozen at settlement. */
  commissionAmount: z.number().min(0).optional(),
  /** PayPal only — the amount held at booking (server-computed, never client-supplied). */
  authorizedAmount: z.number().min(0).optional(),
  /** PayPal only — what was actually captured at completion. */
  capturedAmount: z.number().min(0).optional(),
  paypalOrderId: z.string().optional(),
  paypalAuthorizationId: z.string().optional(),
  paypalCaptureId: z.string().optional(),
  failureReason: z.string().optional(),
  refundedAmount: z.number().min(0).optional(),
  settledAt: firestoreDateSchema.optional(),
  createdAt: firestoreDateSchema,
  updatedAt: firestoreDateSchema,
});

export type Payment = z.infer<typeof paymentSchema>;
