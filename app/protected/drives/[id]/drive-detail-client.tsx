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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { formatCurrency } from "@/lib/format";
import {
  createBudgetItem,
  updateBudgetItem,
  deleteBudgetItem,
} from "@/lib/actions/budget";

// ── Types ──

type BudgetItem = {
  id: string;
  cause_id: string;
  category_id: string;
  description: string;
  quantity: number;
  unit_price: number;
  currency_id: string;
  exchange_rate_to_pkr: number;
  expense_categories: { name: string } | null;
  currencies: { code: string; symbol: string } | null;
};

type Category = {
  id: string;
  name: string;
};

type Currency = {
  id: string;
  code: string;
  name: string;
  symbol: string;
  exchange_rate_to_pkr: number;
  is_base: boolean;
};

interface DriveDetailClientProps {
  budgetItems: BudgetItem[];
  categories: Category[];
  currencies: Currency[];
  causeId: string;
}

// ── Add Budget Item Dialog ──

function AddBudgetItemDialog({
  categories,
  currencies,
  causeId,
}: {
  categories: Category[];
  currencies: Currency[];
  causeId: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [selectedCurrencyId, setSelectedCurrencyId] = useState<string>("");

  const selectedCurrency = currencies.find((c) => c.id === selectedCurrencyId);

  const [, formAction, pending] = useActionState(
    async (_prev: unknown, formData: FormData) => {
      const result = await createBudgetItem(formData);
      if ("success" in result && result.success) {
        toast.success("Budget item created");
        setOpen(false);
        setSelectedCurrencyId("");
        router.refresh();
      } else {
        toast.error("Failed to create budget item");
      }
      return result;
    },
    null,
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="mr-1 size-4" />
          Add Budget Item
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Budget Item</DialogTitle>
        </DialogHeader>
        <form action={formAction} className="space-y-4">
          <input type="hidden" name="cause_id" value={causeId} />
          <div className="space-y-2">
            <Label htmlFor="add-bi-category">Category</Label>
            <Select name="category_id" required>
              <SelectTrigger id="add-bi-category" className="w-full">
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
          </div>
          <div className="space-y-2">
            <Label htmlFor="add-bi-description">Description</Label>
            <Input
              id="add-bi-description"
              name="description"
              placeholder="e.g. Biryani packets"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="add-bi-quantity">Quantity</Label>
              <Input
                id="add-bi-quantity"
                name="quantity"
                type="number"
                min={1}
                defaultValue={1}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="add-bi-unit-price">Unit Price</Label>
              <Input
                id="add-bi-unit-price"
                name="unit_price"
                type="number"
                step="any"
                min={0}
                defaultValue={0}
                required
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="add-bi-currency">Currency</Label>
              <Select
                name="currency_id"
                required
                onValueChange={setSelectedCurrencyId}
              >
                <SelectTrigger id="add-bi-currency" className="w-full">
                  <SelectValue placeholder="Select currency" />
                </SelectTrigger>
                <SelectContent>
                  {currencies.map((cur) => (
                    <SelectItem key={cur.id} value={cur.id}>
                      {cur.code} ({cur.symbol})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="add-bi-rate">Exchange Rate to PKR</Label>
              <Input
                id="add-bi-rate"
                name="exchange_rate_to_pkr"
                type="number"
                step="any"
                min={0}
                defaultValue={selectedCurrency?.exchange_rate_to_pkr ?? 1}
                key={selectedCurrencyId}
                required
              />
            </div>
          </div>
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

// ── Edit Budget Item Dialog ──

function EditBudgetItemDialog({
  item,
  categories,
  currencies,
}: {
  item: BudgetItem;
  categories: Category[];
  currencies: Currency[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const [, formAction, pending] = useActionState(
    async (_prev: unknown, formData: FormData) => {
      const result = await updateBudgetItem(formData);
      if ("success" in result && result.success) {
        toast.success("Budget item updated");
        setOpen(false);
        router.refresh();
      } else {
        toast.error("Failed to update budget item");
      }
      return result;
    },
    null,
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon">
          <Pencil className="size-4" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Budget Item</DialogTitle>
        </DialogHeader>
        <form action={formAction} className="space-y-4">
          <input type="hidden" name="id" value={item.id} />
          <input type="hidden" name="cause_id" value={item.cause_id} />
          <div className="space-y-2">
            <Label htmlFor={`edit-bi-category-${item.id}`}>Category</Label>
            <Select name="category_id" defaultValue={item.category_id} required>
              <SelectTrigger
                id={`edit-bi-category-${item.id}`}
                className="w-full"
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
          </div>
          <div className="space-y-2">
            <Label htmlFor={`edit-bi-description-${item.id}`}>
              Description
            </Label>
            <Input
              id={`edit-bi-description-${item.id}`}
              name="description"
              defaultValue={item.description}
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor={`edit-bi-quantity-${item.id}`}>Quantity</Label>
              <Input
                id={`edit-bi-quantity-${item.id}`}
                name="quantity"
                type="number"
                min={1}
                defaultValue={item.quantity}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor={`edit-bi-unit-price-${item.id}`}>
                Unit Price
              </Label>
              <Input
                id={`edit-bi-unit-price-${item.id}`}
                name="unit_price"
                type="number"
                step="any"
                min={0}
                defaultValue={item.unit_price}
                required
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor={`edit-bi-currency-${item.id}`}>Currency</Label>
              <Select
                name="currency_id"
                defaultValue={item.currency_id}
                required
              >
                <SelectTrigger
                  id={`edit-bi-currency-${item.id}`}
                  className="w-full"
                >
                  <SelectValue placeholder="Select currency" />
                </SelectTrigger>
                <SelectContent>
                  {currencies.map((cur) => (
                    <SelectItem key={cur.id} value={cur.id}>
                      {cur.code} ({cur.symbol})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor={`edit-bi-rate-${item.id}`}>
                Exchange Rate to PKR
              </Label>
              <Input
                id={`edit-bi-rate-${item.id}`}
                name="exchange_rate_to_pkr"
                type="number"
                step="any"
                min={0}
                defaultValue={item.exchange_rate_to_pkr}
                required
              />
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </DialogClose>
            <Button type="submit" disabled={pending}>
              {pending ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ── Delete Budget Item Dialog ──

function DeleteBudgetItemDialog({
  item,
}: {
  item: BudgetItem;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    setDeleting(true);
    const result = await deleteBudgetItem(item.id, item.cause_id);
    if ("success" in result && result.success) {
      toast.success("Budget item deleted");
      setOpen(false);
      router.refresh();
    } else {
      toast.error("Failed to delete budget item");
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
          <DialogTitle>Delete Budget Item</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          Are you sure you want to delete{" "}
          <span className="font-medium text-foreground">
            {item.description}
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

// ── Main Client Component ──

export function DriveDetailClient({
  budgetItems,
  categories,
  currencies,
  causeId,
}: DriveDetailClientProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-medium">Budget Items</h2>
        <AddBudgetItemDialog
          categories={categories}
          currencies={currencies}
          causeId={causeId}
        />
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Category</TableHead>
            <TableHead>Description</TableHead>
            <TableHead className="text-right">Qty</TableHead>
            <TableHead className="text-right">Unit Price</TableHead>
            <TableHead>Currency</TableHead>
            <TableHead className="text-right">Total PKR</TableHead>
            <TableHead className="w-24 text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {budgetItems.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={7}
                className="text-center text-muted-foreground"
              >
                No budget items yet. Add one to get started.
              </TableCell>
            </TableRow>
          ) : (
            budgetItems.map((item) => {
              const totalPkr =
                item.quantity * item.unit_price * item.exchange_rate_to_pkr;
              return (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">
                    {item.expense_categories?.name ?? "—"}
                  </TableCell>
                  <TableCell>{item.description}</TableCell>
                  <TableCell className="text-right">{item.quantity}</TableCell>
                  <TableCell className="text-right">
                    {item.currencies?.symbol ?? ""}{" "}
                    {item.unit_price.toLocaleString("en-PK", {
                      minimumFractionDigits: 0,
                      maximumFractionDigits: 2,
                    })}
                  </TableCell>
                  <TableCell>{item.currencies?.code ?? "—"}</TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(totalPkr)}
                  </TableCell>
                  <TableCell className="text-right">
                    <EditBudgetItemDialog
                      item={item}
                      categories={categories}
                      currencies={currencies}
                    />
                    <DeleteBudgetItemDialog item={item} />
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
