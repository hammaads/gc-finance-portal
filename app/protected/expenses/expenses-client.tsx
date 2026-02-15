"use client";

import { useState, useActionState } from "react";
import { useRouter } from "next/navigation";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Plus, Trash2, CalendarIcon, Check, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { formatCurrency, formatDate } from "@/lib/format";
import { createExpense, deleteExpense } from "@/lib/actions/expenses";
import { cn } from "@/lib/utils";

// ── Types ──

type Expense = {
  id: string;
  type: string;
  amount: number | string;
  exchange_rate_to_pkr: number | string;
  date: string;
  description: string | null;
  expense_categories?: {
    name: string;
  } | null;
  currencies?: {
    code?: string;
    symbol?: string;
  } | null;
  causes?: {
    name: string;
  } | null;
  bank_accounts?: {
    account_name: string;
  } | null;
  from_user?: {
    display_name: string;
  } | null;
};

type ExpenseCategory = {
  id: string;
  name: string;
};

type Currency = {
  id: string;
  code: string;
  symbol: string;
  exchange_rate_to_pkr: number;
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
};

type Profile = {
  id: string;
  display_name: string;
};

interface ExpensesClientProps {
  expenses: Expense[];
  categories: ExpenseCategory[];
  currencies: Currency[];
  bankAccounts: BankAccount[];
  causes: Cause[];
  profiles: Profile[];
}

// ── Delete Expense Dialog ──

function DeleteExpenseDialog({ expense }: { expense: Expense }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    setDeleting(true);
    const result = await deleteExpense(expense.id);
    if ("success" in result && result.success) {
      toast.success("Expense deleted");
      setOpen(false);
      router.refresh();
    } else {
      toast.error("Failed to delete expense");
    }
    setDeleting(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon">
          <Trash2 className="size-4 text-destructive" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete Expense</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          Are you sure you want to delete this expense of{" "}
          <span className="font-medium text-foreground">
            {expense.currencies?.symbol}{" "}
            {Number(expense.amount).toLocaleString()}
          </span>
          ? This action cannot be undone.
        </p>
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="outline">
              Cancel
            </Button>
          </DialogClose>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={deleting}
          >
            {deleting ? "Deleting..." : "Delete"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Add Expense Dialog ──

function AddExpenseDialog({
  categories,
  currencies,
  bankAccounts,
  causes,
  profiles,
}: {
  categories: ExpenseCategory[];
  currencies: Currency[];
  bankAccounts: BankAccount[];
  causes: Cause[];
  profiles: Profile[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [method, setMethod] = useState<"bank" | "cash">("bank");
  const [categoryId, setCategoryId] = useState("");
  const [causeId, setCauseId] = useState("");
  const [bankAccountId, setBankAccountId] = useState(
    bankAccounts.length > 0 ? bankAccounts[0].id : "",
  );
  const [fromUserId, setFromUserId] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState<Date>(new Date());
  const [showDescription, setShowDescription] = useState(false);

  const baseCurrency = currencies.find((c) => c.code === "PKR") ?? currencies[0];
  const selectedBank = bankAccounts.find((b) => b.id === bankAccountId);
  const activeCurrency =
    method === "bank" && selectedBank
      ? {
          id: selectedBank.currency_id,
          code: selectedBank.currencies?.code ?? "PKR",
          symbol: selectedBank.currencies?.symbol ?? "Rs",
          exchange_rate: selectedBank.currencies?.exchange_rate_to_pkr ?? 1,
        }
      : {
          id: baseCurrency?.id ?? "",
          code: baseCurrency?.code ?? "PKR",
          symbol: baseCurrency?.symbol ?? "Rs",
          exchange_rate: baseCurrency?.exchange_rate_to_pkr ?? 1,
        };

  const [, formAction, pending] = useActionState(
    async (_prev: unknown, formData: FormData) => {
      const result = await createExpense(formData);
      if ("success" in result && result.success) {
        toast.success("Expense created");
        setOpen(false);
        resetForm();
        router.refresh();
      } else {
        const errors = (result as { error?: Record<string, string[]> }).error;
        const firstError =
          errors && typeof errors === "object"
            ? Object.values(errors).flat().join(", ")
            : "Failed to create expense";
        toast.error(firstError);
      }
      return result;
    },
    null,
  );

  const formReady =
    !!categoryId &&
    Number(amount) > 0 &&
    (method === "bank" ? !!bankAccountId : !!fromUserId);

  function resetForm() {
    setMethod("bank");
    setCategoryId("");
    setCauseId("");
    setBankAccountId(bankAccounts.length > 0 ? bankAccounts[0].id : "");
    setFromUserId("");
    setAmount("");
    setDate(new Date());
    setShowDescription(false);
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(val) => {
        setOpen(val);
        if (!val) resetForm();
      }}
    >
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="mr-1 size-4" />
          Add Expense
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-sm gap-0 p-5">
        <DialogHeader className="mb-3 space-y-0">
          <DialogTitle className="text-base">Add Expense</DialogTitle>
        </DialogHeader>
        <form action={formAction} className="space-y-3">
          <input
            type="hidden"
            name="type"
            value={method === "bank" ? "expense_bank" : "expense_cash"}
          />
          <input type="hidden" name="currency_id" value={activeCurrency.id} />
          <input type="hidden" name="exchange_rate_to_pkr" value={String(activeCurrency.exchange_rate)} />
          <input type="hidden" name="category_id" value={categoryId} />
          <input type="hidden" name="date" value={format(date, "yyyy-MM-dd")} />
          {causeId && <input type="hidden" name="cause_id" value={causeId} />}
          {method === "bank" && (
            <input type="hidden" name="bank_account_id" value={bankAccountId} />
          )}
          {method === "cash" && (
            <input type="hidden" name="from_user_id" value={fromUserId} />
          )}

          {/* Method toggle */}
          <div className="space-y-1">
            <label className="flex items-center gap-1 text-xs font-medium text-muted-foreground">
              Method <span className="text-destructive">*</span>
            </label>
            <div className="flex rounded-md border p-0.5">
              <button
                type="button"
                onClick={() => setMethod("bank")}
                className={cn(
                  "flex-1 rounded-sm px-3 py-1 text-xs font-medium transition-colors",
                  method === "bank"
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                Bank
              </button>
              <button
                type="button"
                onClick={() => setMethod("cash")}
                className={cn(
                  "flex-1 rounded-sm px-3 py-1 text-xs font-medium transition-colors",
                  method === "cash"
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                Cash
              </button>
            </div>
          </div>

          {/* Category + Date */}
          <div className="grid grid-cols-2 gap-x-2 gap-y-1">
            <label className="flex items-center gap-1 text-xs font-medium text-muted-foreground">
              Category <span className="text-destructive">*</span>
              {categoryId && <Check className="size-3 text-emerald-500" />}
            </label>
            <label className="flex items-center gap-1 text-xs font-medium text-muted-foreground">
              Date <span className="text-destructive">*</span>
            </label>
            <Select value={categoryId} onValueChange={setCategoryId}>
              <SelectTrigger
                className={cn(
                  "text-sm transition-colors",
                  categoryId && "border-emerald-500/50 bg-emerald-500/5",
                )}
              >
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat: ExpenseCategory) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full justify-start border-emerald-500/50 bg-emerald-500/5 text-left text-sm font-normal transition-colors"
                >
                  <CalendarIcon className="mr-1.5 size-3.5 shrink-0 opacity-60" />
                  <span className="truncate">{format(date, "dd MMM yyyy")}</span>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={(d) => d && setDate(d)}
                  disabled={{ after: new Date() }}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Amount */}
          <div className="space-y-1">
            <label className="flex items-center gap-1 text-xs font-medium text-muted-foreground">
              Amount ({activeCurrency.code}) <span className="text-destructive">*</span>
              {Number(amount) > 0 && <Check className="size-3 text-emerald-500" />}
            </label>
            <Input
              name="amount"
              type="number"
              step="any"
              min="0"
              placeholder="0.00"
              required
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className={cn(
                "transition-colors",
                Number(amount) > 0 && "border-emerald-500/50 bg-emerald-500/5",
              )}
            />
          </div>

          {/* Source + Cause */}
          <div className="grid grid-cols-2 gap-x-2 gap-y-1">
            <label className="flex items-center gap-1 text-xs font-medium text-muted-foreground">
              {method === "bank" ? "Bank Account" : "Paying Volunteer"} <span className="text-destructive">*</span>
              {(method === "bank" ? bankAccountId : fromUserId) && (
                <Check className="size-3 text-emerald-500" />
              )}
            </label>
            <label className="text-xs font-medium text-muted-foreground">Cause</label>
            {method === "bank" ? (
              <Select value={bankAccountId} onValueChange={setBankAccountId}>
                <SelectTrigger
                  className={cn(
                    "text-sm transition-colors",
                    bankAccountId && "border-emerald-500/50 bg-emerald-500/5",
                  )}
                >
                  <SelectValue placeholder="Select account" />
                </SelectTrigger>
                <SelectContent>
                  {bankAccounts.map((acc: BankAccount) => (
                    <SelectItem key={acc.id} value={acc.id}>
                      {acc.account_name} ({acc.bank_name})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <Select value={fromUserId} onValueChange={setFromUserId}>
                <SelectTrigger
                  className={cn(
                    "text-sm transition-colors",
                    fromUserId && "border-emerald-500/50 bg-emerald-500/5",
                  )}
                >
                  <SelectValue placeholder="Select volunteer" />
                </SelectTrigger>
                <SelectContent>
                  {profiles.map((profile: Profile) => (
                    <SelectItem key={profile.id} value={profile.id}>
                      {profile.display_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            <Select value={causeId} onValueChange={setCauseId}>
              <SelectTrigger className="text-sm">
                <SelectValue placeholder="Optional" />
              </SelectTrigger>
              <SelectContent>
                {causes.map((cause: Cause) => (
                  <SelectItem key={cause.id} value={cause.id}>
                    {cause.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Description - collapsible */}
          {showDescription ? (
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Notes</label>
              <Textarea
                name="description"
                placeholder="Optional notes about this expense"
                rows={2}
                className="text-sm"
                autoFocus
              />
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setShowDescription(true)}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              + Add notes
            </button>
          )}

          <DialogFooter className="gap-2 pt-1">
            <DialogClose asChild>
              <Button type="button" variant="outline" size="sm">
                Cancel
              </Button>
            </DialogClose>
            <Button type="submit" size="sm" disabled={pending || !formReady}>
              {pending ? (
                <>
                  <Loader2 className="mr-1.5 size-3.5 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ── Main Expenses Client ──

export function ExpensesClient({
  expenses,
  categories,
  currencies,
  bankAccounts,
  causes,
  profiles,
}: ExpensesClientProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-medium">All Expenses</h2>
        <AddExpenseDialog
          categories={categories}
          currencies={currencies}
          bankAccounts={bankAccounts}
          causes={causes}
          profiles={profiles}
        />
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead>Category</TableHead>
            <TableHead className="text-right">Amount</TableHead>
            <TableHead>Currency</TableHead>
            <TableHead className="text-right">PKR Value</TableHead>
            <TableHead>Method</TableHead>
            <TableHead>Cause</TableHead>
            <TableHead>Source</TableHead>
            <TableHead>Description</TableHead>
            <TableHead className="w-16 text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {expenses.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={10}
                className="text-center text-muted-foreground"
              >
                No expenses yet. Add one to get started.
              </TableCell>
            </TableRow>
          ) : (
            expenses.map((expense) => {
              const isBank = expense.type === "expense_bank";
              const pkrValue =
                Number(expense.amount) *
                Number(expense.exchange_rate_to_pkr);

              return (
                <TableRow key={expense.id}>
                  <TableCell>{formatDate(expense.date)}</TableCell>
                  <TableCell>
                    {expense.expense_categories?.name ?? "-"}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(
                      Number(expense.amount),
                      expense.currencies?.symbol,
                    )}
                  </TableCell>
                  <TableCell>{expense.currencies?.code ?? "-"}</TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(pkrValue, "Rs")}
                  </TableCell>
                  <TableCell>
                    <Badge variant={isBank ? "default" : "outline"}>
                      {isBank ? "Bank" : "Cash"}
                    </Badge>
                  </TableCell>
                  <TableCell>{expense.causes?.name ?? "-"}</TableCell>
                  <TableCell>
                    {isBank
                      ? expense.bank_accounts?.account_name ?? "-"
                      : expense.from_user?.display_name ?? "-"}
                  </TableCell>
                  <TableCell
                    className="max-w-[200px] truncate"
                    title={expense.description ?? ""}
                  >
                    {expense.description ?? "-"}
                  </TableCell>
                  <TableCell className="text-right">
                    <DeleteExpenseDialog expense={expense} />
                  </TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>
    </div>
  );
}
