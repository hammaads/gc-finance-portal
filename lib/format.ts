export function formatCurrency(amount: number, symbol = "Rs"): string {
  return `${symbol} ${amount.toLocaleString("en-PK", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}

export function formatDate(date: string): string {
  return new Date(date).toLocaleDateString("en-PK", {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function ledgerTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    donation_bank: "Bank Donation",
    donation_cash: "Cash Donation",
    donation_in_kind: "In-Kind",
    cash_transfer: "Cash Transfer",
    cash_deposit: "Cash Deposit",
    expense_bank: "Bank Expense",
    expense_cash: "Cash Expense",
  };
  return labels[type] ?? type;
}
