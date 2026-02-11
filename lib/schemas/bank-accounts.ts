import { z } from "zod";

export const bankAccountSchema = z.object({
  id: z.string().uuid().optional(),
  account_name: z.string().min(1, "Account name is required"),
  bank_name: z.string().min(1, "Bank name is required"),
  account_number: z.string().optional().nullable(),
  currency_id: z.string().uuid("Select a currency"),
  opening_balance: z.coerce.number().min(0, "Balance cannot be negative").default(0),
});

export type BankAccountFormData = z.infer<typeof bankAccountSchema>;
