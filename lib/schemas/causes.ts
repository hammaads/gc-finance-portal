import { z } from "zod";

export const causeSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(1, "Name is required"),
  type: z.enum(["drive", "other"]),
  description: z.string().optional().nullable(),
  date: z.string().optional().nullable(),
  location: z.string().optional().nullable(),
  number_of_daigs: z.coerce.number().int().positive().optional().nullable(),
  expected_attendees: z.coerce.number().int().min(0).optional().nullable(),
  actual_attendees: z.coerce.number().int().min(0).optional().nullable(),
  expected_headcount: z.coerce.number().int().positive().optional().nullable(),
});

export type CauseFormData = z.infer<typeof causeSchema>;
