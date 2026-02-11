"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, FileText } from "lucide-react";
import { ledgerTypeLabel } from "@/lib/format";

interface ReportsClientProps {
  donations: any[];
  expenses: any[];
  bankBalances: any[];
  driveSummaries: any[];
}

function downloadCSV(filename: string, headers: string[], rows: string[][]) {
  const csvContent = [
    headers.join(","),
    ...rows.map((row) =>
      row.map((cell) => `"${String(cell ?? "").replace(/"/g, '""')}"`).join(",")
    ),
  ].join("\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
  URL.revokeObjectURL(link.href);
}

export function ReportsClient({
  donations,
  expenses,
  bankBalances,
  driveSummaries,
}: ReportsClientProps) {
  const exportDonationsCSV = () => {
    const headers = ["Date", "Donor", "Type", "Amount", "Currency", "PKR Value", "Cause", "Description"];
    const rows = donations.map((d: any) => [
      d.date,
      d.donors?.name ?? "",
      ledgerTypeLabel(d.type),
      d.amount,
      d.currencies?.code ?? "",
      d.amount_pkr,
      d.causes?.name ?? "",
      d.description ?? "",
    ]);
    downloadCSV("donations.csv", headers, rows);
  };

  const exportExpensesCSV = () => {
    const headers = ["Date", "Category", "Type", "Amount", "Currency", "PKR Value", "Cause", "Description"];
    const rows = expenses.map((e: any) => [
      e.date,
      e.expense_categories?.name ?? "",
      ledgerTypeLabel(e.type),
      e.amount,
      e.currencies?.code ?? "",
      e.amount_pkr,
      e.causes?.name ?? "",
      e.description ?? "",
    ]);
    downloadCSV("expenses.csv", headers, rows);
  };

  const exportBankBalancesCSV = () => {
    const headers = ["Account", "Bank", "Currency", "Opening Balance", "Deposits", "Withdrawals", "Balance"];
    const rows = bankBalances.map((b: any) => [
      b.account_name,
      b.bank_name,
      b.currency_code,
      b.opening_balance,
      b.total_deposits,
      b.total_withdrawals,
      b.balance,
    ]);
    downloadCSV("bank_balances.csv", headers, rows);
  };

  const exportDriveSummariesCSV = () => {
    const headers = ["Drive", "Type", "Date", "Location", "Headcount", "Budget", "Spent", "Remaining", "Donations"];
    const rows = driveSummaries.map((d: any) => [
      d.cause_name,
      d.type,
      d.date ?? "",
      d.location ?? "",
      d.expected_headcount ?? "",
      d.total_budget_pkr,
      d.total_spent_pkr,
      d.remaining_budget_pkr,
      d.total_donations_pkr,
    ]);
    downloadCSV("drive_summaries.csv", headers, rows);
  };

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Donations
          </CardTitle>
          <CardDescription>
            {donations.length} donation records
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={exportDonationsCSV} className="w-full">
            <FileText className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Expenses
          </CardTitle>
          <CardDescription>
            {expenses.length} expense records
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={exportExpensesCSV} className="w-full">
            <FileText className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Bank Balances
          </CardTitle>
          <CardDescription>
            {bankBalances.length} bank accounts
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={exportBankBalancesCSV} className="w-full">
            <FileText className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Drive Summaries
          </CardTitle>
          <CardDescription>
            {driveSummaries.length} drives/causes
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={exportDriveSummariesCSV} className="w-full">
            <FileText className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
