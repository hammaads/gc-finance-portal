"use client";

import { useState, useMemo, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Progress } from "@/components/ui/progress";
import { Landmark, CalendarDays, CircleDollarSign, PiggyBank, Users } from "lucide-react";
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

type TemplateItem = {
  type: "variable" | "fixed";
  description: string;
  people_per_unit?: number;
  price_per_unit: number;
  currency_id: string;
  category_id: string;
};

type DriveTemplate = {
  id: string;
  name: string;
  template_data: { items: TemplateItem[] } | null;
};

interface ProjectionsClientProps {
  bankBalances: BankBalance[];
  cashBalances: CashBalance[];
  driveSummaries: DriveSummary[];
  driveTemplates: DriveTemplate[];
}

export function ProjectionsClient({
  bankBalances,
  cashBalances,
  driveSummaries,
  driveTemplates,
}: ProjectionsClientProps) {
  const [excludedDrives, setExcludedDrives] = useState<Set<string>>(new Set());
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("");
  const [headcount, setHeadcount] = useState<number>(150);
  const [mounted, setMounted] = useState(false);

  // Set initial template and mounted state after mount to avoid hydration mismatch
  useEffect(() => {
    setMounted(true);
    if (driveTemplates.length > 0 && !selectedTemplateId) {
      setSelectedTemplateId(driveTemplates[0].id);
    }
  }, [driveTemplates, selectedTemplateId]);

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

  const committedFunds = upcomingDrives.reduce(
    (sum: number, d: DriveSummary) => sum + Math.max(0, d.remaining_budget_pkr ?? 0),
    0
  );
  const remainingAfterDrives = currentBalance - committedFunds;

  // Drive Planner calculations
  const selectedTemplate = driveTemplates.find((t) => t.id === selectedTemplateId);
  const breakdownItems = useMemo(() => {
    if (!selectedTemplate?.template_data?.items) return [];
    return selectedTemplate.template_data.items.map((item) => {
      const qty =
        item.type === "variable" && item.people_per_unit
          ? Math.ceil(headcount / item.people_per_unit)
          : 1;
      return {
        description: item.description,
        type: item.type,
        qty,
        unitPrice: item.price_per_unit,
        total: qty * item.price_per_unit,
      };
    });
  }, [selectedTemplate, headcount]);

  const costPerDrive = breakdownItems.reduce((sum, item) => sum + item.total, 0);

  const drivesAffordable = costPerDrive > 0 ? Math.floor(remainingAfterDrives / costPerDrive) : 0;
  const fundsAfterPlanned = remainingAfterDrives - drivesAffordable * costPerDrive;
  const usagePercent = remainingAfterDrives > 0
    ? Math.min(100, Math.round(((drivesAffordable * costPerDrive) / remainingAfterDrives) * 100))
    : 0;

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
    const remainingCost = Math.max(0, remainingBudget);
    const cost = included ? remainingCost : 0;
    runningBalance -= cost;

    return {
      ...drive,
      included,
      remainingCost,
      balanceAfter: runningBalance,
    };
  });

  return (
    <div className="space-y-6">
      {/* Summary cards — same layout as Dashboard */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Current Available Funds</CardTitle>
            <Landmark className="h-4 w-4 shrink-0 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(currentBalance)}</div>
            <p className="text-xs text-muted-foreground">
              Bank: {formatCurrency(totalBankFunds)} | Cash: {formatCurrency(totalCashFunds)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Upcoming Drives</CardTitle>
            <CalendarDays className="h-4 w-4 shrink-0 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{upcomingDrives.length}</div>
            <p className="text-xs text-muted-foreground">
              {upcomingDrives.length > 0
                ? `Next: ${upcomingDrives[0]?.cause_name ?? "—"}`
                : "No upcoming drives"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Committed Funds</CardTitle>
            <CircleDollarSign className="h-4 w-4 shrink-0 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(committedFunds)}</div>
            <p className="text-xs text-muted-foreground">
              Remaining costs for {upcomingDrives.length} upcoming drive{upcomingDrives.length !== 1 ? "s" : ""}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Remaining After Drives</CardTitle>
            <PiggyBank className="h-4 w-4 shrink-0 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(remainingAfterDrives)}</div>
            <p className="text-xs text-muted-foreground">
              Available after reserving for upcoming drives
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Drive Planner */}
      <Card>
        <CardHeader>
          <CardTitle>Drive Planner</CardTitle>
          <CardDescription>See how far your funds can go</CardDescription>
        </CardHeader>
        <CardContent>
          {!mounted ? (
            <div className="h-64 flex items-center justify-center text-sm text-muted-foreground">
              Loading planner...
            </div>
          ) : driveTemplates.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No templates available. Create one in Settings to start planning.
            </p>
          ) : (
            <div className="space-y-6">
              {/* Controls */}
              <div className="grid gap-6 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Template</label>
                  <Select value={selectedTemplateId} onValueChange={setSelectedTemplateId}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select a template" />
                    </SelectTrigger>
                    <SelectContent>
                      {driveTemplates.map((t) => (
                        <SelectItem key={t.id} value={t.id}>
                          {t.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium">Headcount</label>
                    <span className="flex items-center gap-1 text-sm font-semibold">
                      <Users className="h-3.5 w-3.5 text-muted-foreground" />
                      {headcount}
                    </span>
                  </div>
                  <Slider
                    value={[headcount]}
                    onValueChange={(v) => setHeadcount(v[0])}
                    min={50}
                    max={1000}
                    step={10}
                    className="py-2"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>50</span>
                    <span>1,000</span>
                  </div>
                </div>
              </div>

              {/* Results */}
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="rounded-lg bg-muted/50 p-4 space-y-1">
                  <p className="text-xs text-muted-foreground">Cost per Drive</p>
                  <p className="text-xl font-bold">{formatCurrency(costPerDrive)}</p>
                </div>
                <div className="rounded-lg bg-muted/50 p-4 space-y-1">
                  <p className="text-xs text-muted-foreground">Drives You Can Afford</p>
                  <p className="text-xl font-bold">{drivesAffordable}</p>
                </div>
                <div className="rounded-lg bg-muted/50 p-4 space-y-1">
                  <p className="text-xs text-muted-foreground">Funds Remaining</p>
                  <p className="text-xl font-bold">{formatCurrency(fundsAfterPlanned)}</p>
                </div>
              </div>

              {/* Breakdown */}
              {breakdownItems.length > 0 && (
                <div className="rounded-lg border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Item</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead className="text-right">Qty</TableHead>
                        <TableHead className="text-right">Unit Price</TableHead>
                        <TableHead className="text-right">Total</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {breakdownItems.map((item, i) => (
                        <TableRow key={i}>
                          <TableCell className="font-medium">{item.description}</TableCell>
                          <TableCell>
                            <Badge variant={item.type === "variable" ? "default" : "secondary"}>
                              {item.type === "variable" ? "Variable" : "Fixed"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">{item.qty}</TableCell>
                          <TableCell className="text-right">{formatCurrency(item.unitPrice)}</TableCell>
                          <TableCell className="text-right">{formatCurrency(item.total)}</TableCell>
                        </TableRow>
                      ))}
                      <TableRow className="bg-muted/50 font-medium">
                        <TableCell colSpan={4}>Total</TableCell>
                        <TableCell className="text-right">{formatCurrency(costPerDrive)}</TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
              )}

              {/* Usage bar */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>
                    {formatCurrency(drivesAffordable * costPerDrive)} of{" "}
                    {formatCurrency(remainingAfterDrives)} remaining funds
                  </span>
                  <span>{usagePercent}%</span>
                </div>
                <Progress value={usagePercent} />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Drive Runway */}
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
