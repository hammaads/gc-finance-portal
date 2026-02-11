import { z } from "zod";

const baseLedgerSchema = z.object({
  amount: z.coerce.number().positive("Amount must be positive"),
  currency_id: z.string().uuid("Select a currency"),
  exchange_rate_to_pkr: z.coerce.number().positive("Rate must be positive"),
  date: z.string().min(1, "Date is required"),
  description: z.string().optional().nullable(),
  cause_id: z.string().uuid().optional().nullable(),
});

export const donationBankSchema = baseLedgerSchema.extend({
  type: z.literal("donation_bank"),
  donor_id: z.string().uuid("Select a donor"),
  bank_account_id: z.string().uuid("Select a bank account"),
});

export const donationCashSchema = baseLedgerSchema.extend({
  type: z.literal("donation_cash"),
  donor_id: z.string().uuid("Select a donor"),
  to_user_id: z.string().uuid("Select a receiving volunteer"),
});

export const expenseBankSchema = baseLedgerSchema.extend({
  type: z.literal("expense_bank"),
  bank_account_id: z.string().uuid("Select a bank account"),
  category_id: z.string().uuid("Select a category"),
});

export const expenseCashSchema = baseLedgerSchema.extend({
  type: z.literal("expense_cash"),
  from_user_id: z.string().uuid("Select a paying volunteer"),
  category_id: z.string().uuid("Select a category"),
});

export const cashTransferSchema = baseLedgerSchema.extend({
  type: z.literal("cash_transfer"),
  from_user_id: z.string().uuid("Select source volunteer"),
  to_user_id: z.string().uuid("Select destination volunteer"),
});

export const cashDepositSchema = baseLedgerSchema.extend({
  type: z.literal("cash_deposit"),
  from_user_id: z.string().uuid("Select depositing volunteer"),
  bank_account_id: z.string().uuid("Select a bank account"),
});

export const donationSchema = z.discriminatedUnion("type", [
  donationBankSchema,
  donationCashSchema,
]);

export const expenseSchema = z.discriminatedUnion("type", [
  expenseBankSchema,
  expenseCashSchema,
]);

export type DonationFormData = z.infer<typeof donationSchema>;
export type ExpenseFormData = z.infer<typeof expenseSchema>;
export type CashTransferFormData = z.infer<typeof cashTransferSchema>;
export type CashDepositFormData = z.infer<typeof cashDepositSchema>;
