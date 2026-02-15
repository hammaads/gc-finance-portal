import { Suspense } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { notFound } from "next/navigation";
import { getDonor, getDonorDonations } from "@/lib/actions/donors";
import { formatCurrency, formatDate, ledgerTypeLabel } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

async function DonorDetail({ id }: { id: string }) {
  let donor;
  try {
    donor = await getDonor(id);
  } catch {
    notFound();
  }

  const donations = await getDonorDonations(id);

  return (
    <>
      <div className="rounded-lg border bg-card p-6 text-card-foreground shadow-sm">
        <h2 className="text-xl font-semibold">{donor.name}</h2>
        <div className="mt-2 flex flex-wrap gap-x-6 gap-y-1 text-sm text-muted-foreground">
          <span>Phone: {donor.phone ?? "-"}</span>
          <span>Email: {donor.email ?? "-"}</span>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Donation History</h3>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Type</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead>Currency</TableHead>
                <TableHead>Cause</TableHead>
                <TableHead>Bank / Volunteer</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {donations.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="text-center text-muted-foreground py-8"
                  >
                    No donations found for this donor.
                  </TableCell>
                </TableRow>
              ) : (
                donations.map((donation) => (
                  <TableRow key={donation.id}>
                    <TableCell>{formatDate(donation.date)}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {ledgerTypeLabel(donation.type)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {donation.type === "donation_in_kind"
                        ? `${donation.item_name} ×${donation.quantity}`
                        : formatCurrency(
                            donation.amount,
                            donation.currencies?.symbol,
                          )}
                    </TableCell>
                    <TableCell>{donation.type === "donation_in_kind" ? "-" : donation.currencies?.code ?? "-"}</TableCell>
                    <TableCell>{donation.causes?.name ?? "-"}</TableCell>
                    <TableCell>
                      {donation.type === "donation_in_kind"
                        ? donation.custodian?.name ?? "-"
                        : donation.bank_accounts?.account_name ??
                          donation.to_user?.name ??
                          "-"}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </>
  );
}

export default function DonorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <Suspense
      fallback={
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <Skeleton className="size-10 rounded-md" />
            <div className="space-y-2">
              <Skeleton className="h-8 w-48" />
              <Skeleton className="h-4 w-64" />
            </div>
          </div>
          <Skeleton className="h-28" />
          <Skeleton className="h-64" />
        </div>
      }
    >
      <DonorPageInner params={params} />
    </Suspense>
  );
}

async function DonorPageInner({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/protected/donors">
            <ArrowLeft />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Donor Details
          </h1>
          <p className="text-muted-foreground">
            View donor information and donation history
          </p>
        </div>
      </div>
      <DonorDetail id={id} />
    </div>
  );
}
