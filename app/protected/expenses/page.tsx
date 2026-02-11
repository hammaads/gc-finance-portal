import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { getExpenses } from "@/lib/actions/expenses";
import { getExpenseCategories, getCurrencies } from "@/lib/actions/settings";
import { getBankAccounts } from "@/lib/actions/bank-accounts";
import { getCauses } from "@/lib/actions/causes";
import { getProfiles } from "@/lib/actions/cash";
import { ExpensesClient } from "./expenses-client";

async function ExpensesContent() {
  const [expenses, categories, currencies, bankAccounts, causes, profiles] =
    await Promise.all([
      getExpenses(),
      getExpenseCategories(),
      getCurrencies(),
      getBankAccounts(),
      getCauses(),
      getProfiles(),
    ]);

  return (
    <ExpensesClient
      expenses={expenses}
      categories={categories}
      currencies={currencies}
      bankAccounts={bankAccounts}
      causes={causes}
      profiles={profiles}
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
