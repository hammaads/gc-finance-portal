import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getDonationById } from "@/lib/actions/donations";
import { formatCurrency, formatDate, ledgerTypeLabel } from "@/lib/format";

export default async function DonationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  let donation: Awaited<ReturnType<typeof getDonationById>>;
  try {
    donation = await getDonationById(id);
  } catch {
    notFound();
  }

  const isInKind = donation.type === "donation_in_kind";

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/protected/donations">
            <ArrowLeft className="size-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Donation Detail</h1>
          <p className="text-muted-foreground">Record ID: {donation.id}</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {ledgerTypeLabel(donation.type)}
            {donation.deleted_at ? <Badge variant="destructive">VOID</Badge> : <Badge variant="outline">Active</Badge>}
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <p>
            <span className="text-muted-foreground">Date: </span>
            {formatDate(donation.date)}
          </p>
          <p>
            <span className="text-muted-foreground">Donor: </span>
            {donation.donors?.name ?? "-"}
          </p>
          <p>
            <span className="text-muted-foreground">Method: </span>
            {ledgerTypeLabel(donation.type)}
          </p>
          <p>
            <span className="text-muted-foreground">Cause: </span>
            {donation.causes?.name ?? "-"}
          </p>
          <p>
            <span className="text-muted-foreground">Recipient: </span>
            {isInKind
              ? donation.custodian?.name ?? "-"
              : donation.type === "donation_bank"
                ? donation.bank_accounts?.account_name ?? "-"
                : donation.to_user?.name ?? "-"}
          </p>
          <p>
            <span className="text-muted-foreground">Amount: </span>
            {isInKind
              ? `${donation.item_name ?? "-"} x ${donation.quantity ?? 0}`
              : formatCurrency(donation.amount, donation.currencies?.symbol)}
          </p>
          <p className="md:col-span-2">
            <span className="text-muted-foreground">Notes: </span>
            {donation.description ?? "-"}
          </p>
          {donation.void_reason && (
            <p className="md:col-span-2">
              <span className="text-muted-foreground">Void reason: </span>
              {donation.void_reason}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
