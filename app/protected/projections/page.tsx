import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { createClient } from "@/lib/supabase/server";
import { getBankAccountBalances } from "@/lib/actions/bank-accounts";
import { ProjectionsClient } from "./projections-client";

async function ProjectionsData() {
  const supabase = await createClient();

  const [bankBalances, { data: cashBalances }, { data: driveSummaries }] =
    await Promise.all([
    getBankAccountBalances(),
    supabase.from("volunteer_cash_balances").select("*"),
    supabase
      .from("drive_financial_summary")
      .select("*")
      .eq("type", "drive")
      .order("date"),
  ]);

  return (
    <ProjectionsClient
      bankBalances={bankBalances ?? []}
      cashBalances={cashBalances ?? []}
      driveSummaries={driveSummaries ?? []}
    />
  );
}

export default function ProjectionsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Projections</h1>
        <p className="text-muted-foreground">
          Multi-drive runway and financial forecasting
        </p>
      </div>
      <Suspense fallback={<Skeleton className="h-96" />}>
        <ProjectionsData />
      </Suspense>
    </div>
  );
}
