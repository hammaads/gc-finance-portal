import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getExpenseById } from "@/lib/actions/expenses";
import { getReceipts } from "@/lib/actions/receipts";
import { formatCurrency, formatDate } from "@/lib/format";
import { ExpenseDetailActions } from "./expense-detail-actions";
import { ExpenseReceipts } from "./expense-receipts";

export default async function ExpenseDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const expense = await getExpenseById(id);
  if (!expense) notFound();

  const receipts = await getReceipts(id);
  const isVoided = !!(expense as { deleted_at?: string | null }).deleted_at;
  const voidReason = (expense as { void_reason?: string | null }).void_reason;
  const methodLabel = expense.type === "expense_bank" ? "Bank" : "Cash";
  const pkrValue = Number(expense.amount) * Number(expense.exchange_rate_to_pkr);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/protected/expenses">
            <ArrowLeft className="size-4" />
            <span className="sr-only">Back to Expenses</span>
          </Link>
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-semibold tracking-tight">
            {expense.item_name ?? "Expense"} details
          </h1>
          <p className="text-muted-foreground">
            {formatDate(expense.date)} · {(expense.expense_categories as { name: string } | null)?.name ?? "-"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {isVoided && <Badge variant="secondary">VOID</Badge>}
          <Badge variant={expense.type === "expense_bank" ? "default" : "outline"}>
            {methodLabel}
          </Badge>
          <ExpenseDetailActions expenseId={id} isVoided={isVoided} />
        </div>
      </div>

      {isVoided && voidReason && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/30 p-4">
          <p className="text-sm font-medium text-amber-800 dark:text-amber-200">Void reason</p>
          <p className="mt-1 text-sm text-amber-700 dark:text-amber-300">{voidReason}</p>
        </div>
      )}

      <div className="rounded-lg border bg-card p-6 space-y-4">
        <dl className="grid gap-4 sm:grid-cols-2">
          <div>
            <dt className="text-sm font-medium text-muted-foreground">Date</dt>
            <dd className="mt-1">{formatDate(expense.date)}</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-muted-foreground">Item</dt>
            <dd className="mt-1">{expense.item_name ?? "-"}</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-muted-foreground">Category</dt>
            <dd className="mt-1">{(expense.expense_categories as { name: string } | null)?.name ?? "-"}</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-muted-foreground">Quantity / Unit price</dt>
            <dd className="mt-1">
              {Number(expense.quantity ?? 0)} × {(expense.currencies as { symbol?: string } | null)?.symbol ?? ""}{Number(expense.unit_price ?? 0)}
            </dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-muted-foreground">Amount (PKR)</dt>
            <dd className="mt-1">{formatCurrency(pkrValue, "Rs")}</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-muted-foreground">Method</dt>
            <dd className="mt-1">{methodLabel}</dd>
          </div>
          {expense.type === "expense_bank" && (
            <div>
              <dt className="text-sm font-medium text-muted-foreground">Bank account</dt>
              <dd className="mt-1">{(expense.bank_accounts as { account_name?: string } | null)?.account_name ?? "-"}</dd>
            </div>
          )}
          {expense.type === "expense_cash" && (
            <div>
              <dt className="text-sm font-medium text-muted-foreground">Paid by</dt>
              <dd className="mt-1">{(expense.from_user as { name?: string } | null)?.name ?? "-"}</dd>
            </div>
          )}
          {(expense.causes as { name?: string } | null)?.name && (
            <div>
              <dt className="text-sm font-medium text-muted-foreground">Drive / Cause</dt>
              <dd className="mt-1">{(expense.causes as { name: string }).name}</dd>
            </div>
          )}
        </dl>
        {expense.description && (
          <div>
            <dt className="text-sm font-medium text-muted-foreground">Description</dt>
            <dd className="mt-1 whitespace-pre-wrap">{expense.description}</dd>
          </div>
        )}
      </div>

      <ExpenseReceipts expenseId={id} initialReceipts={receipts} />
    </div>
  );
}
