"use client";

import { useState } from "react";
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
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Check,
  ChevronDown,
  ShoppingCart,
} from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { toast } from "sonner";
import { formatCurrency, formatDate } from "@/lib/format";
import { consumeInventory } from "@/lib/actions/inventory";
import { AddExpenseDialog } from "@/app/protected/expenses/expenses-client";

// ── Types ──

type DirectExpense = {
  id: string;
  item_name: string | null;
  quantity: number | null;
  unit_price: number | null;
  amount_pkr: number;
  date: string;
  expense_categories: { name: string }[] | { name: string } | null;
};

type ConsumedItem = {
  id: string;
  quantity: number;
  total_pkr: number;
  unit_price_pkr: number;
  source_type?: "donated" | "purchased";
  created_at: string;
  ledger_entry:
    | {
        item_name: string | null;
        expense_categories: { name: string }[] | { name: string } | null;
      }[]
    | {
        item_name: string | null;
        expense_categories: { name: string }[] | { name: string } | null;
      }
    | null;
};

type InventoryItem = {
  ledger_entry_id: string;
  item_name: string;
  purchased_qty: number;
  unit_price: number;
  currency_id: string;
  exchange_rate_to_pkr: number;
  amount_pkr: number;
  purchase_date: string;
  original_custodian_id: string;
  available_qty: number;
  consumed_qty: number;
  source_type?: "donated" | "purchased";
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

interface DriveExpensesClientProps {
  directExpenses: DirectExpense[];
  consumedItems: ConsumedItem[];
  inventoryItems: InventoryItem[];
  causeId: string;
  categories: ExpenseCategory[];
  currencies: Currency[];
  bankAccounts: BankAccount[];
  causes: Cause[];
  volunteers: Volunteer[];
  itemNames: string[];
  receiptRequired: boolean;
}

function inventorySourceLabel(sourceType?: "donated" | "purchased") {
  return sourceType === "donated" ? "Donated" : "Purchased";
}

function inventoryLotSummary(item: InventoryItem) {
  const received = item.purchase_date ? formatDate(item.purchase_date) : "Unknown date";
  const lotId = item.ledger_entry_id.slice(0, 8);
  return `${received} | Lot ${lotId}`;
}

// ── Consume from Inventory Dialog ──

function ConsumeFromInventoryDialog({
  inventoryItems,
  causeId,
}: {
  inventoryItems: InventoryItem[];
  causeId: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [selectedItemId, setSelectedItemId] = useState("");
  const [itemPickerOpen, setItemPickerOpen] = useState(false);
  const [itemSearch, setItemSearch] = useState("");
  const [quantity, setQuantity] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  const selectedItem = inventoryItems.find(
    (i) => i.ledger_entry_id === selectedItemId,
  );
  const maxQty = selectedItem ? Number(selectedItem.available_qty) : 0;
  const selectedSource = selectedItem
    ? inventorySourceLabel(selectedItem.source_type)
    : null;
  const unitPricePkr = selectedItem
    ? Number(selectedItem.amount_pkr) / Number(selectedItem.purchased_qty)
    : 0;
  const allocatedCost = (Number(quantity) || 0) * unitPricePkr;

  const normalizedSearch = itemSearch.trim().toLowerCase();
  const filteredInventoryItems = normalizedSearch
    ? inventoryItems.filter((item) => {
        const searchBlob = [
          item.item_name,
          inventorySourceLabel(item.source_type),
          item.purchase_date ? formatDate(item.purchase_date) : "",
          item.ledger_entry_id.slice(0, 8),
          String(item.available_qty),
        ]
          .join(" ")
          .toLowerCase();
        return searchBlob.includes(normalizedSearch);
      })
    : inventoryItems;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    const formData = new FormData();
    formData.set("ledger_entry_id", selectedItemId);
    formData.set("cause_id", causeId);
    formData.set("quantity", quantity);
    formData.set("notes", notes);

    const result = await consumeInventory(formData);
    if ("success" in result && result.success) {
      toast.success(
        `${quantity} × ${selectedItem?.item_name} consumed in this drive`,
      );
      setOpen(false);
      setSelectedItemId("");
      setItemSearch("");
      setItemPickerOpen(false);
      setQuantity("");
      setNotes("");
      router.refresh();
    } else {
      const errors =
        "error" in result && typeof result.error === "object"
          ? Object.values(result.error as Record<string, string[]>)
              .flat()
              .join(", ")
          : "Failed to consume inventory";
      toast.error(errors);
    }
    setSaving(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" disabled={inventoryItems.length === 0}>
          <ShoppingCart className="mr-1 size-4" />
          Consume from Inventory
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Consume Inventory Item</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Inventory Item</Label>
            <Popover open={itemPickerOpen} onOpenChange={setItemPickerOpen}>
              <PopoverTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  role="combobox"
                  aria-expanded={itemPickerOpen}
                  className="w-full justify-between font-normal"
                >
                  {selectedItem
                    ? `${selectedItem.item_name} (${Number(selectedItem.available_qty)} available)`
                    : "Search and select an inventory lot"}
                  <ChevronDown className="ml-2 size-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                <Command shouldFilter={false}>
                  <CommandInput
                    placeholder="Search by item, source, lot, date..."
                    value={itemSearch}
                    onValueChange={setItemSearch}
                  />
                  <CommandList>
                    <CommandEmpty>No matching inventory lot found.</CommandEmpty>
                    <CommandGroup>
                      {filteredInventoryItems.map((item) => (
                        <CommandItem
                          key={item.ledger_entry_id}
                          value={item.ledger_entry_id}
                          onSelect={() => {
                            setSelectedItemId(item.ledger_entry_id);
                            setItemPickerOpen(false);
                          }}
                        >
                          <div className="flex w-full items-start justify-between gap-2">
                            <div className="min-w-0">
                              <p className="truncate">{item.item_name}</p>
                              <p className="text-xs text-muted-foreground">
                                {inventorySourceLabel(item.source_type)} | {inventoryLotSummary(item)}
                              </p>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <span>{Number(item.available_qty)} avail</span>
                              {selectedItemId === item.ledger_entry_id ? (
                                <Check className="size-3.5 text-emerald-600" />
                              ) : null}
                            </div>
                          </div>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
            <p className="text-xs text-muted-foreground">
              If the same item exists in multiple lots (donated/purchased), consume each lot separately.
            </p>
          </div>
          {selectedItem && (
            <div className="rounded-md border bg-muted/30 px-3 py-2 text-sm">
              <div className="font-medium">{selectedItem.item_name}</div>
              <div className="text-muted-foreground">
                Source: {selectedSource} | {inventoryLotSummary(selectedItem)}
              </div>
              <div className="text-muted-foreground">
                Unit cost (PKR): {formatCurrency(unitPricePkr)}
              </div>
            </div>
          )}
          <div className="space-y-2">
            <Label>Quantity {maxQty > 0 && `(max ${maxQty})`}</Label>
            <Input
              type="number"
              min={1}
              max={maxQty || undefined}
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label>Used for / where it went</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="e.g. Iftaar Drive distribution"
              required
            />
          </div>
          {Number(quantity) > 0 && selectedItem && (
            <div className="rounded-md bg-muted/50 px-3 py-2 text-sm">
              Cost allocated to drive:{" "}
              <span className="font-semibold">
                {formatCurrency(allocatedCost)}
              </span>
            </div>
          )}
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </DialogClose>
            <Button
              type="submit"
              disabled={saving || !selectedItemId || !quantity || !notes.trim()}
            >
              {saving ? "Consuming..." : "Consume"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ── Main Component ──

export function DriveExpensesClient({
  directExpenses,
  consumedItems,
  inventoryItems,
  causeId,
  categories,
  currencies,
  bankAccounts,
  causes,
  volunteers,
  itemNames,
  receiptRequired,
}: DriveExpensesClientProps) {
  // Build unified rows
  type Row = {
    key: string;
    itemName: string;
    category: string;
    qty: number;
    unitPricePkr: number;
    totalPkr: number;
    source: "direct" | "inventory";
    sourceLabel: string;
  };

  const rows: Row[] = [];

  function getCategoryName(
    cats: { name: string }[] | { name: string } | null | undefined,
  ): string {
    if (!cats) return "—";
    if (Array.isArray(cats)) return cats[0]?.name ?? "—";
    return cats.name ?? "—";
  }

  for (const exp of directExpenses) {
    rows.push({
      key: `direct-${exp.id}`,
      itemName: exp.item_name ?? "—",
      category: getCategoryName(exp.expense_categories),
      qty: Number(exp.quantity ?? 1),
      unitPricePkr:
        Number(exp.amount_pkr) / Math.max(Number(exp.quantity ?? 1), 1),
      totalPkr: Number(exp.amount_pkr),
      source: "direct",
      sourceLabel: "Direct",
    });
  }

  for (const c of consumedItems) {
    const entry = Array.isArray(c.ledger_entry)
      ? c.ledger_entry[0]
      : c.ledger_entry;
    rows.push({
      key: `consumed-${c.id}`,
      itemName: entry?.item_name ?? "—",
      category: getCategoryName(entry?.expense_categories),
      qty: Number(c.quantity),
      unitPricePkr: Number(c.unit_price_pkr),
      totalPkr: Number(c.total_pkr),
      source: "inventory",
      sourceLabel: `Inventory (${inventorySourceLabel(c.source_type)})`,
    });
  }

  const grandTotal = rows.reduce((sum, r) => sum + r.totalPkr, 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-medium">
          Expense Breakdown ({rows.length} items)
        </h2>
        <div className="flex items-center gap-2">
          <AddExpenseDialog
            categories={categories}
            currencies={currencies}
            bankAccounts={bankAccounts}
            causes={causes}
            volunteers={volunteers}
            itemNames={itemNames}
            receiptRequired={receiptRequired}
            defaultCauseId={causeId}
            lockCause
            triggerLabel="Add Direct Expense"
          />
          <ConsumeFromInventoryDialog
            inventoryItems={inventoryItems}
            causeId={causeId}
          />
        </div>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Item Name</TableHead>
            <TableHead>Category</TableHead>
            <TableHead className="text-right">Qty</TableHead>
            <TableHead className="text-right">Unit Price (PKR)</TableHead>
            <TableHead className="text-right">Total (PKR)</TableHead>
            <TableHead>Source</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={6}
                className="text-center text-muted-foreground"
              >
                No expenses yet. Add expenses directly or consume from
                inventory.
              </TableCell>
            </TableRow>
          ) : (
            <>
              {rows.map((row) => (
                <TableRow key={row.key}>
                  <TableCell className="font-medium">{row.itemName}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {row.category}
                  </TableCell>
                  <TableCell className="text-right">{row.qty}</TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(row.unitPricePkr)}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(row.totalPkr)}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        row.source === "direct" ? "default" : "secondary"
                      }
                    >
                      {row.sourceLabel}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
              <TableRow className="border-t-2 font-semibold">
                <TableCell colSpan={4} className="text-right">
                  Grand Total
                </TableCell>
                <TableCell className="text-right">
                  {formatCurrency(grandTotal)}
                </TableCell>
                <TableCell />
              </TableRow>
            </>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
