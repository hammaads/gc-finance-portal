import { Suspense } from "react";
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { ArrowLeft, MapPin, Calendar, Users } from "lucide-react";
import { getCause, getDriveFinancialSummary } from "@/lib/actions/causes";
import { getBudgetItems, getBudgetVsActual } from "@/lib/actions/budget";
import { getExpenseCategories, getCurrencies } from "@/lib/actions/settings";
import { getDriveExpenseBreakdown, getInventoryItems } from "@/lib/actions/inventory";
import { formatCurrency, formatDate } from "@/lib/format";
import { DriveDetailClient } from "./drive-detail-client";
import { DriveExpensesClient } from "./drive-expenses-client";

async function DriveDetailContent({ id }: { id: string }) {
  const [cause, summary, budgetItems, budgetVsActual, categories, currencies, expenseBreakdown, inventoryItems] =
    await Promise.all([
      getCause(id),
      getDriveFinancialSummary(id).catch(() => null),
      getBudgetItems(id),
      getBudgetVsActual(id),
      getExpenseCategories(),
      getCurrencies(),
      getDriveExpenseBreakdown(id),
      getInventoryItems(),
    ]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" asChild>
              <Link href="/protected/drives">
                <ArrowLeft className="size-4" />
              </Link>
            </Button>
            <h1 className="text-2xl font-semibold tracking-tight">
              {cause.name}
            </h1>
            <Badge variant={cause.type === "drive" ? "default" : "secondary"}>
              {cause.type === "drive" ? "Drive" : "Cause"}
            </Badge>
          </div>
          <div className="ml-10 flex flex-wrap gap-4 text-sm text-muted-foreground">
            {cause.date && (
              <span className="flex items-center gap-1">
                <Calendar className="size-4" />
                {formatDate(cause.date)}
              </span>
            )}
            {cause.location && (
              <span className="flex items-center gap-1">
                <MapPin className="size-4" />
                {cause.location}
              </span>
            )}
            {cause.expected_headcount && (
              <span className="flex items-center gap-1">
                <Users className="size-4" />
                {cause.expected_headcount.toLocaleString()} expected
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Budget
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {formatCurrency(summary?.total_budget_pkr ?? 0)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Spent
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {formatCurrency(summary?.total_spent_pkr ?? 0)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Remaining
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {formatCurrency(summary?.remaining_budget_pkr ?? 0)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Donations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {formatCurrency(summary?.total_donations_pkr ?? 0)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="expenses">
        <TabsList>
          <TabsTrigger value="expenses">Expenses</TabsTrigger>
          <TabsTrigger value="budget-plan">Budget Plan</TabsTrigger>
          <TabsTrigger value="budget-vs-actual">Budget vs Actual</TabsTrigger>
        </TabsList>

        <TabsContent value="expenses" className="space-y-4">
          <DriveExpensesClient
            directExpenses={expenseBreakdown.directExpenses}
            consumedItems={expenseBreakdown.consumedItems}
            inventoryItems={inventoryItems}
            causeId={id}
          />
        </TabsContent>

        <TabsContent value="budget-plan" className="space-y-4">
          <DriveDetailClient
            budgetItems={budgetItems}
            categories={categories}
            currencies={currencies}
            causeId={id}
          />
        </TabsContent>

        <TabsContent value="budget-vs-actual" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-medium">Budget vs Actual</h2>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Category</TableHead>
                <TableHead className="text-right">Budgeted</TableHead>
                <TableHead className="text-right">Actual</TableHead>
                <TableHead className="text-right">Remaining</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {budgetVsActual.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={4}
                    className="text-center text-muted-foreground"
                  >
                    No budget vs actual data yet.
                  </TableCell>
                </TableRow>
              ) : (
                budgetVsActual.map((row, i) => {
                  const budgeted = (row as Record<string, unknown>).budgeted_pkr as number | null ?? 0;
                  const actual = (row as Record<string, unknown>).actual_pkr as number | null ?? 0;
                  const remaining = budgeted - actual;
                  return (
                    <TableRow key={i}>
                      <TableCell className="font-medium">
                        {(row as Record<string, unknown>).category_name as string ?? "Uncategorized"}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(budgeted)}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(actual)}
                      </TableCell>
                      <TableCell
                        className={`text-right ${remaining < 0 ? "text-destructive" : ""}`}
                      >
                        {formatCurrency(remaining)}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default function DriveDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <Suspense fallback={<Skeleton className="h-96" />}>
      <DriveDetailPageInner params={params} />
    </Suspense>
  );
}

async function DriveDetailPageInner({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <DriveDetailContent id={id} />;
}
