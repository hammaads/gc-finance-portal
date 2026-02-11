import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { getBankAccountBalances } from "@/lib/actions/bank-accounts";
import { getCurrencies } from "@/lib/actions/settings";
import { BankAccountsClient } from "./bank-accounts-client";

async function BankAccountsContent() {
  const [balances, currencies] = await Promise.all([
    getBankAccountBalances(),
    getCurrencies(),
  ]);

  return <BankAccountsClient balances={balances} currencies={currencies} />;
}

export default function BankAccountsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Bank Accounts
        </h1>
        <p className="text-muted-foreground">
          Manage bank accounts and view balances
        </p>
      </div>
      <Suspense fallback={<Skeleton className="h-96" />}>
        <BankAccountsContent />
      </Suspense>
    </div>
  );
}
