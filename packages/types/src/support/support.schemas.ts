import { z } from "zod";

import { SupportTicketPriority, SupportTicketStatus } from "./support.enums";

export const supportTicketStatusSchema = z.nativeEnum(SupportTicketStatus);
export const supportTicketPrioritySchema = z.nativeEnum(SupportTicketPriority);

/** Source of truth for the `supportTickets` collection document shape. */
export const supportTicketSchema = z.object({
  id: z.string().min(1),
  requesterId: z.string().min(1),
  subject: z.string().min(1),
  description: z.string().min(1),
  status: supportTicketStatusSchema,
  priority: supportTicketPrioritySchema,
  assignedTo: z.string().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type SupportTicket = z.infer<typeof supportTicketSchema>;
