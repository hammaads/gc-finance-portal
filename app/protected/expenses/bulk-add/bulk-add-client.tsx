"use client";

import { useState, useRef } from "react";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  Loader2,
  ArrowLeft,
  ImageIcon,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { formatCurrency } from "@/lib/format";
import { createBulkExpenses } from "@/lib/actions/expenses";
import { uploadReceipt } from "@/lib/actions/receipts";
import { compressImage } from "@/lib/compress-image";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { ItemNameCombobox } from "@/components/ui/item-name-combobox";
import { VolunteerCombobox } from "@/components/ui/volunteer-combobox";

// ── Types ──

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

interface BulkAddClientProps {
  categories: ExpenseCategory[];
  currencies: Currency[];
  bankAccounts: BankAccount[];
  causes: Cause[];
  volunteers: Volunteer[];
  itemNames: string[];
  receiptRequired: boolean;
}

type LineItem = {
  id: string;
  item_name: string;
  category_id: string;
  quantity: string;
  unit_price: string;
  description: string;
};

function newLineItem(): LineItem {
  return {
    id: crypto.randomUUID(),
    item_name: "",
    category_id: "",
    quantity: "1",
    unit_price: "",
    description: "",
  };
}

export function BulkAddClient({
  categories,
  currencies,
  bankAccounts,
  causes,
  volunteers,
  itemNames,
  receiptRequired,
}: BulkAddClientProps) {
  const router = useRouter();

  // Shared header state
  const [method, setMethod] = useState<"bank" | "cash">("bank");
  const [bankAccountId, setBankAccountId] = useState(
    bankAccounts.length > 0 ? bankAccounts[0].id : "",
  );
  const [fromUserId, setFromUserId] = useState("");
  const [causeId, setCauseId] = useState("");
  const [custodianId, setCustodianId] = useState("");
  const [date, setDate] = useState<Date>(new Date());
  const [receiptFiles, setReceiptFiles] = useState<File[]>([]);

  // Line items
  const [items, setItems] = useState<LineItem[]>([newLineItem()]);
  const [saving, setSaving] = useState(false);

  const receiptInputRef = useRef<HTMLInputElement>(null);

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

  const isGeneral = !causeId;

  const grandTotal = items.reduce(
    (sum, item) =>
      sum + (Number(item.quantity) || 0) * (Number(item.unit_price) || 0),
    0,
  );

  function updateItem(index: number, updates: Partial<LineItem>) {
    setItems(
      items.map((item, i) =>
        i === index ? { ...item, ...updates } : item,
      ),
    );
  }

  function removeItem(index: number) {
    if (items.length === 1) return;
    setItems(items.filter((_, i) => i !== index));
  }

  async function handleReceiptFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const newFiles = Array.from(e.target.files || []);
    if (!newFiles.length) return;
    const compressed = await Promise.all(
      newFiles.map((f) => compressImage(f)),
    );
    setReceiptFiles([...receiptFiles, ...compressed]);
    if (receiptInputRef.current) receiptInputRef.current.value = "";
  }

  async function handleSubmit() {
    // Validate
    const invalidItems = items.filter(
      (item) =>
        !item.item_name ||
        !item.category_id ||
        Number(item.unit_price) <= 0,
    );
    if (invalidItems.length > 0) {
      toast.error("Fill in item name, category, and unit price for all rows");
      return;
    }
    if (method === "bank" && !bankAccountId) {
      toast.error("Select a bank account");
      return;
    }
    if (method === "cash" && !fromUserId) {
      toast.error("Select a paying volunteer");
      return;
    }
    if (isGeneral && !custodianId) {
      toast.error("Select a custodian for general expenses");
      return;
    }
    if (receiptRequired && receiptFiles.length === 0) {
      toast.error("Receipt images are required");
      return;
    }

    setSaving(true);

    const formData = new FormData();
    formData.set(
      "type",
      method === "bank" ? "expense_bank" : "expense_cash",
    );
    formData.set("currency_id", activeCurrency.id);
    formData.set(
      "exchange_rate_to_pkr",
      String(activeCurrency.exchange_rate),
    );
    formData.set("date", format(date, "yyyy-MM-dd"));
    if (causeId) formData.set("cause_id", causeId);
    if (isGeneral && custodianId)
      formData.set("custodian_id", custodianId);
    if (method === "bank") formData.set("bank_account_id", bankAccountId);
    if (method === "cash") formData.set("from_user_id", fromUserId);

    formData.set(
      "items",
      JSON.stringify(
        items.map((item) => ({
          item_name: item.item_name,
          category_id: item.category_id,
          quantity: Number(item.quantity) || 1,
          unit_price: Number(item.unit_price) || 0,
          description: item.description || null,
        })),
      ),
    );

    const result = await createBulkExpenses(formData);
    if ("success" in result && result.success && "ids" in result) {
      // Upload receipts to all created entries
      if (receiptFiles.length > 0) {
        const supabase = createClient();
        for (const entryId of result.ids as string[]) {
          for (const file of receiptFiles) {
            const path = `${entryId}/${crypto.randomUUID()}.jpg`;
            const { error: uploadError } = await supabase.storage
              .from("receipts")
              .upload(path, file, { contentType: file.type });
            if (!uploadError) {
              await uploadReceipt(entryId, path, file.name, file.size);
            }
          }
        }
      }
      toast.success(`${items.length} expenses created`);
      router.push("/protected/expenses");
      router.refresh();
    } else {
      const errorMsg =
        "error" in result && typeof result.error === "string"
          ? result.error
          : "Failed to create expenses";
      toast.error(errorMsg);
    }
    setSaving(false);
  }

  return (
    <div className="space-y-6">
      {/* Back link */}
      <Button variant="ghost" size="sm" asChild>
        <Link href="/protected/expenses">
          <ArrowLeft className="mr-1 size-4" />
          Back to Expenses
        </Link>
      </Button>

      {/* Shared fields */}
      <div className="grid gap-4 rounded-lg border p-4 md:grid-cols-3 lg:grid-cols-5">
        {/* Method */}
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">
            Method
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

        {/* Source */}
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">
            {method === "bank" ? "Bank Account" : "Paying Volunteer"}
          </label>
          {method === "bank" ? (
            <Select
              value={bankAccountId}
              onValueChange={setBankAccountId}
            >
              <SelectTrigger className="text-sm">
                <SelectValue placeholder="Select" />
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
            <VolunteerCombobox
              volunteers={volunteers}
              value={fromUserId}
              onChange={setFromUserId}
              placeholder="Type volunteer name..."
            />
          )}
        </div>

        {/* Date */}
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">
            Date
          </label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                type="button"
                variant="outline"
                className="w-full justify-start text-left text-sm font-normal"
              >
                <CalendarIcon className="mr-1.5 size-3.5 shrink-0 opacity-60" />
                {format(date, "dd MMM yyyy")}
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

        {/* Drive */}
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
                .filter((c) => c.type === "drive")
                .map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
        </div>

        {/* Custodian (general only) */}
        {isGeneral && (
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">
              Custodian
            </label>
            <VolunteerCombobox
              volunteers={volunteers}
              value={custodianId}
              onChange={setCustodianId}
              placeholder="Who has these items?"
            />
          </div>
        )}
      </div>

      {/* Receipt upload for batch */}
      <div className="space-y-2 rounded-lg border p-4">
        <label className="flex items-center gap-1 text-xs font-medium text-muted-foreground">
          Receipt images (shared for all items)
          {receiptRequired && (
            <span className="text-destructive">*</span>
          )}
        </label>
        <div className="flex flex-wrap gap-2">
          {receiptFiles.map((file, i) => (
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
                onClick={() =>
                  setReceiptFiles(receiptFiles.filter((_, j) => j !== i))
                }
                className="absolute -right-0.5 -top-0.5 rounded-full bg-destructive p-0.5 text-destructive-foreground"
              >
                <X className="size-2.5" />
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={() => receiptInputRef.current?.click()}
            className="flex size-14 items-center justify-center rounded-md border border-dashed text-muted-foreground transition-colors hover:border-foreground hover:text-foreground"
          >
            <ImageIcon className="size-5" />
          </button>
        </div>
        <input
          ref={receiptInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={handleReceiptFiles}
        />
      </div>

      {/* Line items grid */}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[220px]">Item Name</TableHead>
            <TableHead className="w-[160px]">Category</TableHead>
            <TableHead className="w-[80px] text-right">Qty</TableHead>
            <TableHead className="w-[120px] text-right">
              Unit Price ({activeCurrency.code})
            </TableHead>
            <TableHead className="w-[120px] text-right">Total</TableHead>
            <TableHead className="w-12" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item, index) => {
            const total =
              (Number(item.quantity) || 0) *
              (Number(item.unit_price) || 0);
            return (
              <TableRow key={item.id}>
                <TableCell className="p-1.5">
                  <ItemNameCombobox
                    itemNames={itemNames}
                    value={item.item_name}
                    onChange={(v) => updateItem(index, { item_name: v })}
                  />
                </TableCell>
                <TableCell className="p-1.5">
                  <Select
                    value={item.category_id}
                    onValueChange={(v) =>
                      updateItem(index, { category_id: v })
                    }
                  >
                    <SelectTrigger className="text-sm">
                      <SelectValue placeholder="Category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id}>
                          {cat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell className="p-1.5">
                  <Input
                    type="number"
                    min={1}
                    step="any"
                    value={item.quantity}
                    onChange={(e) =>
                      updateItem(index, { quantity: e.target.value })
                    }
                    className="text-right text-sm"
                  />
                </TableCell>
                <TableCell className="p-1.5">
                  <Input
                    type="number"
                    min={0}
                    step="any"
                    placeholder="0.00"
                    value={item.unit_price}
                    onChange={(e) =>
                      updateItem(index, { unit_price: e.target.value })
                    }
                    className="text-right text-sm"
                  />
                </TableCell>
                <TableCell className="p-1.5 text-right text-sm font-medium">
                  {total > 0
                    ? formatCurrency(total, activeCurrency.symbol)
                    : "-"}
                </TableCell>
                <TableCell className="p-1.5">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeItem(index)}
                    disabled={items.length === 1}
                    className="size-8"
                  >
                    <Trash2 className="size-3.5 text-destructive" />
                  </Button>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>

      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setItems([...items, newLineItem()])}
        >
          <Plus className="mr-1 size-4" />
          Add Row
        </Button>
        <div className="text-sm">
          <span className="text-muted-foreground">Grand Total: </span>
          <span className="text-lg font-bold">
            {formatCurrency(
              grandTotal * activeCurrency.exchange_rate,
              "Rs",
            )}
          </span>
        </div>
      </div>

      {/* Submit */}
      <div className="flex justify-end gap-2 border-t pt-4">
        <Button variant="outline" asChild>
          <Link href="/protected/expenses">Cancel</Link>
        </Button>
        <Button onClick={handleSubmit} disabled={saving}>
          {saving ? (
            <>
              <Loader2 className="mr-1.5 size-3.5 animate-spin" />
              Saving {items.length} items...
            </>
          ) : (
            `Save ${items.length} item${items.length > 1 ? "s" : ""}`
          )}
        </Button>
      </div>
    </div>
  );
}
