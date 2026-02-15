import { Suspense } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { notFound } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { getVolunteerTransactions, getVolunteerCashBalances } from "@/lib/actions/cash";
import { formatCurrency } from "@/lib/format";
import { VolunteerTransactionsClient } from "./volunteer-transactions-client";

async function VolunteerDetailContent({ volunteerId }: { volunteerId: string }) {
  const data = await getVolunteerTransactions(volunteerId);
  if (!data) notFound();

  const balances = await getVolunteerCashBalances();
  const volunteerBalance = balances.find((b) => b.id === volunteerId);

  return (
    <div className="space-y-6">
      {/* Volunteer Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/protected/cash">
            <ArrowLeft className="size-4" />
            <span className="sr-only">Back</span>
          </Link>
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-semibold tracking-tight">
            {data.volunteer.name}
          </h1>
          <p className="text-muted-foreground">
            Transaction history for this volunteer
          </p>
        </div>
        <div className="text-right">
          <p className="text-sm text-muted-foreground">Current Balance</p>
          <p className="text-2xl font-bold">
            {formatCurrency(volunteerBalance?.balance_pkr ?? 0)}
          </p>
        </div>
      </div>

      {/* Transaction History */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Transaction History</h3>
        <VolunteerTransactionsClient
          transactions={data.transactions}
          volunteerId={volunteerId}
        />
      </div>
    </div>
  );
}

export default async function VolunteerTransactionsPage({
  params,
}: {
  params: Promise<{ volunteerId: string }>;
}) {
  const { volunteerId } = await params;

  return (
    <Suspense
      fallback={
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <Skeleton className="size-10 rounded-md" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-8 w-48" />
              <Skeleton className="h-4 w-64" />
            </div>
            <div className="space-y-2 text-right">
              <Skeleton className="h-4 w-24 ml-auto" />
              <Skeleton className="h-8 w-32 ml-auto" />
            </div>
          </div>
          <Skeleton className="h-96" />
        </div>
      }
    >
      <VolunteerDetailContent volunteerId={volunteerId} />
    </Suspense>
  );
}
