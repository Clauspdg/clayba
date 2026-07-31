import { z } from "zod";

import { NotificationType } from "./notifications.enums";

export const notificationTypeSchema = z.nativeEnum(NotificationType);

/** Source of truth for the `notifications` collection document shape. */
export const notificationSchema = z.object({
  id: z.string().min(1),
  userId: z.string().min(1),
  type: notificationTypeSchema,
  title: z.string().min(1),
  body: z.string().min(1),
  isRead: z.boolean().default(false),
  data: z.record(z.unknown()).optional(),
  createdAt: z.date(),
});

export type Notification = z.infer<typeof notificationSchema>;
