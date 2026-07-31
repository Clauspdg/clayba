import { z } from "zod";

/** Source of truth for the `emergencyContacts` collection document shape. */
export const emergencyContactSchema = z.object({
  id: z.string().min(1),
  userId: z.string().min(1),
  name: z.string().min(1),
  phoneNumber: z.string().min(1),
  relationship: z.string().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type EmergencyContact = z.infer<typeof emergencyContactSchema>;
