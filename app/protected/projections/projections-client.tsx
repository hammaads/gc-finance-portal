"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDate } from "@/lib/format";

type BankBalance = {
  balance?: number | null;
};

type CashBalance = {
  balance_pkr?: number;
};

type DriveSummary = {
  cause_id: string | null;
  cause_name: string | null;
  date: string | null;
  total_budget_pkr: number | null;
  total_spent_pkr: number | null;
  remaining_budget_pkr: number | null;
};

interface ProjectionsClientProps {
  bankBalances: BankBalance[];
  cashBalances: CashBalance[];
  driveSummaries: DriveSummary[];
}

export function ProjectionsClient({
  bankBalances,
  cashBalances,
  driveSummaries,
}: ProjectionsClientProps) {
  const [excludedDrives, setExcludedDrives] = useState<Set<string>>(new Set());

  const totalBankFunds = bankBalances.reduce(
    (sum: number, b: BankBalance) => sum + (b.balance ?? 0),
    0
  );
  const totalCashFunds = cashBalances.reduce(
    (sum: number, c: CashBalance) => sum + (c.balance_pkr ?? 0),
    0
  );
  const currentBalance = totalBankFunds + totalCashFunds;

  const upcomingDrives = driveSummaries.filter(
    (d: DriveSummary) => d.date && new Date(d.date) >= new Date()
  );

  const toggleDrive = (id: string) => {
    setExcludedDrives((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Build runway table
  let runningBalance = currentBalance;
  const runwayData = upcomingDrives.map((drive: DriveSummary) => {
    const included = drive.cause_id ? !excludedDrives.has(drive.cause_id) : true;
    const remainingBudget = drive.remaining_budget_pkr ?? 0;
    const cost = included ? remainingBudget : 0;
    runningBalance -= cost;

    return {
      ...drive,
      included,
      remainingCost: remainingBudget,
      balanceAfter: runningBalance,
    };
  });

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Current Available Funds</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">{formatCurrency(currentBalance)}</div>
          <p className="text-sm text-muted-foreground mt-1">
            Bank: {formatCurrency(totalBankFunds)} | Cash: {formatCurrency(totalCashFunds)}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Drive Runway</CardTitle>
        </CardHeader>
        <CardContent>
          {upcomingDrives.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No upcoming drives to project.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Include</TableHead>
                  <TableHead>Drive</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Total Budget</TableHead>
                  <TableHead className="text-right">Already Spent</TableHead>
                  <TableHead className="text-right">Remaining Cost</TableHead>
                  <TableHead className="text-right">Balance After</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow className="bg-muted/50 font-medium">
                  <TableCell />
                  <TableCell>Starting Balance</TableCell>
                  <TableCell>Today</TableCell>
                  <TableCell />
                  <TableCell />
                  <TableCell />
                  <TableCell className="text-right">
                    {formatCurrency(currentBalance)}
                  </TableCell>
                </TableRow>
                {runwayData.map((drive) => (
                  <TableRow
                    key={drive.cause_id}
                    className={!drive.included ? "opacity-50" : ""}
                  >
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={drive.included}
                          onCheckedChange={() => drive.cause_id && toggleDrive(drive.cause_id)}
                        />
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">
                      {drive.cause_name}
                    </TableCell>
                    <TableCell>
                      {drive.date ? formatDate(drive.date) : "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(drive.total_budget_pkr ?? 0)}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(drive.total_spent_pkr ?? 0)}
                    </TableCell>
                    <TableCell className="text-right">
                      {drive.included
                        ? formatCurrency(drive.remainingCost)
                        : "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge
                        variant={
                          drive.balanceAfter < 0 ? "destructive" : "default"
                        }
                      >
                        {formatCurrency(drive.balanceAfter)}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
