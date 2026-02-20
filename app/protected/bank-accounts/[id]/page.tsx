import { Suspense } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  getBankAccountBalances,
  getBankAccountStatement,
} from "@/lib/actions/bank-accounts";
import { formatCurrency, formatDate, ledgerTypeLabel } from "@/lib/format";

async function AccountStatementContent({
  accountId,
}: {
  accountId: string;
}) {
  const [balances, statement] = await Promise.all([
    getBankAccountBalances(),
    getBankAccountStatement(accountId),
  ]);

  const account = balances.find((b) => b.id === accountId);

  if (!account) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        Account not found.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Account Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/protected/bank-accounts">
            <ArrowLeft className="size-4" />
            <span className="sr-only">Back</span>
          </Link>
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-semibold tracking-tight">
            {account.account_name}
          </h1>
          <p className="text-muted-foreground">{account.bank_name}</p>
        </div>
        <div className="text-right">
          <p className="text-sm text-muted-foreground">Current Balance</p>
          <p className="text-2xl font-bold">
            {formatCurrency(
              account.balance ?? 0,
              account.currency_symbol ?? undefined,
            )}
          </p>
        </div>
      </div>

      {/* Statement Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Description</TableHead>
              <TableHead className="text-right">Amount</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {statement.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={4}
                  className="text-center text-muted-foreground py-8"
                >
                  No transactions found for this account.
                </TableCell>
              </TableRow>
            ) : (
              statement.map((entry) => {
                const isDeposit =
                  entry.type === "donation_bank" ||
                  entry.type === "cash_deposit";

                return (
                  <TableRow key={entry.id}>
                    <TableCell>{formatDate(entry.date)}</TableCell>
                    <TableCell>
                      <Badge variant={isDeposit ? "default" : "secondary"}>
                        {ledgerTypeLabel(entry.type)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {(entry as { item_name?: string | null }).item_name ??
                        entry.description ??
                        [
                          entry.donors?.name,
                          entry.causes?.name,
                          entry.expense_categories?.name,
                        ]
                          .filter(Boolean)
                          .join(" - ") ??
                        "-"}
                    </TableCell>
                    <TableCell
                      className={`text-right font-medium ${
                        isDeposit ? "text-green-600" : "text-red-600"
                      }`}
                    >
                      {isDeposit ? "+" : "-"}
                      {formatCurrency(
                        entry.amount,
                        entry.currencies?.symbol ?? undefined,
                      )}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

export default function BankAccountStatementPage({
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
            <div className="flex-1 space-y-2">
              <Skeleton className="h-8 w-48" />
              <Skeleton className="h-4 w-32" />
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
      <BankAccountStatementInner params={params} />
    </Suspense>
  );
}

async function BankAccountStatementInner({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <AccountStatementContent accountId={id} />;
}
