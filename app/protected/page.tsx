import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { getBankAccountBalances, getBankAccounts } from "@/lib/actions/bank-accounts";
import { getDonors } from "@/lib/actions/donors";
import { getCurrencies, getExpenseCategories } from "@/lib/actions/settings";
import { getCauses } from "@/lib/actions/causes";
import { getVolunteers } from "@/lib/actions/volunteers";
import { getItemNameSuggestions } from "@/lib/actions/expenses";
import { getReceiptSetting } from "@/lib/actions/receipts";
import { DashboardContent } from "./dashboard-content";

async function DashboardData() {
  const supabase = await createClient();
  const { data: claims, error } = await supabase.auth.getClaims();
  if (error || !claims?.claims) redirect("/auth/login");

  const [
    bankBalances,
    { data: cashBalances },
    { data: driveSummaries },
    { data: recentEntries },
    donors,
    currencies,
    bankAccounts,
    causes,
    volunteers,
    expenseCategories,
    itemNames,
    receiptRequired,
  ] = await Promise.all([
    getBankAccountBalances(),
    supabase.from("volunteer_cash_balances").select("*"),
    supabase.from("drive_financial_summary").select("*").eq("type", "drive").order("date"),
    supabase
      .from("ledger_entries")
      .select("*, currencies(code, symbol), donors(name), causes(name), expense_categories(name), from_user:volunteers!ledger_entries_from_user_id_fkey(name), to_user:volunteers!ledger_entries_to_user_id_fkey(name)")
      .is("deleted_at", null)
      .order("created_at", { ascending: false })
      .limit(10),
    getDonors(),
    getCurrencies(),
    getBankAccounts(),
    getCauses(),
    getVolunteers(),
    getExpenseCategories(),
    getItemNameSuggestions(),
    getReceiptSetting(),
  ]);

  return (
    <DashboardContent
      bankBalances={bankBalances}
      cashBalances={cashBalances ?? []}
      driveSummaries={driveSummaries ?? []}
      recentEntries={recentEntries ?? []}
      donors={donors}
      currencies={currencies}
      bankAccounts={bankAccounts}
      causes={causes}
      volunteers={volunteers}
      expenseCategories={expenseCategories}
      itemNames={itemNames}
      receiptRequired={receiptRequired}
    />
  );
}

export default function DashboardPage() {
  return (
    <Suspense
      fallback={
        <div className="space-y-6">
          <Skeleton className="h-8 w-48" />
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-28 rounded-lg" />
            ))}
          </div>
          <Skeleton className="h-64" />
        </div>
      }
    >
      <DashboardData />
    </Suspense>
  );
}
