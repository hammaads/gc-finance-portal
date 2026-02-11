import { z } from "zod";

export const donorSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(1, "Name is required"),
  phone: z.string().optional().nullable(),
  email: z.string().email("Invalid email").optional().or(z.literal("")).nullable(),
});

export type DonorFormData = z.infer<typeof donorSchema>;
