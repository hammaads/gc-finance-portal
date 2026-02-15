"use client";

import { useState, useRef, useActionState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
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
import {
  Plus,
  Trash2,
  CalendarIcon,
  Check,
  Loader2,
  ImageIcon,
  X,
  TableProperties,
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { formatCurrency, formatDate } from "@/lib/format";
import { createExpense, deleteExpense } from "@/lib/actions/expenses";
import { uploadReceipt } from "@/lib/actions/receipts";
import { compressImage } from "@/lib/compress-image";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { ItemNameCombobox } from "@/components/ui/item-name-combobox";

// ── Types ──

type Expense = {
  id: string;
  type: string;
  amount: number | string;
  item_name: string | null;
  quantity: number | string | null;
  unit_price: number | string | null;
  exchange_rate_to_pkr: number | string;
  date: string;
  description: string | null;
  expense_categories?: { name: string } | null;
  currencies?: { code?: string; symbol?: string } | null;
  causes?: { name: string } | null;
  bank_accounts?: { account_name: string } | null;
  from_user?: { display_name: string } | null;
  custodian?: { display_name: string } | null;
};

type ExpenseCategory = { id: string; name: string };
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
  currencies: {
    code: string;
    symbol: string;
    exchange_rate_to_pkr: number;
  } | null;
};
type Cause = { id: string; name: string; type: string };
type Profile = { id: string; display_name: string };

interface ExpensesClientProps {
  expenses: Expense[];
  categories: ExpenseCategory[];
  currencies: Currency[];
  bankAccounts: BankAccount[];
  causes: Cause[];
  profiles: Profile[];
  itemNames: string[];
  receiptRequired: boolean;
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
          Are you sure you want to delete{" "}
          <span className="font-medium text-foreground">
            {expense.item_name ?? "this expense"}
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

// ── Receipt Upload ──

function ReceiptUpload({
  files,
  onFilesChange,
  required,
}: {
  files: File[];
  onFilesChange: (files: File[]) => void;
  required: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const newFiles = Array.from(e.target.files || []);
    if (!newFiles.length) return;

    // Compress images
    const compressed = await Promise.all(
      newFiles.map((f) => compressImage(f)),
    );
    onFilesChange([...files, ...compressed]);

    // Reset input
    if (inputRef.current) inputRef.current.value = "";
  }

  function removeFile(index: number) {
    onFilesChange(files.filter((_, i) => i !== index));
  }

  return (
    <div className="space-y-1.5">
      <label className="flex items-center gap-1 text-xs font-medium text-muted-foreground">
        Receipt images{" "}
        {required && <span className="text-destructive">*</span>}
        {files.length > 0 && <Check className="size-3 text-emerald-500" />}
      </label>
      <div className="flex flex-wrap gap-2">
        {files.map((file, i) => (
          <div
            key={i}
            className="relative size-14 overflow-hidden rounded-md border bg-muted"
          >
            <img
              src={URL.createObjectURL(file)}
              alt={file.name}
              className="size-full object-cover"
            />
            <button
              type="button"
              onClick={() => removeFile(i)}
              className="absolute -right-0.5 -top-0.5 rounded-full bg-destructive p-0.5 text-destructive-foreground"
            >
              <X className="size-2.5" />
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="flex size-14 items-center justify-center rounded-md border border-dashed text-muted-foreground transition-colors hover:border-foreground hover:text-foreground"
        >
          <ImageIcon className="size-5" />
        </button>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={handleFiles}
      />
    </div>
  );
}

// ── Add Expense Dialog ──

export function AddExpenseDialog({
  categories,
  currencies,
  bankAccounts,
  causes,
  profiles,
  itemNames,
  receiptRequired,
}: {
  categories: ExpenseCategory[];
  currencies: Currency[];
  bankAccounts: BankAccount[];
  causes: Cause[];
  profiles: Profile[];
  itemNames: string[];
  receiptRequired: boolean;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [method, setMethod] = useState<"bank" | "cash">("bank");
  const [itemName, setItemName] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [unitPrice, setUnitPrice] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [causeId, setCauseId] = useState("");
  const [custodianId, setCustodianId] = useState("");
  const [bankAccountId, setBankAccountId] = useState(
    bankAccounts.length > 0 ? bankAccounts[0].id : "",
  );
  const [fromUserId, setFromUserId] = useState("");
  const [date, setDate] = useState<Date>(new Date());
  const [showDescription, setShowDescription] = useState(false);
  const [receiptFiles, setReceiptFiles] = useState<File[]>([]);

  const baseCurrency =
    currencies.find((c) => c.code === "PKR") ?? currencies[0];
  const selectedBank = bankAccounts.find((b) => b.id === bankAccountId);
  const activeCurrency =
    method === "bank" && selectedBank
      ? {
          id: selectedBank.currency_id,
          code: selectedBank.currencies?.code ?? "PKR",
          symbol: selectedBank.currencies?.symbol ?? "Rs",
          exchange_rate:
            selectedBank.currencies?.exchange_rate_to_pkr ?? 1,
        }
      : {
          id: baseCurrency?.id ?? "",
          code: baseCurrency?.code ?? "PKR",
          symbol: baseCurrency?.symbol ?? "Rs",
          exchange_rate: baseCurrency?.exchange_rate_to_pkr ?? 1,
        };

  const computedTotal = (Number(quantity) || 0) * (Number(unitPrice) || 0);
  const isGeneral = !causeId;

  const [, formAction, pending] = useActionState(
    async (_prev: unknown, formData: FormData) => {
      const result = await createExpense(formData);
      if ("success" in result && result.success && "id" in result) {
        // Upload receipts
        if (receiptFiles.length > 0) {
          const supabase = createClient();
          for (const file of receiptFiles) {
            const path = `${result.id}/${crypto.randomUUID()}.jpg`;
            const { error: uploadError } = await supabase.storage
              .from("receipts")
              .upload(path, file, { contentType: file.type });
            if (!uploadError) {
              await uploadReceipt(result.id, path, file.name, file.size);
            }
          }
        }
        toast.success("Expense created");
        setOpen(false);
        resetForm();
        router.refresh();
      } else {
        const errors = (result as { error?: Record<string, string[]> })
          .error;
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
    !!itemName &&
    !!categoryId &&
    computedTotal > 0 &&
    (method === "bank" ? !!bankAccountId : !!fromUserId) &&
    (isGeneral ? !!custodianId : true) &&
    (!receiptRequired || receiptFiles.length > 0);

  function resetForm() {
    setMethod("bank");
    setItemName("");
    setQuantity("1");
    setUnitPrice("");
    setCategoryId("");
    setCauseId("");
    setCustodianId("");
    setBankAccountId(bankAccounts.length > 0 ? bankAccounts[0].id : "");
    setFromUserId("");
    setDate(new Date());
    setShowDescription(false);
    setReceiptFiles([]);
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
          <input
            type="hidden"
            name="currency_id"
            value={activeCurrency.id}
          />
          <input
            type="hidden"
            name="exchange_rate_to_pkr"
            value={String(activeCurrency.exchange_rate)}
          />
          <input type="hidden" name="category_id" value={categoryId} />
          <input
            type="hidden"
            name="date"
            value={format(date, "yyyy-MM-dd")}
          />
          <input type="hidden" name="item_name" value={itemName} />
          <input type="hidden" name="quantity" value={quantity} />
          <input type="hidden" name="unit_price" value={unitPrice} />
          {causeId && (
            <input type="hidden" name="cause_id" value={causeId} />
          )}
          {isGeneral && custodianId && (
            <input
              type="hidden"
              name="custodian_id"
              value={custodianId}
            />
          )}
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

          {/* Item Name */}
          <div className="space-y-1">
            <label className="flex items-center gap-1 text-xs font-medium text-muted-foreground">
              Item Name <span className="text-destructive">*</span>
              {itemName && <Check className="size-3 text-emerald-500" />}
            </label>
            <ItemNameCombobox
              itemNames={itemNames}
              value={itemName}
              onChange={setItemName}
            />
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
                {categories.map((cat) => (
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
                  <span className="truncate">
                    {format(date, "dd MMM yyyy")}
                  </span>
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

          {/* Quantity + Unit Price */}
          <div className="grid grid-cols-2 gap-x-2 gap-y-1">
            <label className="flex items-center gap-1 text-xs font-medium text-muted-foreground">
              Quantity <span className="text-destructive">*</span>
            </label>
            <label className="flex items-center gap-1 text-xs font-medium text-muted-foreground">
              Unit Price ({activeCurrency.code}){" "}
              <span className="text-destructive">*</span>
              {Number(unitPrice) > 0 && (
                <Check className="size-3 text-emerald-500" />
              )}
            </label>
            <Input
              type="number"
              step="any"
              min="1"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className={cn(
                "text-sm transition-colors",
                Number(quantity) > 0 &&
                  "border-emerald-500/50 bg-emerald-500/5",
              )}
            />
            <Input
              type="number"
              step="any"
              min="0"
              placeholder="0.00"
              value={unitPrice}
              onChange={(e) => setUnitPrice(e.target.value)}
              className={cn(
                "text-sm transition-colors",
                Number(unitPrice) > 0 &&
                  "border-emerald-500/50 bg-emerald-500/5",
              )}
            />
          </div>

          {/* Computed total */}
          {computedTotal > 0 && (
            <div className="rounded-md bg-muted/50 px-3 py-1.5 text-sm">
              Total:{" "}
              <span className="font-semibold">
                {activeCurrency.symbol}{" "}
                {computedTotal.toLocaleString("en-PK", {
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 2,
                })}
              </span>
            </div>
          )}

          {/* Source + Drive */}
          <div className="grid grid-cols-2 gap-x-2 gap-y-1">
            <label className="flex items-center gap-1 text-xs font-medium text-muted-foreground">
              {method === "bank" ? "Bank Account" : "Paying Volunteer"}{" "}
              <span className="text-destructive">*</span>
              {(method === "bank" ? bankAccountId : fromUserId) && (
                <Check className="size-3 text-emerald-500" />
              )}
            </label>
            <label className="text-xs font-medium text-muted-foreground">
              Drive
            </label>
            {method === "bank" ? (
              <Select
                value={bankAccountId}
                onValueChange={setBankAccountId}
              >
                <SelectTrigger
                  className={cn(
                    "text-sm transition-colors",
                    bankAccountId &&
                      "border-emerald-500/50 bg-emerald-500/5",
                  )}
                >
                  <SelectValue placeholder="Select account" />
                </SelectTrigger>
                <SelectContent>
                  {bankAccounts.map((acc) => (
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
                    fromUserId &&
                      "border-emerald-500/50 bg-emerald-500/5",
                  )}
                >
                  <SelectValue placeholder="Select volunteer" />
                </SelectTrigger>
                <SelectContent>
                  {profiles.map((profile) => (
                    <SelectItem key={profile.id} value={profile.id}>
                      {profile.display_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            <Select
              value={causeId || "__general__"}
              onValueChange={(v) =>
                setCauseId(v === "__general__" ? "" : v)
              }
            >
              <SelectTrigger className="text-sm">
                <SelectValue placeholder="General" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__general__">
                  General (Inventory)
                </SelectItem>
                {causes
                  .filter((cause) => cause.type === "drive")
                  .map((cause) => (
                    <SelectItem key={cause.id} value={cause.id}>
                      {cause.name}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>

          {/* Custodian (only for general expenses) */}
          {isGeneral && (
            <div className="space-y-1">
              <label className="flex items-center gap-1 text-xs font-medium text-muted-foreground">
                Custodian <span className="text-destructive">*</span>
                {custodianId && (
                  <Check className="size-3 text-emerald-500" />
                )}
              </label>
              <Select
                value={custodianId}
                onValueChange={setCustodianId}
              >
                <SelectTrigger
                  className={cn(
                    "text-sm transition-colors",
                    custodianId &&
                      "border-emerald-500/50 bg-emerald-500/5",
                  )}
                >
                  <SelectValue placeholder="Who has these items?" />
                </SelectTrigger>
                <SelectContent>
                  {profiles.map((profile) => (
                    <SelectItem key={profile.id} value={profile.id}>
                      {profile.display_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Receipt upload */}
          <ReceiptUpload
            files={receiptFiles}
            onFilesChange={setReceiptFiles}
            required={receiptRequired}
          />

          {/* Description - collapsible */}
          {showDescription ? (
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">
                Notes
              </label>
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
            <Button
              type="submit"
              size="sm"
              disabled={pending || !formReady}
            >
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
  itemNames,
  receiptRequired,
}: ExpensesClientProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-medium">All Expenses</h2>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href="/protected/expenses/bulk-add">
              <TableProperties className="mr-1 size-4" />
              Bulk Add
            </Link>
          </Button>
          <AddExpenseDialog
            categories={categories}
            currencies={currencies}
            bankAccounts={bankAccounts}
            causes={causes}
            profiles={profiles}
            itemNames={itemNames}
            receiptRequired={receiptRequired}
          />
        </div>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead>Item</TableHead>
            <TableHead>Category</TableHead>
            <TableHead className="text-right">Qty</TableHead>
            <TableHead className="text-right">Unit Price</TableHead>
            <TableHead className="text-right">Total (PKR)</TableHead>
            <TableHead>Method</TableHead>
            <TableHead>Drive</TableHead>
            <TableHead>Custodian</TableHead>
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
                  <TableCell className="whitespace-nowrap">
                    {formatDate(expense.date)}
                  </TableCell>
                  <TableCell className="font-medium">
                    {expense.item_name ?? "-"}
                  </TableCell>
                  <TableCell>
                    {expense.expense_categories?.name ?? "-"}
                  </TableCell>
                  <TableCell className="text-right">
                    {expense.quantity ?? "-"}
                  </TableCell>
                  <TableCell className="text-right">
                    {expense.unit_price != null
                      ? formatCurrency(
                          Number(expense.unit_price),
                          expense.currencies?.symbol,
                        )
                      : "-"}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(pkrValue, "Rs")}
                  </TableCell>
                  <TableCell>
                    <Badge variant={isBank ? "default" : "outline"}>
                      {isBank ? "Bank" : "Cash"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {expense.causes?.name ?? (
                      <span className="text-muted-foreground">
                        General
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    {expense.custodian?.display_name ?? "-"}
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
