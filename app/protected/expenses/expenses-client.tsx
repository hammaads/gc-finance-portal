"use client";

import { useState, useRef, useActionState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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
import { Switch } from "@/components/ui/switch";
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
  RotateCcw,
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
import {
  createExpense,
  voidExpense,
  restoreExpense,
} from "@/lib/actions/expenses";
import { uploadReceipt } from "@/lib/actions/receipts";
import { compressImage } from "@/lib/compress-image";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { ItemNameCombobox } from "@/components/ui/item-name-combobox";
import { VolunteerCombobox } from "@/components/ui/volunteer-combobox";

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
  deleted_at: string | null;
  void_reason: string | null;
  voided_at: string | null;
  restored_at: string | null;
  expense_categories?: { name: string } | null;
  currencies?: { code?: string; symbol?: string } | null;
  causes?: { name: string } | null;
  bank_accounts?: { account_name: string } | null;
  from_user?: { name: string } | null;
  custodian?: { name: string } | null;
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
type Volunteer = { id: string; name: string };

interface ExpensesClientProps {
  expenses: Expense[];
  categories: ExpenseCategory[];
  currencies: Currency[];
  bankAccounts: BankAccount[];
  causes: Cause[];
  volunteers: Volunteer[];
  itemNames: string[];
  receiptRequired: boolean;
  showVoided: boolean;
}

// ── Delete Expense Dialog ──

function VoidExpenseDialog({ expense }: { expense: Expense }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleVoid() {
    if (!reason.trim()) {
      toast.error("Void reason is required");
      return;
    }

    setSubmitting(true);
    const result = await voidExpense(expense.id, reason);
    if ("success" in result && result.success) {
      toast.success("Expense voided");
      setOpen(false);
      setReason("");
      router.refresh();
    } else {
      const message = "error" in result ? result.error : "Failed to void expense";
      toast.error(typeof message === "string" ? message : "Failed to void expense");
    }
    setSubmitting(false);
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
          <DialogTitle>Void Expense</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          This expense will be excluded from totals. Please provide a reason.
        </p>
        <div className="space-y-2">
          <label className="text-sm font-medium">Reason</label>
          <Textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
            placeholder="Explain why this expense is being voided"
          />
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="outline">
              Cancel
            </Button>
          </DialogClose>
          <Button
            variant="destructive"
            onClick={handleVoid}
            disabled={submitting || !reason.trim()}
          >
            {submitting ? "Voiding..." : "Void Expense"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function RestoreExpenseDialog({ expense }: { expense: Expense }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [restoring, setRestoring] = useState(false);

  async function handleRestore() {
    setRestoring(true);
    const result = await restoreExpense(expense.id);
    if ("success" in result && result.success) {
      toast.success("Expense restored");
      setOpen(false);
      router.refresh();
    } else {
      const message =
        "error" in result ? result.error : "Failed to restore expense";
      toast.error(
        typeof message === "string" ? message : "Failed to restore expense",
      );
    }
    setRestoring(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon">
          <RotateCcw className="size-4 text-emerald-600" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Restore Expense</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          Restore this voided expense back into active totals?
        </p>
        {expense.void_reason && (
          <p className="rounded-md bg-muted p-2 text-sm">
            <span className="font-medium">Void reason: </span>
            {expense.void_reason}
          </p>
        )}
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="outline">
              Cancel
            </Button>
          </DialogClose>
          <Button onClick={handleRestore} disabled={restoring}>
            {restoring ? "Restoring..." : "Restore"}
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
            {/* eslint-disable-next-line @next/next/no-img-element */}
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

export type AddExpenseDialogProps = {
  categories: ExpenseCategory[];
  currencies: Currency[];
  bankAccounts: BankAccount[];
  causes: Cause[];
  volunteers: Volunteer[];
  itemNames: string[];
  receiptRequired: boolean;
  defaultCauseId?: string;
  lockCause?: boolean;
  triggerLabel?: string;
};

export function AddExpenseDialog({
  categories,
  currencies,
  bankAccounts,
  causes,
  volunteers,
  itemNames,
  receiptRequired,
  defaultCauseId,
  lockCause = false,
  triggerLabel = "Add Expense",
}: AddExpenseDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [method, setMethod] = useState<"bank" | "cash">("bank");
  const [itemName, setItemName] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [unitPrice, setUnitPrice] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [causeId, setCauseId] = useState(defaultCauseId ?? "");
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
    setCauseId(defaultCauseId ?? "");
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
          {triggerLabel}
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

          {/* Source */}
          {method === "bank" ? (
            <div className="space-y-1">
              <label className="flex items-center gap-1 text-xs font-medium text-muted-foreground">
                Bank Account{" "}
                <span className="text-destructive">*</span>
                {bankAccountId && (
                  <Check className="size-3 text-emerald-500" />
                )}
              </label>
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
            </div>
          ) : (
            <div className="space-y-1">
              <label className="flex items-center gap-1 text-xs font-medium text-muted-foreground">
                Paying Volunteer{" "}
                <span className="text-destructive">*</span>
              </label>
              <VolunteerCombobox
                volunteers={volunteers}
                value={fromUserId}
                onChange={setFromUserId}
                placeholder="Type volunteer name..."
              />
            </div>
          )}

          {/* Drive */}
          {lockCause ? (
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">
                Drive
              </label>
              <div className="rounded-md border bg-muted/30 px-3 py-2 text-sm">
                {causes.find((cause) => cause.id === causeId)?.name ?? "Current drive"}
              </div>
            </div>
          ) : (
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">
                Drive
              </label>
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
          )}

          {/* Custodian (only for general expenses) */}
          {isGeneral && (
            <div className="space-y-1">
              <label className="flex items-center gap-1 text-xs font-medium text-muted-foreground">
                Custodian <span className="text-destructive">*</span>
              </label>
              <VolunteerCombobox
                volunteers={volunteers}
                value={custodianId}
                onChange={setCustodianId}
                placeholder="Who has these items?"
              />
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
  volunteers,
  itemNames,
  receiptRequired,
  showVoided,
}: ExpensesClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function handleShowVoidedChange(checked: boolean) {
    const next = new URLSearchParams(searchParams.toString());
    if (checked) {
      next.set("showVoided", "1");
    } else {
      next.delete("showVoided");
    }
    const query = next.toString();
    router.push(query ? `?${query}` : "/protected/expenses");
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-medium">All Expenses</h2>
        <div className="flex items-center gap-2">
          <label className="flex items-center gap-2 text-sm text-muted-foreground">
            <Switch checked={showVoided} onCheckedChange={handleShowVoidedChange} />
            Show voided
          </label>
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
            volunteers={volunteers}
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
            <TableHead>Status</TableHead>
            <TableHead className="w-16 text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {expenses.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={11}
                className="text-center text-muted-foreground"
              >
                {showVoided
                  ? "No expenses found."
                  : "No active expenses yet. Add one to get started."}
              </TableCell>
            </TableRow>
          ) : (
            expenses.map((expense) => {
              const isBank = expense.type === "expense_bank";
              const isVoided = !!expense.deleted_at;
              const pkrValue =
                Number(expense.amount) *
                Number(expense.exchange_rate_to_pkr);

              return (
                <TableRow key={expense.id} className={isVoided ? "opacity-70" : undefined}>
                  <TableCell className="whitespace-nowrap">
                    {formatDate(expense.date)}
                  </TableCell>
                  <TableCell className="font-medium">
                    <Link
                      href={`/protected/expenses/${expense.id}`}
                      className="hover:underline"
                    >
                      {expense.item_name ?? "-"}
                    </Link>
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
                    {expense.custodian?.name ?? "-"}
                  </TableCell>
                  <TableCell>
                    {isVoided ? (
                      <div className="space-y-1">
                        <Badge variant="destructive">VOID</Badge>
                        {expense.void_reason && (
                          <p className="max-w-48 truncate text-xs text-muted-foreground">
                            {expense.void_reason}
                          </p>
                        )}
                      </div>
                    ) : (
                      <Badge variant="outline">Active</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    {isVoided ? (
                      <RestoreExpenseDialog expense={expense} />
                    ) : (
                      <VoidExpenseDialog expense={expense} />
                    )}
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
