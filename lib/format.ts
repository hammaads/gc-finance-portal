export function formatCurrency(amount: number, symbol = "Rs"): string {
  return `${symbol} ${amount.toLocaleString("en-PK", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}

export function formatDate(date: string): string {
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return date;
  const day = String(parsed.getDate()).padStart(2, "0");
  const month = String(parsed.getMonth() + 1).padStart(2, "0");
  const year = parsed.getFullYear();
  return `${day}-${month}-${year}`;
}

export function ledgerTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    donation_bank: "Bank Donation",
    donation_cash: "Cash Donation",
    donation_in_kind: "In-Kind",
    cash_transfer: "Cash Transfer",
    cash_deposit: "Cash Deposit",
    cash_withdrawal: "Cash Withdrawal",
    expense_bank: "Bank Expense",
    expense_cash: "Cash Expense",
  };
  return labels[type] ?? type;
}
