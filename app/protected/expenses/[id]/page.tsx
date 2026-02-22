import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getExpenseById } from "@/lib/actions/expenses";
import { formatCurrency, formatDate, ledgerTypeLabel } from "@/lib/format";

export default async function ExpenseDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  let expense: Awaited<ReturnType<typeof getExpenseById>>;
  try {
    expense = await getExpenseById(id);
  } catch {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/protected/expenses">
            <ArrowLeft className="size-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Expense Detail</h1>
          <p className="text-muted-foreground">Record ID: {expense.id}</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {ledgerTypeLabel(expense.type)}
            {expense.deleted_at ? <Badge variant="destructive">VOID</Badge> : <Badge variant="outline">Active</Badge>}
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <p>
            <span className="text-muted-foreground">Date: </span>
            {formatDate(expense.date)}
          </p>
          <p>
            <span className="text-muted-foreground">Item: </span>
            {expense.item_name ?? "-"}
          </p>
          <p>
            <span className="text-muted-foreground">Category: </span>
            {expense.expense_categories?.name ?? "-"}
          </p>
          <p>
            <span className="text-muted-foreground">Method: </span>
            {ledgerTypeLabel(expense.type)}
          </p>
          <p>
            <span className="text-muted-foreground">Quantity: </span>
            {expense.quantity ?? 0}
          </p>
          <p>
            <span className="text-muted-foreground">Unit Price: </span>
            {expense.unit_price != null
              ? formatCurrency(Number(expense.unit_price), expense.currencies?.symbol)
              : "-"}
          </p>
          <p>
            <span className="text-muted-foreground">Total (PKR): </span>
            {formatCurrency(Number(expense.amount) * Number(expense.exchange_rate_to_pkr), "Rs")}
          </p>
          <p>
            <span className="text-muted-foreground">Drive: </span>
            {expense.causes?.name ?? "General"}
          </p>
          <p className="md:col-span-2">
            <span className="text-muted-foreground">Notes: </span>
            {expense.description ?? "-"}
          </p>
          {expense.void_reason && (
            <p className="md:col-span-2">
              <span className="text-muted-foreground">Void reason: </span>
              {expense.void_reason}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
