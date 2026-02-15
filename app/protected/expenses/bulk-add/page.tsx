import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { getItemNameSuggestions } from "@/lib/actions/expenses";
import { getExpenseCategories, getCurrencies } from "@/lib/actions/settings";
import { getBankAccounts } from "@/lib/actions/bank-accounts";
import { getCauses } from "@/lib/actions/causes";
import { getProfiles } from "@/lib/actions/cash";
import { getReceiptSetting } from "@/lib/actions/receipts";
import { BulkAddClient } from "./bulk-add-client";

async function BulkAddContent() {
  const [categories, currencies, bankAccounts, causes, profiles, itemNames, receiptRequired] =
    await Promise.all([
      getExpenseCategories(),
      getCurrencies(),
      getBankAccounts(),
      getCauses(),
      getProfiles(),
      getItemNameSuggestions(),
      getReceiptSetting(),
    ]);

  return (
    <BulkAddClient
      categories={categories}
      currencies={currencies}
      bankAccounts={bankAccounts}
      causes={causes}
      profiles={profiles}
      itemNames={itemNames}
      receiptRequired={receiptRequired}
    />
  );
}

export default function BulkAddPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Bulk Add Expenses</h1>
        <p className="text-muted-foreground">
          Add multiple expense items at once
        </p>
      </div>
      <Suspense fallback={<Skeleton className="h-96" />}>
        <BulkAddContent />
      </Suspense>
    </div>
  );
}
