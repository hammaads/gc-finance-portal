"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Calendar,
  CheckCircle2,
  Loader2,
  MapPin,
  Search,
  Users,
  XCircle,
} from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/format";
import { verifyDonation } from "@/lib/actions/transparency";
import { toast } from "sonner";

type DriveSummary = {
  cause_name: string;
  drive_date: string | null;
  location: string | null;
  expected_headcount: number | null;
  total_budget_pkr: number;
  total_spent_pkr: number;
  remaining_budget_pkr: number;
  total_donations_pkr: number;
};

type VerificationResult = {
  found: boolean;
  date?: string;
  amount?: number;
  currency_symbol?: string;
  cause_name?: string | null;
  error?: string;
};

export function TransparencyClient({
  summaries,
}: {
  summaries: DriveSummary[];
}) {
  const [txRef, setTxRef] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [result, setResult] = useState<VerificationResult | null>(null);

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    if (!txRef.trim()) return;

    setVerifying(true);
    setResult(null);

    try {
      const res = await verifyDonation(txRef);
      setResult(res);
    } catch {
      toast.error("Verification failed. Please try again.");
    } finally {
      setVerifying(false);
    }
  }

  return (
    <div className="space-y-10">
      {/* Drive Summaries */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Drive Summaries</h2>
        {summaries.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              No drive data available yet.
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {summaries.map((s) => (
              <Card key={s.cause_name}>
                <CardHeader>
                  <CardTitle className="text-base">{s.cause_name}</CardTitle>
                  <CardDescription className="flex flex-wrap gap-3 text-xs">
                    {s.drive_date && (
                      <span className="flex items-center gap-1">
                        <Calendar className="size-3" />
                        {formatDate(s.drive_date)}
                      </span>
                    )}
                    {s.location && (
                      <span className="flex items-center gap-1">
                        <MapPin className="size-3" />
                        {s.location}
                      </span>
                    )}
                    {s.expected_headcount && (
                      <span className="flex items-center gap-1">
                        <Users className="size-3" />
                        {s.expected_headcount.toLocaleString()}
                      </span>
                    )}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-muted-foreground">Donations</p>
                      <p className="font-semibold">
                        {formatCurrency(s.total_donations_pkr)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Budget</p>
                      <p className="font-semibold">
                        {formatCurrency(s.total_budget_pkr)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Spent</p>
                      <p className="font-semibold">
                        {formatCurrency(s.total_spent_pkr)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Remaining</p>
                      <p className="font-semibold">
                        {formatCurrency(s.remaining_budget_pkr)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>

      {/* Donation Verification */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Verify Your Donation</h2>
        <Card>
          <CardContent className="pt-6">
            <form onSubmit={handleVerify} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="tx-ref">
                  Bank Transaction Reference (Raast Tx ID)
                </Label>
                <div className="flex gap-2">
                  <Input
                    id="tx-ref"
                    placeholder="e.g. SADAPKKA202602..."
                    value={txRef}
                    onChange={(e) => {
                      setTxRef(e.target.value);
                      setResult(null);
                    }}
                    maxLength={50}
                    className="font-mono"
                  />
                  <Button type="submit" disabled={verifying || !txRef.trim()}>
                    {verifying ? (
                      <Loader2 className="mr-2 size-4 animate-spin" />
                    ) : (
                      <Search className="mr-2 size-4" />
                    )}
                    {verifying ? "Checking..." : "Verify"}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Enter the transaction reference from your bank statement or
                  SMS to confirm your donation was received.
                </p>
              </div>
            </form>

            {result && (
              <div className="mt-4">
                {result.error ? (
                  <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
                    {result.error}
                  </div>
                ) : result.found ? (
                  <div className="rounded-lg border border-green-500/50 bg-green-500/10 p-4">
                    <div className="mb-2 flex items-center gap-2">
                      <CheckCircle2 className="size-5 text-green-600" />
                      <span className="font-semibold text-green-700 dark:text-green-400">
                        Donation Verified
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="text-muted-foreground">Amount: </span>
                        <span className="font-medium">
                          {result.currency_symbol}{" "}
                          {result.amount?.toLocaleString()}
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Date: </span>
                        <span className="font-medium">
                          {result.date ? formatDate(result.date) : "N/A"}
                        </span>
                      </div>
                      {result.cause_name && (
                        <div className="col-span-2">
                          <span className="text-muted-foreground">Drive: </span>
                          <span className="font-medium">
                            {result.cause_name}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="rounded-lg border border-amber-500/50 bg-amber-500/10 p-4">
                    <div className="flex items-center gap-2">
                      <XCircle className="size-5 text-amber-600" />
                      <span className="font-medium text-amber-700 dark:text-amber-400">
                        No matching donation found
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Please double-check your transaction reference. If this
                      issue persists, contact the team.
                    </p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
