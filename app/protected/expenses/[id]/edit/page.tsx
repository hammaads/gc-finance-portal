import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getExpenseById } from "@/lib/actions/expenses";
import { getCurrencies } from "@/lib/actions/settings";
import { getBankAccounts } from "@/lib/actions/bank-accounts";
import { getCauses } from "@/lib/actions/causes";
import { getVolunteers } from "@/lib/actions/volunteers";
import { getExpenseCategories } from "@/lib/actions/settings";
import { ExpenseEditForm } from "./expense-edit-form";

export default async function ExpenseEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [expense, currencies, bankAccounts, causes, volunteers, categories] = await Promise.all([
    getExpenseById(id),
    getCurrencies(),
    getBankAccounts(),
    getCauses(),
    getVolunteers(),
    getExpenseCategories(),
  ]);
  if (!expense) notFound();
  if ((expense as { deleted_at?: string | null }).deleted_at) {
    notFound(); // don't edit voided
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/protected/expenses/${id}`}>
            <ArrowLeft className="size-4" />
            <span className="sr-only">Back</span>
          </Link>
        </Button>
        <h1 className="text-2xl font-semibold tracking-tight">Edit expense</h1>
      </div>
      <ExpenseEditForm
        expense={expense}
        currencies={currencies}
        bankAccounts={bankAccounts}
        causes={causes}
        volunteers={volunteers}
        categories={categories}
      />
    </div>
  );
}
