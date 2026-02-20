export function formatCurrency(amount: number, symbol = "Rs"): string {
  return `${symbol} ${amount.toLocaleString("en-PK", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}

import { format as formatDateFns } from "date-fns";

/** User-facing date display: DD-MM-YYYY (GC-UX-002) */
export function formatDate(date: string): string {
  return formatDateFns(new Date(date), "dd-MM-yyyy");
}

export function ledgerTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    donation_bank: "Bank Donation",
    donation_cash: "Cash Donation",
    donation_in_kind: "In-Kind",
    cash_transfer: "Cash Transfer",
    cash_deposit: "Cash Deposit",
    bank_withdrawal: "Bank Withdrawal",
    expense_bank: "Bank Expense",
    expense_cash: "Cash Expense",
  };
  return labels[type] ?? type;
}
