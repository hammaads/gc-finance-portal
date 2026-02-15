"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  Landmark,
  Wallet,
  TrendingUp,
  HandCoins,
  Calendar,
  MapPin,
} from "lucide-react";
import { formatCurrency, formatDate, ledgerTypeLabel } from "@/lib/format";
import { AddDonationDialog } from "./donations/donations-client";
import { AddExpenseDialog } from "./expenses/expenses-client";

type BankBalance = {
  balance?: number | null;
  currency_code?: string | null;
  currency_symbol?: string | null;
};

type CashBalance = {
  balance_pkr?: number;
};

type DriveSummary = {
  cause_id?: string;
  cause_name?: string;
  date?: string | null;
  location?: string | null;
  total_budget_pkr?: number;
  total_spent_pkr?: number;
  remaining_budget_pkr?: number;
  total_donations_pkr?: number;
};

type RecentEntry = {
  id: string;
  type?: string;
  amount_pkr?: number;
  date: string;
  currencies?: {
    symbol?: string;
  };
  amount?: number;
};

type Donor = {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
};

type Currency = {
  id: string;
  code: string;
  name: string;
  symbol: string;
  exchange_rate_to_pkr: number;
  is_base: boolean;
};

type BankAccount = {
  id: string;
  account_name: string;
  bank_name: string;
  currency_id: string;
  currencies: { code: string; symbol: string; exchange_rate_to_pkr: number } | null;
};

type Cause = {
  id: string;
  name: string;
  type: string;
};

type Volunteer = {
  id: string;
  name: string;
};

type ExpenseCategory = {
  id: string;
  name: string;
};

interface DashboardContentProps {
  bankBalances: BankBalance[];
  cashBalances: CashBalance[];
  driveSummaries: DriveSummary[];
  recentEntries: RecentEntry[];
  donors: Donor[];
  currencies: Currency[];
  bankAccounts: BankAccount[];
  causes: Cause[];
  volunteers: Volunteer[];
  expenseCategories: ExpenseCategory[];
  itemNames: string[];
  receiptRequired: boolean;
}

export function DashboardContent({
  bankBalances,
  cashBalances,
  driveSummaries,
  recentEntries,
  donors,
  currencies,
  bankAccounts,
  causes,
  volunteers,
  expenseCategories,
  itemNames,
  receiptRequired,
}: DashboardContentProps) {
  const totalBankFunds = bankBalances.reduce(
    (sum: number, b: BankBalance) => sum + (b.balance ?? 0) * (b.currency_code === "PKR" ? 1 : 1),
    0
  );
  const totalCashFunds = cashBalances.reduce(
    (sum: number, c: CashBalance) => sum + (c.balance_pkr ?? 0),
    0
  );
  const totalFunds = totalBankFunds + totalCashFunds;

  const totalDonations = recentEntries
    .filter((e: RecentEntry) => e.type?.startsWith("donation_"))
    .reduce((sum: number, e: RecentEntry) => sum + (e.amount_pkr ?? 0), 0);

  const upcomingDrives = driveSummaries.filter(
    (d: DriveSummary) => d.date && new Date(d.date) >= new Date()
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Financial overview for Grand Citizens
          </p>
        </div>
        <div className="flex gap-2">
          <AddDonationDialog
            donors={donors}
            currencies={currencies}
            bankAccounts={bankAccounts}
            causes={causes}
            volunteers={volunteers}
          />
          <AddExpenseDialog
            categories={expenseCategories}
            currencies={currencies}
            bankAccounts={bankAccounts}
            causes={causes}
            volunteers={volunteers}
            itemNames={itemNames}
            receiptRequired={receiptRequired}
          />
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Funds</CardTitle>
            <Landmark className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalFunds)}</div>
            <p className="text-xs text-muted-foreground">
              Bank: {formatCurrency(totalBankFunds)} | Cash: {formatCurrency(totalCashFunds)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Bank Accounts</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{bankBalances.length}</div>
            <p className="text-xs text-muted-foreground">
              {bankBalances.map((b: BankBalance) => `${b.currency_symbol ?? ""} ${(b.balance ?? 0).toLocaleString()}`).join(" | ") || "No accounts"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Recent Donations</CardTitle>
            <HandCoins className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalDonations)}</div>
            <p className="text-xs text-muted-foreground">From latest entries</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Upcoming Drives</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{upcomingDrives.length}</div>
            <p className="text-xs text-muted-foreground">
              {upcomingDrives.length > 0
                ? `Next: ${upcomingDrives[0]?.cause_name}`
                : "No upcoming drives"}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Upcoming Drives */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Upcoming Drives</CardTitle>
          </CardHeader>
          <CardContent>
            {upcomingDrives.length === 0 ? (
              <p className="text-sm text-muted-foreground">No upcoming drives scheduled.</p>
            ) : (
              <div className="space-y-4">
                {upcomingDrives.slice(0, 5).map((drive: DriveSummary) => (
                  <Link
                    key={drive.cause_id}
                    href={`/protected/drives/${drive.cause_id}`}
                    className="block rounded-lg border p-3 hover:bg-accent transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{drive.cause_name}</span>
                      <Badge variant="outline">
                        {formatCurrency(drive.total_budget_pkr ?? 0)}
                      </Badge>
                    </div>
                    <div className="mt-1 flex gap-4 text-xs text-muted-foreground">
                      {drive.date && (
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {formatDate(drive.date)}
                        </span>
                      )}
                      {drive.location && (
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {drive.location}
                        </span>
                      )}
                    </div>
                    <div className="mt-2 flex gap-4 text-xs">
                      <span>Budget: {formatCurrency(drive.total_budget_pkr ?? 0)}</span>
                      <span>Spent: {formatCurrency(drive.total_spent_pkr ?? 0)}</span>
                      <span>Donations: {formatCurrency(drive.total_donations_pkr ?? 0)}</span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            {recentEntries.length === 0 ? (
              <p className="text-sm text-muted-foreground">No transactions yet.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentEntries.map((entry: RecentEntry) => (
                    <TableRow key={entry.id}>
                      <TableCell className="text-sm">
                        {formatDate(entry.date)}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={entry.type?.startsWith("donation") ? "default" : "secondary"}
                        >
                          {ledgerTypeLabel(entry.type ?? "")}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right text-sm">
                        {entry.currencies?.symbol} {entry.amount?.toLocaleString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
