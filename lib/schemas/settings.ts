import { z } from "zod";

export const expenseCategorySchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(1, "Name is required").max(100),
});

export const currencySchema = z.object({
  id: z.string().uuid().optional(),
  code: z.string().min(1, "Code is required").max(10),
  name: z.string().min(1, "Name is required").max(100),
  symbol: z.string().min(1, "Symbol is required").max(10),
  exchange_rate_to_pkr: z.coerce.number().positive("Rate must be positive"),
  is_base: z.boolean().default(false),
});

export const driveTemplateSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(1, "Name is required").max(100),
  template_data: z.any().default([]),
});

export type ExpenseCategoryFormData = z.infer<typeof expenseCategorySchema>;
export type CurrencyFormData = z.infer<typeof currencySchema>;
export type DriveTemplateFormData = z.infer<typeof driveTemplateSchema>;
