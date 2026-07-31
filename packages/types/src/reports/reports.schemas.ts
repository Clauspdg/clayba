import { z } from "zod";

import { ReportCategory, ReportStatus } from "./reports.enums";

export const reportStatusSchema = z.nativeEnum(ReportStatus);
export const reportCategorySchema = z.nativeEnum(ReportCategory);

/** Source of truth for the `reports` collection document shape (user-submitted incident reports). */
export const reportSchema = z.object({
  id: z.string().min(1),
  reporterId: z.string().min(1),
  targetId: z.string().min(1),
  targetType: z.string().min(1),
  category: reportCategorySchema,
  status: reportStatusSchema,
  description: z.string().min(1),
  resolvedBy: z.string().optional(),
  resolution: z.string().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type Report = z.infer<typeof reportSchema>;
