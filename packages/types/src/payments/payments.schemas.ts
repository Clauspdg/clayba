import { z } from "zod";

import { PaymentMethodType, PaymentStatus } from "./payments.enums";

export const paymentStatusSchema = z.nativeEnum(PaymentStatus);
export const paymentMethodTypeSchema = z.nativeEnum(PaymentMethodType);

/**
 * Source of truth for the `payments` collection document shape. Payment
 * processing/capture integration is out of scope for this sprint — this is
 * the data shape and status lifecycle only.
 */
export const paymentSchema = z.object({
  id: z.string().min(1),
  tripId: z.string().min(1),
  payerId: z.string().min(1),
  amount: z.number().min(0),
  currency: z.string().length(3).default("USD"),
  method: paymentMethodTypeSchema,
  status: paymentStatusSchema,
  refundedAmount: z.number().min(0).optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type Payment = z.infer<typeof paymentSchema>;
