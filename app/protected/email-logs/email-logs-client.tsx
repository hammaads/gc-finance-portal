"use client";

import { useState, useMemo } from "react";
import { formatDistanceToNow } from "date-fns";
import { Mail, CheckCircle2, Copy, AlertTriangle, Eye } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { formatCurrency } from "@/lib/format";

type EmailImportLog = {
  id: string;
  status: string;
  email_subject: string | null;
  email_body: string | null;
  email_from: string | null;
  parsed_amount: number | null;
  parsed_sender_name: string | null;
  parsed_date: string | null;
  parsed_tx_id: string | null;
  ledger_entry_id: string | null;
  donor_id: string | null;
  bank_account_id: string | null;
  error_message: string | null;
  created_at: string;
  donors: { name: string } | null;
  bank_accounts: { account_name: string; bank_name: string } | null;
  ledger_entries: {
    amount: number;
    amount_pkr: number;
    date: string;
    external_ref: string | null;
  } | null;
};

interface EmailLogsClientProps {
  logs: EmailImportLog[];
}

const statusConfig: Record<
  string,
  { label: string; badgeClass: string; borderClass: string }
> = {
  created: {
    label: "Created",
    badgeClass:
      "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/25 hover:bg-emerald-500/25",
    borderClass: "border-l-emerald-500",
  },
  duplicate: {
    label: "Duplicate",
    badgeClass:
      "bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/25 hover:bg-amber-500/25",
    borderClass: "border-l-amber-500",
  },
  skipped: {
    label: "Skipped",
    badgeClass:
      "bg-muted text-muted-foreground border-muted hover:bg-muted/80",
    borderClass: "border-l-muted-foreground/30",
  },
  error: {
    label: "Error",
    badgeClass:
      "bg-destructive/15 text-destructive border-destructive/25 hover:bg-destructive/25",
    borderClass: "border-l-destructive",
  },
};

function StatusBadge({ status }: { status: string }) {
  const config = statusConfig[status] ?? statusConfig.skipped;
  return (
    <Badge variant="outline" className={config.badgeClass}>
      {config.label}
    </Badge>
  );
}

function RelativeTime({ date }: { date: string }) {
  const absolute = new Date(date).toLocaleString("en-PK", {
    dateStyle: "medium",
    timeStyle: "short",
  });
  const relative = formatDistanceToNow(new Date(date), { addSuffix: true });
  return (
    <span title={absolute} className="text-sm">
      {relative}
    </span>
  );
}

export function EmailLogsClient({ logs }: EmailLogsClientProps) {
  const [filter, setFilter] = useState("all");
  const [selectedLog, setSelectedLog] = useState<EmailImportLog | null>(null);

  const stats = useMemo(() => {
    const created = logs.filter((l) => l.status === "created");
    const duplicates = logs.filter((l) => l.status === "duplicate");
    const errors = logs.filter((l) => l.status === "error");
    const skipped = logs.filter((l) => l.status === "skipped");
    const totalAmount = created.reduce(
      (sum, l) => sum + (l.parsed_amount ?? 0),
      0,
    );
    return {
      total: logs.length,
      created: created.length,
      duplicates: duplicates.length,
      errors: errors.length,
      skipped: skipped.length,
      totalAmount,
    };
  }, [logs]);

  const filteredLogs = useMemo(() => {
    if (filter === "all") return logs;
    return logs.filter((l) => l.status === filter);
  }, [logs, filter]);

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Emails</CardTitle>
            <Mail className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">all time</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Donations Created
            </CardTitle>
            <CheckCircle2 className="size-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.created}</div>
            <p className="text-xs text-muted-foreground">
              {formatCurrency(stats.totalAmount)} total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Duplicates Caught
            </CardTitle>
            <Copy className="size-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.duplicates}</div>
            <p className="text-xs text-muted-foreground">already recorded</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Errors & Skipped
            </CardTitle>
            <AlertTriangle className="size-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.errors + stats.skipped}
            </div>
            <p className="text-xs text-muted-foreground">
              {stats.errors} error{stats.errors !== 1 && "s"},{" "}
              {stats.skipped} skipped
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filter Tabs */}
      <Tabs value={filter} onValueChange={setFilter}>
        <TabsList>
          <TabsTrigger value="all">All ({stats.total})</TabsTrigger>
          <TabsTrigger value="created">Created ({stats.created})</TabsTrigger>
          <TabsTrigger value="duplicate">
            Duplicates ({stats.duplicates})
          </TabsTrigger>
          <TabsTrigger value="skipped">Skipped ({stats.skipped})</TabsTrigger>
          <TabsTrigger value="error">Errors ({stats.errors})</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Activity Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[100px]">Status</TableHead>
              <TableHead className="w-[160px]">Time</TableHead>
              <TableHead>Sender</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead className="w-[180px]">Tx ID</TableHead>
              <TableHead className="w-[70px] text-right">
                <span className="sr-only">Actions</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredLogs.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="text-center text-muted-foreground py-12"
                >
                  <Mail className="mx-auto h-8 w-8 mb-2 opacity-40" />
                  {filter === "all"
                    ? "No emails have been processed yet."
                    : `No ${filter} emails found.`}
                </TableCell>
              </TableRow>
            ) : (
              filteredLogs.map((log) => {
                const config =
                  statusConfig[log.status] ?? statusConfig.skipped;
                return (
                  <TableRow
                    key={log.id}
                    className={`border-l-4 ${config.borderClass} cursor-pointer hover:bg-muted/50`}
                    onClick={() => setSelectedLog(log)}
                  >
                    <TableCell>
                      <StatusBadge status={log.status} />
                    </TableCell>
                    <TableCell>
                      <RelativeTime date={log.created_at} />
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">
                        {log.parsed_sender_name ?? "Unknown"}
                      </div>
                      {log.email_from && (
                        <div className="text-xs text-muted-foreground truncate max-w-[200px]">
                          {log.email_from}
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {log.parsed_amount
                        ? formatCurrency(log.parsed_amount)
                        : "\u2014"}
                    </TableCell>
                    <TableCell>
                      {log.parsed_tx_id ? (
                        <code className="text-xs font-mono truncate block max-w-[160px]">
                          {log.parsed_tx_id}
                        </code>
                      ) : (
                        <span className="text-muted-foreground">{"\u2014"}</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedLog(log);
                        }}
                      >
                        <Eye className="size-4" />
                        <span className="sr-only">View</span>
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Detail Sheet */}
      <Sheet
        open={!!selectedLog}
        onOpenChange={(open) => !open && setSelectedLog(null)}
      >
        <SheetContent className="sm:max-w-lg overflow-y-auto">
          {selectedLog && (
            <>
              <SheetHeader className="space-y-2">
                <div className="flex items-center gap-2">
                  <StatusBadge status={selectedLog.status} />
                  <span className="text-sm text-muted-foreground">
                    {new Date(selectedLog.created_at).toLocaleString("en-PK", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })}
                  </span>
                </div>
                <SheetTitle>
                  {selectedLog.email_subject ?? "Email Import Details"}
                </SheetTitle>
              </SheetHeader>

              <div className="mt-6 space-y-6">
                {/* Parsed Data */}
                {(selectedLog.status === "created" ||
                  selectedLog.status === "duplicate") && (
                  <Card>
                    <CardContent className="pt-6">
                      <dl className="space-y-3 text-sm">
                        <div className="flex justify-between">
                          <dt className="text-muted-foreground">
                            Sender Name
                          </dt>
                          <dd className="font-medium">
                            {selectedLog.parsed_sender_name ?? "\u2014"}
                          </dd>
                        </div>
                        <div className="flex justify-between">
                          <dt className="text-muted-foreground">Amount</dt>
                          <dd className="font-medium">
                            {selectedLog.parsed_amount
                              ? formatCurrency(selectedLog.parsed_amount)
                              : "\u2014"}
                          </dd>
                        </div>
                        <div className="flex justify-between">
                          <dt className="text-muted-foreground">Date</dt>
                          <dd className="font-medium">
                            {selectedLog.parsed_date
                              ? new Date(
                                  selectedLog.parsed_date,
                                ).toLocaleDateString("en-PK", {
                                  weekday: "short",
                                  year: "numeric",
                                  month: "short",
                                  day: "numeric",
                                })
                              : "\u2014"}
                          </dd>
                        </div>
                        <div className="flex justify-between">
                          <dt className="text-muted-foreground">
                            Transaction ID
                          </dt>
                          <dd className="font-mono text-xs">
                            {selectedLog.parsed_tx_id ?? "\u2014"}
                          </dd>
                        </div>
                        {selectedLog.bank_accounts && (
                          <div className="flex justify-between">
                            <dt className="text-muted-foreground">
                              Bank Account
                            </dt>
                            <dd className="font-medium">
                              {selectedLog.bank_accounts.account_name} (
                              {selectedLog.bank_accounts.bank_name})
                            </dd>
                          </div>
                        )}
                        {selectedLog.donors && (
                          <div className="flex justify-between border-t pt-3">
                            <dt className="text-muted-foreground">
                              Linked Donor
                            </dt>
                            <dd className="font-medium">
                              {selectedLog.donors.name}
                            </dd>
                          </div>
                        )}
                        {selectedLog.ledger_entries && (
                          <div className="flex justify-between">
                            <dt className="text-muted-foreground">
                              Linked Donation
                            </dt>
                            <dd className="font-medium">
                              {formatCurrency(
                                selectedLog.ledger_entries.amount,
                              )}{" "}
                              on{" "}
                              {new Date(
                                selectedLog.ledger_entries.date,
                              ).toLocaleDateString("en-PK", {
                                month: "short",
                                day: "numeric",
                              })}
                            </dd>
                          </div>
                        )}
                      </dl>
                    </CardContent>
                  </Card>
                )}

                {/* Error Message */}
                {selectedLog.error_message && (
                  <Alert variant="destructive">
                    <AlertTriangle className="size-4" />
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription className="font-mono text-xs mt-1">
                      {selectedLog.error_message}
                    </AlertDescription>
                  </Alert>
                )}

                {/* Raw Email Content */}
                {selectedLog.email_body && (
                  <Collapsible
                    defaultOpen={
                      selectedLog.status === "skipped" ||
                      selectedLog.status === "error"
                    }
                  >
                    <CollapsibleTrigger asChild>
                      <Button
                        variant="ghost"
                        className="w-full justify-between px-0 hover:bg-transparent"
                      >
                        <span className="text-sm font-medium">
                          Raw Email Content
                        </span>
                        <span className="text-xs text-muted-foreground">
                          click to toggle
                        </span>
                      </Button>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <ScrollArea className="h-64 rounded-md border bg-muted/50 p-4 mt-2">
                        <pre className="text-xs font-mono whitespace-pre-wrap break-words">
                          {selectedLog.email_body}
                        </pre>
                      </ScrollArea>
                    </CollapsibleContent>
                  </Collapsible>
                )}

                {/* Email From */}
                {selectedLog.email_from && (
                  <div className="text-xs text-muted-foreground">
                    From: {selectedLog.email_from}
                  </div>
                )}
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
