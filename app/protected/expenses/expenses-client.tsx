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
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { formatCurrency, formatDate } from "@/lib/format";
import { createExpense, deleteExpense } from "@/lib/actions/expenses";

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
  const [currencyId, setCurrencyId] = useState("");
  const [exchangeRate, setExchangeRate] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [causeId, setCauseId] = useState("");
  const [bankAccountId, setBankAccountId] = useState("");
  const [fromUserId, setFromUserId] = useState("");

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

  function resetForm() {
    setMethod("bank");
    setCurrencyId("");
    setExchangeRate("");
    setCategoryId("");
    setCauseId("");
    setBankAccountId("");
    setFromUserId("");
  }

  function handleCurrencyChange(id: string) {
    setCurrencyId(id);
    const currency = currencies.find((c: Currency) => c.id === id);
    if (currency) {
      setExchangeRate(String(currency.exchange_rate_to_pkr));
    }
  }

  const today = new Date().toISOString().split("T")[0];

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
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Add Expense</DialogTitle>
        </DialogHeader>
        <form action={formAction} className="space-y-4">
          {/* Hidden inputs for select values */}
          <input
            type="hidden"
            name="type"
            value={method === "bank" ? "expense_bank" : "expense_cash"}
          />
          <input type="hidden" name="currency_id" value={currencyId} />
          <input type="hidden" name="category_id" value={categoryId} />
          {causeId && <input type="hidden" name="cause_id" value={causeId} />}
          {method === "bank" && (
            <input
              type="hidden"
              name="bank_account_id"
              value={bankAccountId}
            />
          )}
          {method === "cash" && (
            <input type="hidden" name="from_user_id" value={fromUserId} />
          )}

          {/* Method Toggle */}
          <div className="space-y-2">
            <Label>Method</Label>
            <div className="flex gap-2">
              <Button
                type="button"
                variant={method === "bank" ? "default" : "outline"}
                size="sm"
                onClick={() => setMethod("bank")}
              >
                Bank
              </Button>
              <Button
                type="button"
                variant={method === "cash" ? "default" : "outline"}
                size="sm"
                onClick={() => setMethod("cash")}
              >
                Cash
              </Button>
            </div>
          </div>

          {/* Category */}
          <div className="space-y-2">
            <Label>Category</Label>
            <Select value={categoryId} onValueChange={setCategoryId}>
              <SelectTrigger>
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
          </div>

          {/* Amount & Currency */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="add-expense-amount">Amount</Label>
              <Input
                id="add-expense-amount"
                name="amount"
                type="number"
                step="any"
                placeholder="0.00"
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Currency</Label>
              <Select value={currencyId} onValueChange={handleCurrencyChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select currency" />
                </SelectTrigger>
                <SelectContent>
                  {currencies.map((cur: Currency) => (
                    <SelectItem key={cur.id} value={cur.id}>
                      {cur.code} ({cur.symbol})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Exchange Rate */}
          <div className="space-y-2">
            <Label htmlFor="add-expense-rate">Exchange Rate to PKR</Label>
            <Input
              id="add-expense-rate"
              name="exchange_rate_to_pkr"
              type="number"
              step="any"
              value={exchangeRate}
              onChange={(e) => setExchangeRate(e.target.value)}
              required
            />
          </div>

          {/* Date */}
          <div className="space-y-2">
            <Label htmlFor="add-expense-date">Date</Label>
            <Input
              id="add-expense-date"
              name="date"
              type="date"
              defaultValue={today}
              required
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="add-expense-desc">Description (optional)</Label>
            <Textarea
              id="add-expense-desc"
              name="description"
              placeholder="Add a description..."
              rows={2}
            />
          </div>

          {/* Cause */}
          <div className="space-y-2">
            <Label>Cause (optional)</Label>
            <Select value={causeId} onValueChange={setCauseId}>
              <SelectTrigger>
                <SelectValue placeholder="Select cause" />
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

          {/* Conditional: Bank Account or Paying Volunteer */}
          {method === "bank" ? (
            <div className="space-y-2">
              <Label>Bank Account</Label>
              <Select value={bankAccountId} onValueChange={setBankAccountId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select bank account" />
                </SelectTrigger>
                <SelectContent>
                  {bankAccounts.map((acc: BankAccount) => (
                    <SelectItem key={acc.id} value={acc.id}>
                      {acc.account_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : (
            <div className="space-y-2">
              <Label>Paying Volunteer</Label>
              <Select value={fromUserId} onValueChange={setFromUserId}>
                <SelectTrigger>
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
            </div>
          )}

          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </DialogClose>
            <Button type="submit" disabled={pending}>
              {pending ? "Creating..." : "Create"}
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
