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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { Badge } from "@/components/ui/badge";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  createExpenseCategory,
  updateExpenseCategory,
  deleteExpenseCategory,
  createCurrency,
  updateCurrency,
  deleteCurrency,
} from "@/lib/actions/settings";
import { deleteDriveTemplate } from "@/lib/actions/budget";

// ── Types ──

type Category = {
  id: string;
  name: string;
  created_at: string;
};

type Currency = {
  id: string;
  code: string;
  name: string;
  symbol: string;
  exchange_rate_to_pkr: number;
  is_base: boolean;
};

type Template = {
  id: string;
  name: string;
  template_data: unknown;
};

interface SettingsClientProps {
  categories: Category[];
  currencies: Currency[];
  templates: Template[];
}

// ── Add Category Dialog ──

function AddCategoryDialog() {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const [, formAction, pending] = useActionState(
    async (_prev: unknown, formData: FormData) => {
      const result = await createExpenseCategory(formData);
      if ("success" in result && result.success) {
        toast.success("Category created");
        setOpen(false);
        router.refresh();
      } else {
        toast.error("Failed to create category");
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
          Add Category
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Category</DialogTitle>
        </DialogHeader>
        <form action={formAction} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="add-category-name">Name</Label>
            <Input
              id="add-category-name"
              name="name"
              placeholder="e.g. Transportation"
              required
            />
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

// ── Edit Category Dialog ──

function EditCategoryDialog({ category }: { category: Category }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const [, formAction, pending] = useActionState(
    async (_prev: unknown, formData: FormData) => {
      const result = await updateExpenseCategory(formData);
      if ("success" in result && result.success) {
        toast.success("Category updated");
        setOpen(false);
        router.refresh();
      } else {
        toast.error("Failed to update category");
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
          <DialogTitle>Edit Category</DialogTitle>
        </DialogHeader>
        <form action={formAction} className="space-y-4">
          <input type="hidden" name="id" value={category.id} />
          <div className="space-y-2">
            <Label htmlFor={`edit-category-name-${category.id}`}>Name</Label>
            <Input
              id={`edit-category-name-${category.id}`}
              name="name"
              defaultValue={category.name}
              required
            />
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

// ── Delete Category Dialog ──

function DeleteCategoryDialog({ category }: { category: Category }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    setDeleting(true);
    const result = await deleteExpenseCategory(category.id);
    if ("success" in result && result.success) {
      toast.success("Category deleted");
      setOpen(false);
      router.refresh();
    } else {
      toast.error("Failed to delete category");
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
          <DialogTitle>Delete Category</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          Are you sure you want to delete{" "}
          <span className="font-medium text-foreground">{category.name}</span>?
          This action cannot be undone.
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

// ── Add Currency Dialog ──

function AddCurrencyDialog() {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const [, formAction, pending] = useActionState(
    async (_prev: unknown, formData: FormData) => {
      const result = await createCurrency(formData);
      if ("success" in result && result.success) {
        toast.success("Currency created");
        setOpen(false);
        router.refresh();
      } else {
        toast.error("Failed to create currency");
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
          Add Currency
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Currency</DialogTitle>
        </DialogHeader>
        <form action={formAction} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="add-currency-code">Code</Label>
              <Input
                id="add-currency-code"
                name="code"
                placeholder="e.g. USD"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="add-currency-name">Name</Label>
              <Input
                id="add-currency-name"
                name="name"
                placeholder="e.g. US Dollar"
                required
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="add-currency-symbol">Symbol</Label>
              <Input
                id="add-currency-symbol"
                name="symbol"
                placeholder="e.g. $"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="add-currency-rate">Exchange Rate to PKR</Label>
              <Input
                id="add-currency-rate"
                name="exchange_rate_to_pkr"
                type="number"
                step="any"
                placeholder="e.g. 278.50"
                required
              />
            </div>
          </div>
          <input type="hidden" name="is_base" value="false" />
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

// ── Edit Currency Dialog ──

function EditCurrencyDialog({ currency }: { currency: Currency }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const [, formAction, pending] = useActionState(
    async (_prev: unknown, formData: FormData) => {
      const result = await updateCurrency(formData);
      if ("success" in result && result.success) {
        toast.success("Currency updated");
        setOpen(false);
        router.refresh();
      } else {
        toast.error("Failed to update currency");
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
          <DialogTitle>Edit Currency</DialogTitle>
        </DialogHeader>
        <form action={formAction} className="space-y-4">
          <input type="hidden" name="id" value={currency.id} />
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor={`edit-currency-code-${currency.id}`}>Code</Label>
              <Input
                id={`edit-currency-code-${currency.id}`}
                name="code"
                defaultValue={currency.code}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor={`edit-currency-name-${currency.id}`}>Name</Label>
              <Input
                id={`edit-currency-name-${currency.id}`}
                name="name"
                defaultValue={currency.name}
                required
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor={`edit-currency-symbol-${currency.id}`}>
                Symbol
              </Label>
              <Input
                id={`edit-currency-symbol-${currency.id}`}
                name="symbol"
                defaultValue={currency.symbol}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor={`edit-currency-rate-${currency.id}`}>
                Exchange Rate to PKR
              </Label>
              <Input
                id={`edit-currency-rate-${currency.id}`}
                name="exchange_rate_to_pkr"
                type="number"
                step="any"
                defaultValue={currency.exchange_rate_to_pkr}
                required
              />
            </div>
          </div>
          <input
            type="hidden"
            name="is_base"
            value={String(currency.is_base)}
          />
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

// ── Delete Currency Dialog ──

function DeleteCurrencyDialog({ currency }: { currency: Currency }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    setDeleting(true);
    const result = await deleteCurrency(currency.id);
    if ("success" in result && result.success) {
      toast.success("Currency deleted");
      setOpen(false);
      router.refresh();
    } else {
      toast.error("Failed to delete currency");
    }
    setDeleting(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          disabled={currency.is_base}
          title={currency.is_base ? "Cannot delete base currency" : undefined}
        >
          <Trash2
            className={`size-4 ${currency.is_base ? "text-muted-foreground" : "text-destructive"}`}
          />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete Currency</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          Are you sure you want to delete{" "}
          <span className="font-medium text-foreground">
            {currency.name} ({currency.code})
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

// ── Delete Template Dialog ──

function DeleteTemplateDialog({ template }: { template: Template }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    setDeleting(true);
    const result = await deleteDriveTemplate(template.id);
    if ("success" in result && result.success) {
      toast.success("Template deleted");
      setOpen(false);
      router.refresh();
    } else {
      toast.error("Failed to delete template");
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
          <DialogTitle>Delete Template</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          Are you sure you want to delete{" "}
          <span className="font-medium text-foreground">{template.name}</span>?
          This action cannot be undone.
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

// ── Main Settings Client ──

export function SettingsClient({
  categories,
  currencies,
  templates,
}: SettingsClientProps) {
  return (
    <Tabs defaultValue="categories">
      <TabsList>
        <TabsTrigger value="categories">Categories</TabsTrigger>
        <TabsTrigger value="currencies">Currencies</TabsTrigger>
        <TabsTrigger value="templates">Templates</TabsTrigger>
      </TabsList>

      {/* ── Categories Tab ── */}
      <TabsContent value="categories" className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-medium">Expense Categories</h2>
          <AddCategoryDialog />
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead className="w-24 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {categories.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={2}
                  className="text-center text-muted-foreground"
                >
                  No categories yet. Add one to get started.
                </TableCell>
              </TableRow>
            ) : (
              categories.map((category) => (
                <TableRow key={category.id}>
                  <TableCell>{category.name}</TableCell>
                  <TableCell className="text-right">
                    <EditCategoryDialog category={category} />
                    <DeleteCategoryDialog category={category} />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TabsContent>

      {/* ── Currencies Tab ── */}
      <TabsContent value="currencies" className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-medium">Currencies</h2>
          <AddCurrencyDialog />
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Code</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Symbol</TableHead>
              <TableHead>Exchange Rate to PKR</TableHead>
              <TableHead>Base?</TableHead>
              <TableHead className="w-24 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {currencies.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="text-center text-muted-foreground"
                >
                  No currencies yet. Add one to get started.
                </TableCell>
              </TableRow>
            ) : (
              currencies.map((currency) => (
                <TableRow key={currency.id}>
                  <TableCell className="font-medium">{currency.code}</TableCell>
                  <TableCell>{currency.name}</TableCell>
                  <TableCell>{currency.symbol}</TableCell>
                  <TableCell>{currency.exchange_rate_to_pkr}</TableCell>
                  <TableCell>
                    {currency.is_base ? (
                      <Badge variant="default">Base</Badge>
                    ) : (
                      <Badge variant="outline">No</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <EditCurrencyDialog currency={currency} />
                    <DeleteCurrencyDialog currency={currency} />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TabsContent>

      {/* ── Templates Tab ── */}
      <TabsContent value="templates" className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-medium">Budget Templates</h2>
          <p className="text-sm text-muted-foreground">
            Templates are created from the drive detail page.
          </p>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead className="w-24 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {templates.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={2}
                  className="text-center text-muted-foreground"
                >
                  No templates yet. Save one from a drive&apos;s budget page.
                </TableCell>
              </TableRow>
            ) : (
              templates.map((template) => (
                <TableRow key={template.id}>
                  <TableCell>{template.name}</TableCell>
                  <TableCell className="text-right">
                    <DeleteTemplateDialog template={template} />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TabsContent>
    </Tabs>
  );
}
