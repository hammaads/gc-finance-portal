import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { getDonations } from "@/lib/actions/donations";
import { getDonors } from "@/lib/actions/donors";
import { getCurrencies } from "@/lib/actions/settings";
import { getBankAccounts } from "@/lib/actions/bank-accounts";
import { getCauses } from "@/lib/actions/causes";
import { getVolunteers } from "@/lib/actions/volunteers";
import { getItemNameSuggestions } from "@/lib/actions/expenses";
import { DonationsClient } from "./donations-client";

async function DonationsContent({ showVoided }: { showVoided: boolean }) {
  const [donations, donors, currencies, bankAccounts, causes, volunteers, itemNames] =
    await Promise.all([
      getDonations({ includeVoided: showVoided }),
      getDonors(),
      getCurrencies(),
      getBankAccounts(),
      getCauses(),
      getVolunteers(),
      getItemNameSuggestions(),
    ]);

  return (
    <DonationsClient
      donations={donations}
      donors={donors}
      currencies={currencies}
      bankAccounts={bankAccounts}
      causes={causes}
      volunteers={volunteers}
      itemNames={itemNames}
      showVoided={showVoided}
    />
  );
}

export default async function DonationsPage({
  searchParams,
}: {
  searchParams: Promise<{ showVoided?: string }>;
}) {
  const { showVoided } = await searchParams;
  const includeVoided = showVoided === "1";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Donations</h1>
        <p className="text-muted-foreground">
          Track and manage incoming donations
        </p>
      </div>
      <Suspense fallback={<Skeleton className="h-96" />}>
        <DonationsContent showVoided={includeVoided} />
      </Suspense>
    </div>
  );
}
