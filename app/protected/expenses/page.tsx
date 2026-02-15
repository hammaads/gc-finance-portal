import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { getExpenses, getItemNameSuggestions } from "@/lib/actions/expenses";
import { getExpenseCategories, getCurrencies } from "@/lib/actions/settings";
import { getBankAccounts } from "@/lib/actions/bank-accounts";
import { getCauses } from "@/lib/actions/causes";
import { getVolunteers } from "@/lib/actions/volunteers";
import { getReceiptSetting } from "@/lib/actions/receipts";
import { ExpensesClient } from "./expenses-client";

async function ExpensesContent() {
  const [
    expenses,
    categories,
    currencies,
    bankAccounts,
    causes,
    volunteers,
    itemNames,
    receiptRequired,
  ] = await Promise.all([
    getExpenses(),
    getExpenseCategories(),
    getCurrencies(),
    getBankAccounts(),
    getCauses(),
    getVolunteers(),
    getItemNameSuggestions(),
    getReceiptSetting(),
  ]);

  return (
    <ExpensesClient
      expenses={expenses}
      categories={categories}
      currencies={currencies}
      bankAccounts={bankAccounts}
      causes={causes}
      volunteers={volunteers}
      itemNames={itemNames}
      receiptRequired={receiptRequired}
    />
  );
}

export default function ExpensesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Expenses</h1>
        <p className="text-muted-foreground">
          Track and manage all expenses
        </p>
      </div>
      <Suspense fallback={<Skeleton className="h-96" />}>
        <ExpensesContent />
      </Suspense>
    </div>
  );
}
