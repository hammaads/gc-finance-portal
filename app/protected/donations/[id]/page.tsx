import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getDonationById } from "@/lib/actions/donations";
import { formatCurrency, formatDate } from "@/lib/format";
import { DonationDetailActions } from "./donation-detail-actions";

export default async function DonationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const donation = await getDonationById(id);
  if (!donation) notFound();

  const isInKind = donation.type === "donation_in_kind";
  const isVoided = !!(donation as { deleted_at?: string | null }).deleted_at;
  const voidReason = (donation as { void_reason?: string | null }).void_reason;
  const methodLabel =
    donation.type === "donation_bank"
      ? "Bank"
      : donation.type === "donation_cash"
        ? "Cash"
        : "In-Kind";
  const recipient = isInKind
    ? (donation.custodian as { name: string } | null)?.name ?? "-"
    : donation.type === "donation_bank"
      ? (donation.bank_accounts as { account_name: string } | null)?.account_name ?? "-"
      : (donation.to_user as { name: string } | null)?.name ?? "-";
  const pkrValue = Number(donation.amount) * Number(donation.exchange_rate_to_pkr);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/protected/donations">
            <ArrowLeft className="size-4" />
            <span className="sr-only">Back to Donations</span>
          </Link>
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-semibold tracking-tight">
            Donation details
          </h1>
          <p className="text-muted-foreground">
            {formatDate(donation.date)} · {(donation.donors as { name: string } | null)?.name ?? "Unknown donor"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {isVoided && (
            <Badge variant="secondary">VOID</Badge>
          )}
          <Badge variant={donation.type === "donation_bank" ? "default" : "outline"}>
            {methodLabel}
          </Badge>
          <DonationDetailActions donationId={id} isVoided={isVoided} />
        </div>
      </div>
      {isVoided && voidReason && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/30 p-4">
          <p className="text-sm font-medium text-amber-800 dark:text-amber-200">Void reason</p>
          <p className="mt-1 text-sm text-amber-700 dark:text-amber-300">{voidReason}</p>
        </div>
      )}

      <div className="rounded-lg border bg-card p-6 space-y-4">
        <dl className="grid gap-4 sm:grid-cols-2">
          <div>
            <dt className="text-sm font-medium text-muted-foreground">Date</dt>
            <dd className="mt-1">{formatDate(donation.date)}</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-muted-foreground">Donor</dt>
            <dd className="mt-1">{(donation.donors as { name: string } | null)?.name ?? "-"}</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-muted-foreground">Method</dt>
            <dd className="mt-1">{methodLabel}</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-muted-foreground">
              {isInKind ? "Item / Quantity" : "Amount"}
            </dt>
            <dd className="mt-1">
              {isInKind
                ? `${donation.item_name ?? "-"} × ${Number(donation.quantity ?? 0)}`
                : `${(donation.currencies as { code: string; symbol: string } | null)?.symbol ?? ""} ${Number(donation.amount)}`}
            </dd>
          </div>
          {!isInKind && (
            <div>
              <dt className="text-sm font-medium text-muted-foreground">PKR value</dt>
              <dd className="mt-1">{formatCurrency(pkrValue, "Rs")}</dd>
            </div>
          )}
          <div>
            <dt className="text-sm font-medium text-muted-foreground">Received by / Recipient</dt>
            <dd className="mt-1">{recipient}</dd>
          </div>
          {(donation.causes as { name: string } | null)?.name && (
            <div>
              <dt className="text-sm font-medium text-muted-foreground">Cause</dt>
              <dd className="mt-1">{(donation.causes as { name: string }).name}</dd>
            </div>
          )}
          {isInKind && donation.item_name && (
            <div className="sm:col-span-2">
              <dt className="text-sm font-medium text-muted-foreground">Linked inventory</dt>
              <dd className="mt-1">
                This in-kind donation adds to inventory: <strong>{donation.item_name}</strong> (+{Number(donation.quantity ?? 0)}).
              </dd>
            </div>
          )}
        </dl>
        {donation.description && (
          <div>
            <dt className="text-sm font-medium text-muted-foreground">Notes</dt>
            <dd className="mt-1 whitespace-pre-wrap">{donation.description}</dd>
          </div>
        )}
      </div>
    </div>
  );
}

