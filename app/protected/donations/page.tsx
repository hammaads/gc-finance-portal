import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { getDonations } from "@/lib/actions/donations";
import { getDonors } from "@/lib/actions/donors";
import { getCurrencies } from "@/lib/actions/settings";
import { getBankAccounts } from "@/lib/actions/bank-accounts";
import { getCauses } from "@/lib/actions/causes";
import { getProfiles } from "@/lib/actions/cash";
import { DonationsClient } from "./donations-client";

async function DonationsContent() {
  const [donations, donors, currencies, bankAccounts, causes, profiles] =
    await Promise.all([
      getDonations(),
      getDonors(),
      getCurrencies(),
      getBankAccounts(),
      getCauses(),
      getProfiles(),
    ]);

  return (
    <DonationsClient
      donations={donations}
      donors={donors}
      currencies={currencies}
      bankAccounts={bankAccounts}
      causes={causes}
      profiles={profiles}
    />
  );
}

export default function DonationsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Donations</h1>
        <p className="text-muted-foreground">
          Track and manage incoming donations
        </p>
      </div>
      <Suspense fallback={<Skeleton className="h-96" />}>
        <DonationsContent />
      </Suspense>
    </div>
  );
}
