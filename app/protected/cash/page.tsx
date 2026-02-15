import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { getVolunteerCashBalances } from "@/lib/actions/cash";
import { getVolunteers } from "@/lib/actions/volunteers";
import { getCurrencies } from "@/lib/actions/settings";
import { getBankAccounts } from "@/lib/actions/bank-accounts";
import { CashClient } from "./cash-client";

async function CashContent() {
  const [balances, volunteers, currencies, bankAccounts] = await Promise.all([
    getVolunteerCashBalances(),
    getVolunteers(),
    getCurrencies(),
    getBankAccounts(),
  ]);

  return (
    <CashClient
      balances={balances}
      volunteers={volunteers}
      currencies={currencies}
      bankAccounts={bankAccounts}
    />
  );
}

export default function CashPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Cash Management
        </h1>
        <p className="text-muted-foreground">
          Track volunteer cash holdings, transfers, and deposits
        </p>
      </div>
      <Suspense fallback={<Skeleton className="h-96" />}>
        <CashContent />
      </Suspense>
    </div>
  );
}
