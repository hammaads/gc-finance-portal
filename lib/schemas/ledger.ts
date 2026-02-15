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

const expenseBaseSchema = baseLedgerSchema.extend({
  item_name: z.string().min(1, "Item name is required"),
  quantity: z.coerce.number().positive("Quantity must be positive"),
  unit_price: z.coerce.number().min(0, "Unit price must be non-negative"),
  category_id: z.string().uuid("Select a category"),
  custodian_id: z.string().uuid().optional().nullable(),
});

export const expenseBankSchema = expenseBaseSchema.extend({
  type: z.literal("expense_bank"),
  bank_account_id: z.string().uuid("Select a bank account"),
});

export const expenseCashSchema = expenseBaseSchema.extend({
  type: z.literal("expense_cash"),
  from_user_id: z.string().uuid("Select a paying volunteer"),
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

export const donationInKindSchema = z.object({
  type: z.literal("donation_in_kind"),
  date: z.string().min(1, "Date is required"),
  donor_id: z.string().uuid("Select a donor"),
  item_name: z.string().min(1, "Item name is required"),
  quantity: z.coerce.number().positive("Quantity must be positive"),
  custodian_id: z.string().uuid("Select a custodian"),
  description: z.string().optional().nullable(),
  cause_id: z.string().uuid().optional().nullable(),
});

export const donationSchema = z.discriminatedUnion("type", [
  donationBankSchema,
  donationCashSchema,
  donationInKindSchema,
]);

export const expenseSchema = z.discriminatedUnion("type", [
  expenseBankSchema,
  expenseCashSchema,
]);

export type DonationFormData = z.infer<typeof donationSchema>;
export type ExpenseFormData = z.infer<typeof expenseSchema>;
export type CashTransferFormData = z.infer<typeof cashTransferSchema>;
export type CashDepositFormData = z.infer<typeof cashDepositSchema>;
