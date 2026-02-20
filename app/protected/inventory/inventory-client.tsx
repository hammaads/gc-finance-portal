"use client";

import { useEffect, useState } from "react";
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
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import { Textarea } from "@/components/ui/textarea";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  ArrowRightLeft,
  Clock3,
  Minus,
  Search,
  ShoppingCart,
} from "lucide-react";
import { toast } from "sonner";
import { formatCurrency, formatDate } from "@/lib/format";
import {
  adjustInventory,
  consumeInventory,
  getInventoryHistory,
  transferCustody,
} from "@/lib/actions/inventory";

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
  category_id: string;
  available_qty: number;
  consumed_qty: number;
  item_key: string;
  source_type: "donated" | "purchased";
};

type InventoryHistoryEntry = {
  id: string;
  created_at: string;
  change_type: string;
  source: string;
  delta_qty: number;
  notes: string | null;
  reference_table: string | null;
  reference_id: string | null;
};

type CustodianEntry = {
  ledger_entry_id: string;
  item_name: string;
  volunteer_id: string;
  qty_held: number;
};

type Cause = { id: string; name: string };
type Volunteer = { id: string; name: string };

interface InventoryClientProps {
  inventoryItems: InventoryItem[];
  custodianData: CustodianEntry[];
  causes: Cause[];
  volunteers: Volunteer[];
}

function ConsumeDialog({
  item,
  causes,
}: {
  item: InventoryItem;
  causes: Cause[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [causeId, setCauseId] = useState("");
  const [quantity, setQuantity] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  const unitPricePkr = Number(item.amount_pkr) / Math.max(Number(item.purchased_qty), 1);
  const allocatedCost = (Number(quantity) || 0) * unitPricePkr;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    const formData = new FormData();
    formData.set("ledger_entry_id", item.ledger_entry_id);
    formData.set("cause_id", causeId);
    formData.set("quantity", quantity);
    formData.set("notes", notes);

    const result = await consumeInventory(formData);
    if ("success" in result && result.success) {
      toast.success(`${quantity} x ${item.item_name} consumed`);
      setOpen(false);
      setCauseId("");
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
        <Button variant="ghost" size="icon" title="Consume in drive">
          <ShoppingCart className="size-4" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Consume: {item.item_name}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Source: {item.source_type === "donated" ? "In-kind donation" : "Purchased"}
          </p>
          <div className="space-y-2">
            <Label>Drive</Label>
            <Select value={causeId} onValueChange={setCauseId}>
              <SelectTrigger>
                <SelectValue placeholder="Select drive" />
              </SelectTrigger>
              <SelectContent>
                {causes.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Quantity (max {Number(item.available_qty)})</Label>
            <Input
              type="number"
              min={1}
              max={Number(item.available_qty)}
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
              placeholder="e.g. Iftaar Drive - Sector 11 distribution"
              required
            />
          </div>
          {Number(quantity) > 0 && (
            <div className="rounded-md bg-muted/50 px-3 py-2 text-sm">
              Cost allocated to drive:{" "}
              <span className="font-semibold">{formatCurrency(allocatedCost)}</span>
            </div>
          )}
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </DialogClose>
            <Button type="submit" disabled={saving || !causeId || !quantity || !notes.trim()}>
              {saving ? "Consuming..." : "Consume"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function TransferDialog({
  item,
  custodians,
  volunteers,
}: {
  item: InventoryItem;
  custodians: CustodianEntry[];
  volunteers: Volunteer[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [fromVolunteerId, setFromVolunteerId] = useState("");
  const [toVolunteerId, setToVolunteerId] = useState("");
  const [quantity, setQuantity] = useState("");
  const [saving, setSaving] = useState(false);

  const selectedCustodian = custodians.find(
    (c) => c.volunteer_id === fromVolunteerId,
  );
  const maxQty = selectedCustodian ? Number(selectedCustodian.qty_held) : 0;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    const formData = new FormData();
    formData.set("ledger_entry_id", item.ledger_entry_id);
    formData.set("from_volunteer_id", fromVolunteerId);
    formData.set("to_volunteer_id", toVolunteerId);
    formData.set("quantity", quantity);

    const result = await transferCustody(formData);
    if ("success" in result && result.success) {
      toast.success("Custody transferred");
      setOpen(false);
      setFromVolunteerId("");
      setToVolunteerId("");
      setQuantity("");
      router.refresh();
    } else {
      const errors =
        "error" in result && typeof result.error === "object"
          ? Object.values(result.error as Record<string, string[]>)
              .flat()
              .join(", ")
          : "Failed to transfer";
      toast.error(errors);
    }
    setSaving(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" title="Transfer custody">
          <ArrowRightLeft className="size-4" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Transfer: {item.item_name}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>From Volunteer</Label>
            <Select value={fromVolunteerId} onValueChange={setFromVolunteerId}>
              <SelectTrigger>
                <SelectValue placeholder="Select holder" />
              </SelectTrigger>
              <SelectContent>
                {custodians.map((c) => {
                  const profile = volunteers.find((p) => p.id === c.volunteer_id);
                  return (
                    <SelectItem key={c.volunteer_id} value={c.volunteer_id}>
                      {profile?.name ?? "Unknown"} ({Number(c.qty_held)} held)
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>To Volunteer</Label>
            <Select value={toVolunteerId} onValueChange={setToVolunteerId}>
              <SelectTrigger>
                <SelectValue placeholder="Select recipient" />
              </SelectTrigger>
              <SelectContent>
                {volunteers
                  .filter((p) => p.id !== fromVolunteerId)
                  .map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
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
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </DialogClose>
            <Button
              type="submit"
              disabled={saving || !fromVolunteerId || !toVolunteerId || !quantity}
            >
              {saving ? "Transferring..." : "Transfer"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function AdjustDialog({ item }: { item: InventoryItem }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [newQty, setNewQty] = useState(String(item.available_qty));
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    const totalNewQty = Number(newQty) + Number(item.consumed_qty);
    const formData = new FormData();
    formData.set("ledger_entry_id", item.ledger_entry_id);
    formData.set("new_quantity", String(totalNewQty));

    const result = await adjustInventory(formData);
    if ("success" in result && result.success) {
      toast.success("Inventory adjusted");
      setOpen(false);
      router.refresh();
    } else {
      const errors =
        "error" in result && typeof result.error === "object"
          ? Object.values(result.error as Record<string, string[]>)
              .flat()
              .join(", ")
          : "Failed to adjust";
      toast.error(errors);
    }
    setSaving(false);
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        setOpen(v);
        if (v) setNewQty(String(item.available_qty));
      }}
    >
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" title="Adjust quantity">
          <Minus className="size-4" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Adjust: {item.item_name}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Current available: {Number(item.available_qty)} (
            {Number(item.consumed_qty)} already consumed)
          </p>
          <div className="space-y-2">
            <Label>New Available Quantity</Label>
            <Input
              type="number"
              min={0}
              value={newQty}
              onChange={(e) => setNewQty(e.target.value)}
              required
            />
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </DialogClose>
            <Button type="submit" disabled={saving}>
              {saving ? "Adjusting..." : "Adjust"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function HistoryDialog({ item }: { item: InventoryItem }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [entries, setEntries] = useState<InventoryHistoryEntry[]>([]);

  useEffect(() => {
    if (!open) return;

    let active = true;
    setLoading(true);
    getInventoryHistory(item.item_key)
      .then((data) => {
        if (active) {
          setEntries((data ?? []) as InventoryHistoryEntry[]);
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [open, item.item_key]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" title="History">
          <Clock3 className="size-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>History: {item.item_name}</DialogTitle>
        </DialogHeader>
        {loading ? (
          <p className="text-sm text-muted-foreground">Loading history...</p>
        ) : entries.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No history yet for this item.
          </p>
        ) : (
          <div className="space-y-2">
            {entries.map((entry) => (
              <div key={entry.id} className="rounded-md border p-3 text-sm">
                <div className="flex items-center justify-between">
                  <p className="font-medium capitalize">
                    {entry.change_type.replace("_", " ")}
                  </p>
                  <p
                    className={`font-medium ${
                      entry.delta_qty >= 0 ? "text-emerald-600" : "text-destructive"
                    }`}
                  >
                    {entry.delta_qty >= 0 ? "+" : ""}
                    {entry.delta_qty}
                  </p>
                </div>
                <p className="text-muted-foreground">
                  {formatDate(entry.created_at)} • {entry.source}
                </p>
                {entry.notes && <p className="mt-1">{entry.notes}</p>}
              </div>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

export function InventoryClient({
  inventoryItems,
  custodianData,
  causes,
  volunteers,
}: InventoryClientProps) {
  const [search, setSearch] = useState("");

  const filtered = search
    ? inventoryItems.filter((item) =>
        item.item_name.toLowerCase().includes(search.toLowerCase()),
      )
    : inventoryItems;

  function getCustodianDisplay(item: InventoryItem) {
    const custodians = custodianData.filter(
      (c) => c.ledger_entry_id === item.ledger_entry_id,
    );
    if (custodians.length === 0) {
      const p = volunteers.find((pr) => pr.id === item.original_custodian_id);
      return p?.name ?? "-";
    }
    if (custodians.length === 1) {
      const p = volunteers.find((pr) => pr.id === custodians[0].volunteer_id);
      return p?.name ?? "-";
    }

    const names = custodians.map((c) => {
      const p = volunteers.find((pr) => pr.id === c.volunteer_id);
      return `${p?.name ?? "?"}: ${Number(c.qty_held)}`;
    });
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger className="cursor-help underline decoration-dotted">
            {custodians.length} holders
          </TooltipTrigger>
          <TooltipContent>
            {names.map((n, i) => (
              <div key={i}>{n}</div>
            ))}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-medium">All Items ({inventoryItems.length})</h2>
        <div className="relative w-64">
          <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
          <Input
            placeholder="Search items..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8"
          />
        </div>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Item Name</TableHead>
            <TableHead className="text-right">Available</TableHead>
            <TableHead className="text-right">Unit Price</TableHead>
            <TableHead>Custodian</TableHead>
            <TableHead className="w-40 text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filtered.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="text-center text-muted-foreground">
                {search
                  ? "No items match your search."
                  : "No inventory items yet. Add a general expense to get started."}
              </TableCell>
            </TableRow>
          ) : (
            filtered.map((item) => {
              const custodians = custodianData.filter(
                (c) => c.ledger_entry_id === item.ledger_entry_id,
              );
              return (
                <TableRow key={item.ledger_entry_id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <span>{item.item_name}</span>
                      <span className="text-xs text-muted-foreground">
                        ({item.source_type === "donated" ? "Donation" : "Purchased"})
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">{Number(item.available_qty)}</TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(Number(item.unit_price))}
                  </TableCell>
                  <TableCell>{getCustodianDisplay(item)}</TableCell>
                  <TableCell className="text-right">
                    <ConsumeDialog item={item} causes={causes} />
                    <TransferDialog
                      item={item}
                      custodians={custodians}
                      volunteers={volunteers}
                    />
                    <AdjustDialog item={item} />
                    <HistoryDialog item={item} />
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
