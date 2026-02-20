"use client";

import { useState, useEffect, useActionState } from "react";
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
import { Plus, Pencil, Trash2, AlertCircle, Bell, BellOff, Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  createExpenseCategory,
  updateExpenseCategory,
  deleteExpenseCategory,
  createCurrency,
  updateCurrency,
  deleteCurrency,
} from "@/lib/actions/settings";
import {
  createDriveTemplate,
  updateDriveTemplate,
  deleteDriveTemplate,
} from "@/lib/actions/budget";
import { updateReceiptSetting } from "@/lib/actions/receipts";
import {
  subscribePush,
  unsubscribePush,
  getPushSubscriptionStatus,
} from "@/lib/actions/push-notifications";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { TemplateItem } from "@/lib/schemas/templates";
import { CategoryCombobox } from "@/components/ui/category-combobox";
import { cn } from "@/lib/utils";

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
  receiptRequired: boolean;
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

// ── Create Template Dialog ──

type TemplateItemDraft = {
  type: "variable" | "fixed";
  category_id: string;
  description: string;
  people_per_unit?: number | string;
  price_per_unit: number | string;
  currency_id: string;
  exchange_rate_to_pkr?: number | string;
};

function getEmptyVariableItem(defaultCurrencyId: string): TemplateItemDraft {
  return {
    type: "variable",
    category_id: "",
    description: "",
    people_per_unit: 1,
    price_per_unit: 0,
    currency_id: defaultCurrencyId,
    exchange_rate_to_pkr: 1,
  };
}

function getDefaultCurrencyId(currencies: Currency[]): string {
  const pkr = currencies.find((c) => c.is_base || c.code === "PKR");
  return pkr?.id ?? currencies[0]?.id ?? "";
}


type FieldErrors = {
  name?: boolean;
  items?: Record<
    number,
    {
      description?: boolean;
      category_id?: boolean;
      currency_id?: boolean;
    }
  >;
};

const ERROR_MSG = "Please fill in this field.";

function FieldError({ show }: { show?: boolean }) {
  if (!show) return null;
  return (
    <p className="flex items-center gap-2 text-sm text-destructive">
      <AlertCircle className="size-4 shrink-0" />
      {ERROR_MSG}
    </p>
  );
}

function CreateTemplateDialog({
  categories,
  currencies,
}: {
  categories: Category[];
  currencies: Currency[];
}) {
  const router = useRouter();
  const defaultCurrencyId = getDefaultCurrencyId(currencies);
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<TemplateItemDraft[]>(() => [
    getEmptyVariableItem(defaultCurrencyId),
  ]);
  const [nameValue, setNameValue] = useState("");
  const [errors, setErrors] = useState<FieldErrors>({});
  const [submitting, setSubmitting] = useState(false);

  const addItem = () => {
    setItems((prev) => [...prev, getEmptyVariableItem(defaultCurrencyId)]);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const updateItem = (
    index: number,
    updates: Partial<TemplateItemDraft>
  ) => {
    setItems(
      items.map((item, i) =>
        i === index ? { ...item, ...updates } : item
      )
    );
  };

  const validate = (): boolean => {
    const next: FieldErrors = {};
    if (!nameValue.trim()) next.name = true;

    const itemErrs: FieldErrors["items"] = {};
    items.forEach((item, i) => {
      const e: NonNullable<FieldErrors["items"]>[number] = {};
      if (!item.description.trim()) e.description = true;
      if (!item.category_id) e.category_id = true;
      if (!item.currency_id) e.currency_id = true;
      if (Object.keys(e).length > 0) itemErrs[i] = e;
    });
    if (Object.keys(itemErrs).length > 0) next.items = itemErrs;

    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    const formData = new FormData(e.currentTarget);
    const result = await createDriveTemplate(formData);
    if ("success" in result && result.success) {
      toast.success("Template created");
      setOpen(false);
      setItems([getEmptyVariableItem(defaultCurrencyId)]);
      setNameValue("");
      setErrors({});
      router.refresh();
    } else {
      toast.error("Failed to create template");
    }
    setSubmitting(false);
  };

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      setItems([getEmptyVariableItem(defaultCurrencyId)]);
      setNameValue("");
      setErrors({});
    }
    setOpen(isOpen);
  };

  const itemsToSubmit = items.map((item) => {
    if (item.type === "variable") {
      return {
        type: "variable" as const,
        category_id: item.category_id,
        description: item.description,
        people_per_unit: Number(item.people_per_unit) || 1,
        price_per_unit: Number(item.price_per_unit) || 0,
        currency_id: item.currency_id,
      };
    }
    return {
      type: "fixed" as const,
      category_id: item.category_id,
      description: item.description,
      price_per_unit: Number(item.price_per_unit) || 0,
      currency_id: item.currency_id,
    };
  });

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="mr-1 size-4" />
          Create Template
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Budget Template</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input type="hidden" name="name" value={nameValue} />
          <input type="hidden" name="items" value={JSON.stringify(itemsToSubmit)} />
          <div className="space-y-2">
            <Label htmlFor="create-template-name">Template Name</Label>
            <Input
              id="create-template-name"
              value={nameValue}
              onChange={(e) => setNameValue(e.target.value)}
              placeholder="e.g. Standard Iftar Drive"
              aria-invalid={!!errors.name}
            />
            <FieldError show={errors.name} />
          </div>

          <div className="space-y-4">
            <Label>Budget Items</Label>

            {items.map((item, index) => {
              const ie = errors.items?.[index];
              return (
              <Card key={index} className="p-3 gap-3 relative">
                <div className="absolute top-2 right-2">
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    className="size-8"
                    onClick={() => removeItem(index)}
                  >
                    <Trash2 className="size-4 text-destructive" />
                  </Button>
                </div>

                <div className="space-y-2 pr-8">
                  <Label htmlFor={`item-desc-${index}`}>Description</Label>
                  <Input
                    id={`item-desc-${index}`}
                    value={item.description}
                    onChange={(e) =>
                      updateItem(index, { description: e.target.value })
                    }
                    placeholder="e.g. Biryani 10kg Daig"
                    aria-invalid={!!ie?.description}
                  />
                  <FieldError show={ie?.description} />
                </div>

                <div className="space-y-2">
                  <Label>Category</Label>
                  <CategoryCombobox
                    categories={categories}
                    value={item.category_id}
                    onChange={(v) => updateItem(index, { category_id: v })}
                    placeholder="Search or select category"
                    hasError={!!ie?.category_id}
                  />
                  <FieldError show={ie?.category_id} />
                </div>
                <div className="space-y-2">
                  <Label>Type</Label>
                    <RadioGroup
                      value={item.type}
                      onValueChange={(v) =>
                        updateItem(index, {
                          type: v as "variable" | "fixed",
                          ...(v === "fixed"
                            ? { people_per_unit: undefined }
                            : { people_per_unit: 1 }),
                        })
                      }
                    >
                      <div className="flex gap-6">
                        <div className="flex items-center space-x-3">
                          <RadioGroupItem value="variable" id={`var-${index}`} />
                          <Label
                            htmlFor={`var-${index}`}
                            className={cn(
                              "cursor-pointer font-normal transition-colors",
                              item.type === "variable" && "font-medium text-foreground"
                            )}
                          >
                            Variable
                          </Label>
                        </div>
                        <div className="flex items-center space-x-3">
                          <RadioGroupItem value="fixed" id={`fix-${index}`} />
                          <Label
                            htmlFor={`fix-${index}`}
                            className={cn(
                              "cursor-pointer font-normal transition-colors",
                              item.type === "fixed" && "font-medium text-foreground"
                            )}
                          >
                            Fixed
                          </Label>
                        </div>
                      </div>
                    </RadioGroup>
                </div>

                {item.type === "variable" && (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor={`item-people-${index}`}>
                        People per unit
                      </Label>
                      <Input
                        id={`item-people-${index}`}
                        type="number"
                        min={0.01}
                        step="any"
                        value={
                          typeof item.people_per_unit === "number"
                            ? String(item.people_per_unit)
                            : (item.people_per_unit ?? "")
                        }
                        onChange={(e) =>
                          updateItem(index, {
                            people_per_unit: e.target.value,
                          })
                        }
                        onFocus={(e) => e.target.select()}
                        placeholder="e.g. 2"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`item-price-${index}`}>
                        Price per unit
                      </Label>
                      <Input
                        id={`item-price-${index}`}
                        type="number"
                        min={0}
                        step="any"
                        value={
                          typeof item.price_per_unit === "number"
                            ? String(item.price_per_unit)
                            : (item.price_per_unit ?? "")
                        }
                        onChange={(e) =>
                          updateItem(index, {
                            price_per_unit: e.target.value,
                          })
                        }
                        onFocus={(e) => e.target.select()}
                        placeholder="e.g. 220"
                      />
                    </div>
                  </div>
                )}

                {item.type === "fixed" && (
                  <div className="space-y-2">
                    <Label htmlFor={`item-price-fixed-${index}`}>
                      Price per unit
                    </Label>
                    <Input
                      id={`item-price-fixed-${index}`}
                      type="number"
                      min={0}
                      step="any"
                      value={
                        typeof item.price_per_unit === "number"
                          ? String(item.price_per_unit)
                          : (item.price_per_unit ?? "")
                      }
                      onChange={(e) =>
                        updateItem(index, {
                          price_per_unit: e.target.value,
                        })
                      }
                      onFocus={(e) => e.target.select()}
                      placeholder="e.g. 35000"
                    />
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Currency</Label>
                    <Select
                      value={item.currency_id || undefined}
                      onValueChange={(v) => {
                        const currency = currencies.find((c) => c.id === v);
                        updateItem(index, {
                          currency_id: v,
                          exchange_rate_to_pkr: currency?.exchange_rate_to_pkr ?? 1,
                        });
                      }}
                    >
                      <SelectTrigger
                        className="w-full"
                        aria-invalid={!!ie?.currency_id}
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
                    <FieldError show={ie?.currency_id} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor={`item-rate-${index}`}>
                      Exchange Rate to PKR
                    </Label>
                    <Input
                      id={`item-rate-${index}`}
                      type="number"
                      step="any"
                      min={0}
                      value={
                        typeof item.exchange_rate_to_pkr === "number"
                          ? String(item.exchange_rate_to_pkr)
                          : (item.exchange_rate_to_pkr ?? "1")
                      }
                      onChange={(e) =>
                        updateItem(index, {
                          exchange_rate_to_pkr: e.target.value,
                        })
                      }
                      onFocus={(e) => e.target.select()}
                      placeholder="1"
                    />
                  </div>
                </div>
              </Card>
              );
            })}

            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={addItem}
              className="w-full"
            >
              <Plus className="mr-1 size-3" />
              Add Item
            </Button>
          </div>

          <DialogFooter className="pt-4">
            <DialogClose asChild>
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </DialogClose>
            <Button type="submit" disabled={submitting || items.length === 0}>
              {submitting ? "Creating..." : "Create Template"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ── Edit Template Dialog ──

function EditTemplateDialog({
  template,
  categories,
  currencies,
}: {
  template: Template;
  categories: Category[];
  currencies: Currency[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const defaultCurrencyId = getDefaultCurrencyId(currencies);

  const raw = template.template_data;
  const existingItems = Array.isArray(raw)
    ? raw
    : (raw as { items?: TemplateItem[] })?.items ?? [];

  const [items, setItems] = useState<TemplateItemDraft[]>(() => {
    const mapped = existingItems.map(
      (item: { type?: string } & Record<string, unknown>) => {
        const isVariable = item.type === "variable";
        const currencyId = String(item.currency_id ?? "");
        const currency = currencies.find((c) => c.id === currencyId);
        const exchangeRate = Number(item.exchange_rate_to_pkr) || currency?.exchange_rate_to_pkr || 1;
        
        if (isVariable) {
          return {
            type: "variable" as const,
            category_id: String(item.category_id ?? ""),
            description: String(item.description ?? ""),
            people_per_unit: Number(item.people_per_unit) || 1,
            price_per_unit: Number(item.price_per_unit) || 0,
            currency_id: currencyId,
            exchange_rate_to_pkr: exchangeRate,
          };
        }
        return {
          type: "fixed" as const,
          category_id: String(item.category_id ?? ""),
          description: String(item.description ?? ""),
          price_per_unit: Number(item.price_per_unit) || 0,
          currency_id: currencyId,
          exchange_rate_to_pkr: exchangeRate,
        };
      }
    );
    return mapped.length > 0 ? mapped : [getEmptyVariableItem(defaultCurrencyId)];
  });
  const [nameValue, setNameValue] = useState(template.name);

  const addItem = () => {
    setItems((prev) => [...prev, getEmptyVariableItem(defaultCurrencyId)]);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const updateItem = (
    index: number,
    updates: Partial<TemplateItemDraft>
  ) => {
    setItems(
      items.map((item, i) =>
        i === index ? { ...item, ...updates } : item
      )
    );
  };

  const [errors, setErrors] = useState<FieldErrors>({});
  const [submitting, setSubmitting] = useState(false);

  const validate = (): boolean => {
    const next: FieldErrors = {};
    if (!nameValue.trim()) next.name = true;

    const itemErrs: FieldErrors["items"] = {};
    items.forEach((item, i) => {
      const e: NonNullable<FieldErrors["items"]>[number] = {};
      if (!item.description.trim()) e.description = true;
      if (!item.category_id) e.category_id = true;
      if (!item.currency_id) e.currency_id = true;
      if (Object.keys(e).length > 0) itemErrs[i] = e;
    });
    if (Object.keys(itemErrs).length > 0) next.items = itemErrs;

    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    const formData = new FormData(e.currentTarget);
    const result = await updateDriveTemplate(formData);
    if ("success" in result && result.success) {
      toast.success("Template updated");
      setOpen(false);
      setErrors({});
      router.refresh();
    } else {
      toast.error("Failed to update template");
    }
    setSubmitting(false);
  };

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      setItems(
        existingItems.map((item) => {
          if (item.type === "variable") {
            return {
              type: "variable" as const,
              category_id: item.category_id,
              description: item.description,
              people_per_unit: item.people_per_unit,
              price_per_unit: item.price_per_unit,
              currency_id: item.currency_id,
            };
          }
          return {
            type: "fixed" as const,
            category_id: item.category_id,
            description: item.description,
            price_per_unit: item.price_per_unit,
            currency_id: item.currency_id,
          };
        })
      );
      setNameValue(template.name);
      setErrors({});
    }
    setOpen(isOpen);
  };

  const itemsToSubmit = items.map((item) => {
    if (item.type === "variable") {
      return {
        type: "variable" as const,
        category_id: item.category_id,
        description: item.description,
        people_per_unit: Number(item.people_per_unit) || 1,
        price_per_unit: Number(item.price_per_unit) || 0,
        currency_id: item.currency_id,
      };
    }
    return {
      type: "fixed" as const,
      category_id: item.category_id,
      description: item.description,
      price_per_unit: Number(item.price_per_unit) || 0,
      currency_id: item.currency_id,
    };
  });

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon">
          <Pencil className="size-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Template</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input type="hidden" name="id" value={template.id} />
          <input type="hidden" name="name" value={nameValue} />
          <input type="hidden" name="items" value={JSON.stringify(itemsToSubmit)} />
          <div className="space-y-2">
            <Label htmlFor="edit-template-name">Template Name</Label>
            <Input
              id="edit-template-name"
              value={nameValue}
              onChange={(e) => setNameValue(e.target.value)}
              placeholder="e.g. Standard Iftar Drive"
              aria-invalid={!!errors.name}
            />
            <FieldError show={errors.name} />
          </div>

          <div className="space-y-4">
            <Label>Budget Items</Label>

            {items.map((item, index) => {
              const ie = errors.items?.[index];
              return (
              <Card key={index} className="p-3 gap-3 relative">
                <div className="absolute top-2 right-2">
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    className="size-8"
                    onClick={() => removeItem(index)}
                  >
                    <Trash2 className="size-4 text-destructive" />
                  </Button>
                </div>

                <div className="space-y-2 pr-8">
                  <Label htmlFor={`edit-item-desc-${index}`}>Description</Label>
                  <Input
                    id={`edit-item-desc-${index}`}
                    value={item.description}
                    onChange={(e) =>
                      updateItem(index, { description: e.target.value })
                    }
                    placeholder="e.g. Biryani 10kg Daig"
                    aria-invalid={!!ie?.description}
                  />
                  <FieldError show={ie?.description} />
                </div>

                <div className="space-y-2">
                  <Label>Category</Label>
                  <CategoryCombobox
                    categories={categories}
                    value={item.category_id}
                    onChange={(v) => updateItem(index, { category_id: v })}
                    placeholder="Search or select category"
                    hasError={!!ie?.category_id}
                  />
                  <FieldError show={ie?.category_id} />
                </div>
                <div className="space-y-2">
                  <Label>Type</Label>
                  <RadioGroup
                      value={item.type}
                      onValueChange={(v) =>
                        updateItem(index, {
                          type: v as "variable" | "fixed",
                          ...(v === "fixed"
                            ? { people_per_unit: undefined }
                            : { people_per_unit: 1 }),
                        })
                      }
                    >
                      <div className="flex gap-6">
                        <div className="flex items-center space-x-3">
                          <RadioGroupItem value="variable" id={`edit-var-${index}`} />
                          <Label
                            htmlFor={`edit-var-${index}`}
                            className={cn(
                              "cursor-pointer font-normal transition-colors",
                              item.type === "variable" && "font-medium text-foreground"
                            )}
                          >
                            Variable
                          </Label>
                        </div>
                        <div className="flex items-center space-x-3">
                          <RadioGroupItem value="fixed" id={`edit-fix-${index}`} />
                          <Label
                            htmlFor={`edit-fix-${index}`}
                            className={cn(
                              "cursor-pointer font-normal transition-colors",
                              item.type === "fixed" && "font-medium text-foreground"
                            )}
                          >
                            Fixed
                          </Label>
                        </div>
                      </div>
                    </RadioGroup>
                </div>

                {item.type === "variable" && (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor={`edit-item-people-${index}`}>
                        People per unit
                      </Label>
                      <Input
                        id={`edit-item-people-${index}`}
                        type="number"
                        min={0.01}
                        step="any"
                        value={
                          typeof item.people_per_unit === "number"
                            ? String(item.people_per_unit)
                            : (item.people_per_unit ?? "")
                        }
                        onChange={(e) =>
                          updateItem(index, {
                            people_per_unit: e.target.value,
                          })
                        }
                        onFocus={(e) => e.target.select()}
                        placeholder="e.g. 2"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`edit-item-price-${index}`}>
                        Price per unit
                      </Label>
                      <Input
                        id={`edit-item-price-${index}`}
                        type="number"
                        min={0}
                        step="any"
                        value={
                          typeof item.price_per_unit === "number"
                            ? String(item.price_per_unit)
                            : (item.price_per_unit ?? "")
                        }
                        onChange={(e) =>
                          updateItem(index, {
                            price_per_unit: e.target.value,
                          })
                        }
                        onFocus={(e) => e.target.select()}
                        placeholder="e.g. 220"
                      />
                    </div>
                  </div>
                )}

                {item.type === "fixed" && (
                  <div className="space-y-2">
                    <Label htmlFor={`edit-item-price-fixed-${index}`}>
                      Price per unit
                    </Label>
                    <Input
                      id={`edit-item-price-fixed-${index}`}
                      type="number"
                      min={0}
                      step="any"
                      value={
                        typeof item.price_per_unit === "number"
                          ? String(item.price_per_unit)
                          : (item.price_per_unit ?? "")
                      }
                      onChange={(e) =>
                        updateItem(index, {
                          price_per_unit: e.target.value,
                        })
                      }
                      onFocus={(e) => e.target.select()}
                      placeholder="e.g. 35000"
                    />
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Currency</Label>
                    <Select
                      value={item.currency_id || undefined}
                      onValueChange={(v) => {
                        const currency = currencies.find((c) => c.id === v);
                        updateItem(index, {
                          currency_id: v,
                          exchange_rate_to_pkr: currency?.exchange_rate_to_pkr ?? 1,
                        });
                      }}
                    >
                      <SelectTrigger
                        className="w-full"
                        aria-invalid={!!ie?.currency_id}
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
                    <FieldError show={ie?.currency_id} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor={`edit-item-rate-${index}`}>
                      Exchange Rate to PKR
                    </Label>
                    <Input
                      id={`edit-item-rate-${index}`}
                      type="number"
                      step="any"
                      min={0}
                      value={
                        typeof item.exchange_rate_to_pkr === "number"
                          ? String(item.exchange_rate_to_pkr)
                          : (item.exchange_rate_to_pkr ?? "1")
                      }
                      onChange={(e) =>
                        updateItem(index, {
                          exchange_rate_to_pkr: e.target.value,
                        })
                      }
                      onFocus={(e) => e.target.select()}
                      placeholder="1"
                    />
                  </div>
                </div>
              </Card>
              );
            })}

            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={addItem}
              className="w-full"
            >
              <Plus className="mr-1 size-3" />
              Add Item
            </Button>
          </div>

          <DialogFooter className="pt-4">
            <DialogClose asChild>
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </DialogClose>
            <Button type="submit" disabled={submitting || items.length === 0}>
              {submitting ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </form>
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

// ── Notifications Settings ──

const VAPID_PUBLIC_KEY = (process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? "").trim();

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

function NotificationsSettings() {
  const [subscribed, setSubscribed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState(false);
  const [supported, setSupported] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>("default");

  useEffect(() => {
    const isSupported =
      VAPID_PUBLIC_KEY !== "" &&
      typeof window !== "undefined" &&
      "serviceWorker" in navigator &&
      "PushManager" in window &&
      "Notification" in window;
    setSupported(isSupported);

    if (isSupported) {
      setPermission(Notification.permission);
      getPushSubscriptionStatus()
        .then(setSubscribed)
        .catch(() => {})
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  async function handleToggle(checked: boolean) {
    if (!supported) return;
    setToggling(true);

    try {
      if (checked) {
        const perm = await Notification.requestPermission();
        setPermission(perm);
        if (perm !== "granted") {
          toast.error("Notification permission denied");
          setToggling(false);
          return;
        }

        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
        });

        const json = subscription.toJSON();
        const formData = new FormData();
        formData.set("endpoint", json.endpoint!);
        formData.set("p256dh", json.keys!.p256dh);
        formData.set("auth", json.keys!.auth);

        const result = await subscribePush(formData);
        if ("error" in result) {
          toast.error(result.error);
        } else {
          setSubscribed(true);
          toast.success("Push notifications enabled");
        }
      } else {
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.getSubscription();
        if (subscription) {
          await subscription.unsubscribe();
        }
        const result = await unsubscribePush();
        if ("error" in result) {
          toast.error(result.error);
        } else {
          setSubscribed(false);
          toast.success("Push notifications disabled");
        }
      }
    } catch (err) {
      console.error("Push toggle error:", err);
      toast.error("Failed to update notification settings");
    } finally {
      setToggling(false);
    }
  }

  if (!supported) {
    return (
      <Card className="p-4">
        <p className="text-sm text-muted-foreground">
          Push notifications are not supported in this browser.
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {subscribed ? (
              <Bell className="size-5 text-foreground" />
            ) : (
              <BellOff className="size-5 text-muted-foreground" />
            )}
            <div className="space-y-0.5">
              <Label className="text-sm font-medium">Push notifications</Label>
              <p className="text-xs text-muted-foreground">
                Receive alerts for new bank donations and daily financial
                summaries
              </p>
            </div>
          </div>
          {loading ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Switch
              checked={subscribed}
              onCheckedChange={handleToggle}
              disabled={toggling}
            />
          )}
        </div>
      </Card>
      <Card className="p-4">
        <div className="space-y-2">
          <Label className="text-sm font-medium">Permission status</Label>
          <p className="text-sm text-muted-foreground">
            Browser permission:{" "}
            <Badge
              variant={
                permission === "granted"
                  ? "default"
                  : permission === "denied"
                    ? "destructive"
                    : "outline"
              }
            >
              {permission}
            </Badge>
          </p>
          {permission === "denied" && (
            <p className="text-xs text-destructive">
              Notifications are blocked. Please enable them in your browser
              settings.
            </p>
          )}
        </div>
      </Card>
    </div>
  );
}

// ── Main Settings Client ──

export function SettingsClient({
  categories,
  currencies,
  templates,
  receiptRequired,
}: SettingsClientProps) {
  const router = useRouter();
  const [receiptReq, setReceiptReq] = useState(receiptRequired);
  const [receiptSaving, setReceiptSaving] = useState(false);

  async function handleReceiptToggle(checked: boolean) {
    setReceiptReq(checked);
    setReceiptSaving(true);
    const result = await updateReceiptSetting(checked);
    if ("error" in result) {
      toast.error("Failed to update setting");
      setReceiptReq(!checked); // revert
    } else {
      toast.success(
        checked
          ? "Receipt images are now required"
          : "Receipt images are now optional",
      );
      router.refresh();
    }
    setReceiptSaving(false);
  }

  return (
    <Tabs defaultValue="general">
      <TabsList>
        <TabsTrigger value="general">General</TabsTrigger>
        <TabsTrigger value="categories">Categories</TabsTrigger>
        <TabsTrigger value="currencies">Currencies</TabsTrigger>
        <TabsTrigger value="templates">Templates</TabsTrigger>
        <TabsTrigger value="notifications">Notifications</TabsTrigger>
      </TabsList>

      {/* ── General Tab ── */}
      <TabsContent value="general" className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-medium">General Settings</h2>
        </div>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-sm font-medium">
                Require receipt images
              </Label>
              <p className="text-xs text-muted-foreground">
                When enabled, receipt images must be uploaded for every
                expense
              </p>
            </div>
            <Switch
              checked={receiptReq}
              onCheckedChange={handleReceiptToggle}
              disabled={receiptSaving}
            />
          </div>
        </Card>
      </TabsContent>

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
          <CreateTemplateDialog categories={categories} currencies={currencies} />
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Items</TableHead>
              <TableHead className="w-32 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {templates.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={3}
                  className="text-center text-muted-foreground"
                >
                  No templates yet. Create one to get started.
                </TableCell>
              </TableRow>
            ) : (
              templates.map((template) => {
                const raw = template.template_data;
                const items = Array.isArray(raw)
                  ? raw
                  : (raw as { items?: { type?: string }[] })?.items ?? [];
                const variableCount = items.filter(
                  (i: { type?: string }) => i.type === "variable"
                ).length;
                const fixedCount = items.filter(
                  (i: { type?: string }) => i.type === "fixed"
                ).length;
                return (
                  <TableRow key={template.id}>
                    <TableCell>{template.name}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {items.length} items ({variableCount} variable, {fixedCount}{" "}
                      fixed)
                    </TableCell>
                    <TableCell className="text-right">
                      <EditTemplateDialog
                        template={template}
                        categories={categories}
                        currencies={currencies}
                      />
                      <DeleteTemplateDialog template={template} />
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </TabsContent>
      {/* ── Notifications Tab ── */}
      <TabsContent value="notifications" className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-medium">Notifications</h2>
        </div>
        <NotificationsSettings />
      </TabsContent>
    </Tabs>
  );
}
