import { z } from "zod";

export const budgetItemSchema = z.object({
  id: z.string().uuid().optional(),
  cause_id: z.string().uuid("Select a drive"),
  category_id: z.string().uuid("Select a category"),
  description: z.string().min(1, "Description is required"),
  quantity: z.coerce.number().positive("Quantity must be positive").default(1),
  unit_price: z.coerce.number().min(0, "Price cannot be negative").default(0),
  currency_id: z.string().uuid("Select a currency"),
  exchange_rate_to_pkr: z.coerce.number().positive("Rate must be positive").default(1),
});

export type BudgetItemFormData = z.infer<typeof budgetItemSchema>;
