import { z } from "zod";

export const causeSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(1, "Name is required"),
  type: z.enum(["drive", "other"]),
  description: z.string().optional().nullable(),
  date: z.string().optional().nullable(),
  location: z.string().optional().nullable(),
  expected_headcount: z.coerce.number().int().positive().optional().nullable(),
});

export type CauseFormData = z.infer<typeof causeSchema>;
