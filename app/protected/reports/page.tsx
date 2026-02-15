import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { createClient } from "@/lib/supabase/server";
import { getBankAccountBalances } from "@/lib/actions/bank-accounts";
import { ReportsClient } from "./reports-client";

async function ReportsData() {
  const supabase = await createClient();

  const [
    { data: donations },
    { data: expenses },
    bankBalances,
    { data: driveSummaries },
  ] = await Promise.all([
    supabase
      .from("ledger_entries")
      .select("*, currencies(code, symbol), donors(name), causes(name), bank_accounts(account_name), to_user:volunteers!ledger_entries_to_user_id_fkey(name)")
      .in("type", ["donation_bank", "donation_cash", "donation_in_kind"])
      .is("deleted_at", null)
      .order("date", { ascending: false }),
    supabase
      .from("ledger_entries")
      .select("*, currencies(code, symbol), causes(name), expense_categories(name), bank_accounts(account_name), from_user:volunteers!ledger_entries_from_user_id_fkey(name)")
      .in("type", ["expense_bank", "expense_cash"])
      .is("deleted_at", null)
      .order("date", { ascending: false }),
    getBankAccountBalances(),
    supabase.from("drive_financial_summary").select("*"),
  ]);

  return (
    <ReportsClient
      donations={donations ?? []}
      expenses={expenses ?? []}
      bankBalances={bankBalances}
      driveSummaries={driveSummaries ?? []}
    />
  );
}

export default function ReportsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Reports & Export</h1>
        <p className="text-muted-foreground">
          Export data as CSV or generate PDF reports
        </p>
      </div>
      <Suspense fallback={<Skeleton className="h-64" />}>
        <ReportsData />
      </Suspense>
    </div>
  );
}
