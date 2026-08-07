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

export const createSupportTicketInputSchema = supportTicketSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  assignedTo: true,
});

export type CreateSupportTicketInput = z.infer<typeof createSupportTicketInputSchema>;

/**
 * Source of truth for the `contactSubmissions` collection (Web Phase W1,
 * Part 1) — the public marketing site's "Contact us" form. Deliberately
 * separate from `supportTickets`: a contact submission is an anonymous,
 * pre-sales inquiry with no requester account and no assign/resolve
 * workflow, whereas a support ticket belongs to a signed-in user and is
 * actively worked by support staff.
 */
export const contactSubmissionSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1).max(200),
  email: z.string().email(),
  message: z.string().min(1).max(5000),
  status: z.enum(["new", "read"]).default("new"),
  createdAt: z.date(),
});

export type ContactSubmission = z.infer<typeof contactSubmissionSchema>;

export const createContactSubmissionInputSchema = contactSubmissionSchema.omit({
  id: true,
  status: true,
  createdAt: true,
});

export type CreateContactSubmissionInput = z.infer<typeof createContactSubmissionInputSchema>;
