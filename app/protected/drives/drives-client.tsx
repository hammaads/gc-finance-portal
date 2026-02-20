"use client";

import { useState, useActionState, useCallback, useEffect, startTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
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
import { Plus, Pencil, Trash2, MapPin, Calendar, Users } from "lucide-react";
import { toast } from "sonner";
import { formatCurrency, formatDate } from "@/lib/format";
import {
  createCause,
  updateCause,
  deleteCause,
} from "@/lib/actions/causes";
import { getBudgetItems } from "@/lib/actions/budget";
import type { TemplateItem } from "@/lib/schemas/templates";

// ── Types ──

type Cause = {
  id: string;
  name: string;
  type: string;
  description: string | null;
  date: string | null;
  location: string | null;
  expected_headcount: number | null;
  number_of_daigs?: number | null;
  expected_attendees?: number | null;
  actual_attendees?: number | null;
};

type DriveSummary = {
  cause_id: string | null;
  cause_name: string | null;
  type: string | null;
  date: string | null;
  location: string | null;
  expected_headcount: number | null;
  number_of_daigs?: number | null;
  expected_attendees?: number | null;
  actual_attendees?: number | null;
  total_budget_pkr: number | null;
  total_spent_pkr: number | null;
  remaining_budget_pkr: number | null;
  total_donations_pkr: number | null;
};

type Template = {
  id: string;
  name: string;
  template_data: unknown;
};

type Category = {
  id: string;
  name: string;
};

type Currency = {
  id: string;
  code: string;
  symbol: string;
  exchange_rate_to_pkr: number;
};

type BudgetItemDraft =
  | (TemplateItem & { quantity?: number })
  | {
      type: "manual";
      category_id: string;
      description: string;
      quantity: number;
      price_per_unit: number;
      currency_id: string;
    };

interface DrivesClientProps {
  causes: Cause[];
  summaries: DriveSummary[];
  templates: Template[];
  categories: Category[];
  currencies: Currency[];
}

// ── Edit Budget Item Form (inline in Add Drive dialog) ──

function EditBudgetItemForm({
  item,
  categories,
  currencies,
  onSave,
  onCancel,
}: {
  item: BudgetItemDraft;
  categories: Category[];
  currencies: Currency[];
  onSave: (updates: Partial<BudgetItemDraft>) => void;
  onCancel: () => void;
}) {
  const [description, setDescription] = useState(item.description);
  const [categoryId, setCategoryId] = useState(item.category_id);
  const [currencyId, setCurrencyId] = useState(item.currency_id);
  const [pricePerUnit, setPricePerUnit] = useState(
    String(item.price_per_unit ?? 0)
  );
  const [peoplePerUnit, setPeoplePerUnit] = useState(
    item.type === "variable"
      ? String(item.people_per_unit ?? 1)
      : ""
  );
  const [quantity, setQuantity] = useState(
    item.type === "manual" ? String(item.quantity ?? 1) : ""
  );

  const handleSave = () => {
    const base = {
      description,
      category_id: categoryId,
      currency_id: currencyId,
      price_per_unit: parseFloat(pricePerUnit) || 0,
    };

    if (item.type === "manual") {
      onSave({ ...base, quantity: parseFloat(quantity) || 1 });
    } else if (item.type === "variable") {
      onSave({ ...base, people_per_unit: parseFloat(peoplePerUnit) || 1 });
    } else {
      onSave(base);
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Description</Label>
        <Input
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="e.g. Rice - Basmati (per kg)"
        />
      </div>
      <div className="space-y-2">
        <Label>Category</Label>
        <Select value={categoryId || undefined} onValueChange={setCategoryId}>
          <SelectTrigger className="w-full">
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

      {item.type === "variable" && (
        <div className="space-y-2">
          <Label>People per unit</Label>
          <Input
            type="number"
            min={0.01}
            step="any"
            value={peoplePerUnit}
            onChange={(e) => setPeoplePerUnit(e.target.value)}
            placeholder="e.g. 2"
          />
        </div>
      )}

      {item.type === "manual" && (
        <div className="space-y-2">
          <Label>Quantity</Label>
          <Input
            type="number"
            min={0}
            step="any"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            placeholder="e.g. 1"
          />
        </div>
      )}

      <div className="space-y-2">
        <Label>Price per unit</Label>
        <Input
          type="number"
          min={0}
          step="any"
          value={pricePerUnit}
          onChange={(e) => setPricePerUnit(e.target.value)}
          placeholder="e.g. 220"
        />
      </div>
      <div className="space-y-2">
        <Label>Currency</Label>
        <Select value={currencyId || undefined} onValueChange={setCurrencyId}>
          <SelectTrigger className="w-full">
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
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="button" onClick={handleSave}>
          Update
        </Button>
      </DialogFooter>
    </div>
  );
}

// ── Budget Item Preview (for drive creation) ──

function BudgetItemPreview({
  item,
  headcount,
  categories,
  currencies,
  onEdit,
  onRemove,
}: {
  item: BudgetItemDraft;
  headcount: number;
  categories: Category[];
  currencies: Currency[];
  onEdit: () => void;
  onRemove: () => void;
}) {
  const quantity =
    item.type === "manual"
      ? item.quantity
      : item.type === "variable" && headcount > 0
        ? headcount / (item.people_per_unit ?? 1)
        : item.type === "fixed" && headcount > 0
          ? 1
          : 0;

  const currency = currencies.find((c) => c.id === item.currency_id);
  const rate = currency?.exchange_rate_to_pkr ?? 1;
  const totalPkr = quantity * item.price_per_unit * rate;

  const categoryName =
    categories.find((c) => c.id === item.category_id)?.name ?? "";

  return (
    <Card className="p-3">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm truncate">{item.description}</p>
          <p className="text-xs text-muted-foreground">{categoryName}</p>
          {item.type === "variable" ? (
            <p className="text-xs text-muted-foreground mt-1">
              {headcount > 0
                ? `${headcount} ÷ ${item.people_per_unit} = ${quantity.toFixed(2)} units`
                : `${item.people_per_unit} people per unit`}
            </p>
          ) : item.type === "fixed" ? (
            <p className="text-xs text-muted-foreground mt-1">Fixed amount</p>
          ) : (
            <p className="text-xs text-muted-foreground mt-1">
              Manual: {quantity} × {item.price_per_unit}
            </p>
          )}
        </div>
        <div className="text-right">
          <p className="font-semibold text-sm">
            {formatCurrency(totalPkr)} PKR
          </p>
          <p className="text-xs text-muted-foreground">
            {quantity.toFixed(2)} × {item.price_per_unit}
          </p>
        </div>
        <div className="flex gap-1">
          <Button type="button" size="icon" variant="ghost" onClick={onEdit}>
            <Pencil className="size-3" />
          </Button>
          <Button type="button" size="icon" variant="ghost" onClick={onRemove}>
            <Trash2 className="size-3 text-destructive" />
          </Button>
        </div>
      </div>
    </Card>
  );
}

// ── Add Cause Dialog ──

function AddCauseDialog({
  type,
  templates,
  categories,
  currencies,
}: {
  type: "drive" | "other";
  templates: Template[];
  categories: Category[];
  currencies: Currency[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("");
  const [budgetItems, setBudgetItems] = useState<BudgetItemDraft[]>([]);
  const [headcount, setHeadcount] = useState<number>(0);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  const loadTemplate = useCallback(
    (templateId: string, hc: number) => {
      const template = templates.find((t) => t.id === templateId);
      if (!template) return;

      const raw = template.template_data;
      const items: TemplateItem[] = Array.isArray(raw)
        ? raw
        : (raw as { items?: TemplateItem[] })?.items ?? [];

      setBudgetItems(
        items.map((item) => ({
          ...item,
          quantity:
            item.type === "variable" && hc > 0
              ? hc / item.people_per_unit
              : item.type === "fixed" && hc > 0
                ? 1
                : 0,
        }))
      );
    },
    [templates]
  );

  const recalculateBudget = useCallback(
    (newHeadcount: number) => {
      setBudgetItems((items) =>
        items.map((item) => {
          if (item.type === "variable" && item.people_per_unit) {
            return {
              ...item,
              quantity:
                newHeadcount > 0 ? newHeadcount / item.people_per_unit : 0,
            };
          }
          return item;
        })
      );
    },
    []
  );

  const calculateTotal = useCallback(
    (items: BudgetItemDraft[], hc: number) => {
      return items.reduce((sum, item) => {
        const qty =
          item.type === "manual"
            ? item.quantity
            : item.type === "variable" && hc > 0
              ? hc / (item.people_per_unit ?? 1)
              : item.type === "fixed" && hc > 0
                ? 1
                : 0;

        const rate =
          currencies.find((c) => c.id === item.currency_id)
            ?.exchange_rate_to_pkr ?? 1;
        return sum + qty * item.price_per_unit * rate;
      }, 0);
    },
    [currencies]
  );

  const addManualItem = () => {
    const firstCurrency = currencies[0];
    const firstCategory = categories[0];
    setBudgetItems((prev) => [
      ...prev,
      {
        type: "manual" as const,
        category_id: firstCategory?.id ?? "",
        description: "",
        quantity: 1,
        price_per_unit: 0,
        currency_id: firstCurrency?.id ?? "",
      },
    ]);
    setEditingIndex(budgetItems.length);
  };

  const updateItem = (index: number, updates: Partial<BudgetItemDraft>) => {
    setBudgetItems((prev) =>
      prev.map((item, i) =>
        i === index ? ({ ...item, ...updates } as BudgetItemDraft) : item
      )
    );
  };

  const removeItem = (index: number) => {
    setBudgetItems(budgetItems.filter((_, i) => i !== index));
    if (editingIndex === index) setEditingIndex(null);
    else if (editingIndex !== null && editingIndex > index)
      setEditingIndex(editingIndex - 1);
  };

  const [, formAction, pending] = useActionState(
    async (_prev: unknown, formData: FormData) => {
      const result = await createCause(formData);
      if ("success" in result && result.success) {
        toast.success(type === "drive" ? "Drive created" : "Cause created");
        setOpen(false);
        setSelectedTemplateId("");
        setBudgetItems([]);
        setHeadcount(0);
        router.refresh();
      } else {
        toast.error(
          type === "drive"
            ? "Failed to create drive"
            : "Failed to create cause"
        );
      }
      return result;
    },
    null
  );

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);

    if (type === "drive" && budgetItems.length > 0) {
      const itemsToSubmit = budgetItems
        .filter(
          (item) =>
            item.category_id &&
            item.currency_id &&
            item.description?.trim()
        )
        .map((item) => {
        const currency = currencies.find((c) => c.id === item.currency_id);
        const rate = currency?.exchange_rate_to_pkr ?? 1;

        if (item.type === "manual") {
          return {
            category_id: item.category_id,
            description: item.description,
            quantity: item.quantity,
            price_per_unit: item.price_per_unit,
            currency_id: item.currency_id,
            exchange_rate_to_pkr: rate,
          };
        }

        const qty =
          item.type === "variable" && headcount > 0
            ? headcount / (item.people_per_unit ?? 1)
            : item.type === "fixed" && headcount > 0
              ? 1
              : 0;

        return {
          category_id: item.category_id,
          description: item.description,
          quantity: qty,
          price_per_unit: item.price_per_unit,
          currency_id: item.currency_id,
          exchange_rate_to_pkr: rate,
        };
      });

      formData.set("budget_items", JSON.stringify(itemsToSubmit));
    }

    startTransition(() => {
      formAction(formData);
    });
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setSelectedTemplateId("");
      setBudgetItems([]);
      setHeadcount(0);
      setEditingIndex(null);
    }
    setOpen(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="mr-1 size-4" />
          {type === "drive" ? "Add Drive" : "Add Cause"}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {type === "drive" ? "Add Drive" : "Add Cause"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input type="hidden" name="type" value={type} />
          {type === "drive" && (
            <div className="space-y-2">
              <Label htmlFor="add-drive-template">Template</Label>
              <Select
                value={selectedTemplateId || "none"}
                onValueChange={(value) => {
                  if (value === "none") {
                    setSelectedTemplateId("");
                    setBudgetItems([]);
                  } else {
                    setSelectedTemplateId(value);
                    loadTemplate(value, headcount);
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="None" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {templates.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor={`add-${type}-name`}>Name</Label>
            <Input
              id={`add-${type}-name`}
              name="name"
              placeholder={
                type === "drive" ? "e.g. Iftaar Drive 2025" : "e.g. Orphan Fund"
              }
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor={`add-${type}-description`}>Description</Label>
            <Input
              id={`add-${type}-description`}
              name="description"
              placeholder="Optional description"
            />
          </div>
          {type === "drive" && (
            <>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="add-drive-date">Date</Label>
                  <Input
                    id="add-drive-date"
                    name="date"
                    type="date"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="add-drive-daigs">Number of Daigs</Label>
                  <Input
                    id="add-drive-daigs"
                    name="number_of_daigs"
                    type="number"
                    min={1}
                    placeholder="e.g. 10"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="add-drive-headcount">
                    Expected Attendees
                  </Label>
                  <Input
                    id="add-drive-headcount"
                    name="expected_attendees"
                    type="number"
                    min={0}
                    placeholder="e.g. 500"
                    value={headcount || ""}
                    onChange={(e) => {
                      const value = parseInt(e.target.value, 10) || 0;
                      setHeadcount(value);
                      recalculateBudget(value);
                    }}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="add-drive-location">Location</Label>
                <Input
                  id="add-drive-location"
                  name="location"
                  placeholder="e.g. Karachi"
                />
              </div>

              <div className="space-y-3 border-t pt-4">
                <Label className="text-base">Budget (Optional)</Label>

                {budgetItems.length > 0 ? (
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">
                      {headcount > 0
                        ? `Budget calculated for ${headcount} attendees`
                        : "Enter expected attendees to see calculations"}
                    </p>

                    {budgetItems.map((item, index) => (
                      <BudgetItemPreview
                        key={index}
                        item={item}
                        headcount={headcount}
                        categories={categories}
                        currencies={currencies}
                        onEdit={() => setEditingIndex(index)}
                        onRemove={() => removeItem(index)}
                      />
                    ))}

                    {editingIndex !== null && budgetItems[editingIndex] && (
                      <Dialog
                        open={editingIndex !== null}
                        onOpenChange={(open) => !open && setEditingIndex(null)}
                      >
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Edit Budget Item</DialogTitle>
                          </DialogHeader>
                          <EditBudgetItemForm
                            item={budgetItems[editingIndex]!}
                            categories={categories}
                            currencies={currencies}
                            onSave={(updates) => {
                              updateItem(editingIndex, updates);
                              setEditingIndex(null);
                            }}
                            onCancel={() => setEditingIndex(null)}
                          />
                        </DialogContent>
                      </Dialog>
                    )}

                    <Button
                      type="button"
                      variant="outline"
                      onClick={addManualItem}
                      className="w-full"
                    >
                      <Plus className="mr-2 size-4" />
                      Add Item
                    </Button>

                    <div className="flex justify-between items-center pt-2 border-t">
                      <span className="font-medium">Total Budget:</span>
                      <span className="text-lg font-semibold">
                        {formatCurrency(calculateTotal(budgetItems, headcount))}{" "}
                        PKR
                      </span>
                    </div>
                  </div>
                ) : (
                  <>
                    <p className="text-sm text-muted-foreground">
                      No budget items yet. Select a template or add items manually.
                    </p>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={addManualItem}
                      className="w-full"
                    >
                      <Plus className="mr-2 size-4" />
                      Add Item
                    </Button>
                  </>
                )}
              </div>
            </>
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

// ── Edit Cause Dialog ──

function EditCauseDialog({
  cause,
  categories,
  currencies,
}: {
  cause: Cause;
  categories: Category[];
  currencies: Currency[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const isDrive = cause.type === "drive";
  const [headcount, setHeadcount] = useState(
    cause.expected_attendees ?? cause.expected_headcount ?? 0,
  );
  const [budgetItems, setBudgetItems] = useState<BudgetItemDraft[]>([]);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [budgetLoading, setBudgetLoading] = useState(false);

  useEffect(() => {
    if (open && isDrive && cause.id) {
      setBudgetLoading(true);
      getBudgetItems(cause.id)
        .then((rows) => {
          const items: BudgetItemDraft[] = (rows ?? []).map((row) => ({
            type: "manual" as const,
            category_id: row.category_id,
            description: row.description,
            quantity: Number(row.quantity),
            price_per_unit: Number(row.unit_price),
            currency_id: row.currency_id,
          }));
          setBudgetItems(items);
        })
        .finally(() => setBudgetLoading(false));
    }
  }, [open, isDrive, cause.id]);

  const calculateTotal = useCallback(
    (items: BudgetItemDraft[], hc: number) => {
      return items.reduce((sum, item) => {
        const qty =
          item.type === "manual"
            ? item.quantity
            : item.type === "variable" && hc > 0
              ? hc / (item.people_per_unit ?? 1)
              : item.type === "fixed" && hc > 0
                ? 1
                : 0;
        const rate =
          currencies.find((c) => c.id === item.currency_id)
            ?.exchange_rate_to_pkr ?? 1;
        return sum + qty * item.price_per_unit * rate;
      }, 0);
    },
    [currencies]
  );

  const addManualItem = () => {
    const firstCurrency = currencies[0];
    const firstCategory = categories[0];
    setBudgetItems((prev) => [
      ...prev,
      {
        type: "manual" as const,
        category_id: firstCategory?.id ?? "",
        description: "",
        quantity: 1,
        price_per_unit: 0,
        currency_id: firstCurrency?.id ?? "",
      },
    ]);
    setEditingIndex(budgetItems.length);
  };

  const updateItem = (index: number, updates: Partial<BudgetItemDraft>) => {
    setBudgetItems((prev) =>
      prev.map((item, i) =>
        i === index ? ({ ...item, ...updates } as BudgetItemDraft) : item
      )
    );
  };

  const removeItem = (index: number) => {
    setBudgetItems(budgetItems.filter((_, i) => i !== index));
    if (editingIndex === index) setEditingIndex(null);
    else if (editingIndex !== null && editingIndex > index)
      setEditingIndex(editingIndex - 1);
  };

  const [, formAction, pending] = useActionState(
    async (_prev: unknown, formData: FormData) => {
      const result = await updateCause(formData);
      if ("success" in result && result.success) {
        toast.success(isDrive ? "Drive updated" : "Cause updated");
        setOpen(false);
        router.refresh();
      } else {
        toast.error(
          isDrive ? "Failed to update drive" : "Failed to update cause"
        );
      }
      return result;
    },
    null
  );

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);

    if (isDrive && budgetItems.length > 0) {
      const itemsToSubmit = budgetItems
        .filter(
          (item) =>
            item.category_id &&
            item.currency_id &&
            item.description?.trim()
        )
        .map((item) => {
          const currency = currencies.find((c) => c.id === item.currency_id);
          const rate = currency?.exchange_rate_to_pkr ?? 1;
          if (item.type === "manual") {
            return {
              category_id: item.category_id,
              description: item.description,
              quantity: item.quantity,
              price_per_unit: item.price_per_unit,
              currency_id: item.currency_id,
              exchange_rate_to_pkr: rate,
            };
          }
          const qty =
            item.type === "variable" && headcount > 0
              ? headcount / (item.people_per_unit ?? 1)
              : item.type === "fixed" && headcount > 0
                ? 1
                : 0;
          return {
            category_id: item.category_id,
            description: item.description,
            quantity: qty,
            price_per_unit: item.price_per_unit,
            currency_id: item.currency_id,
            exchange_rate_to_pkr: rate,
          };
        });
      formData.set("budget_items", JSON.stringify(itemsToSubmit));
    }

    startTransition(() => {
      formAction(formData);
    });
  };

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      setEditingIndex(null);
    } else {
      setHeadcount(cause.expected_attendees ?? cause.expected_headcount ?? 0);
    }
    setOpen(isOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon">
          <Pencil className="size-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className={isDrive ? "max-w-2xl max-h-[90vh] overflow-y-auto" : undefined}>
        <DialogHeader>
          <DialogTitle>{isDrive ? "Edit Drive" : "Edit Cause"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input type="hidden" name="id" value={cause.id} />
          <input type="hidden" name="type" value={cause.type} />
          <div className="space-y-2">
            <Label htmlFor={`edit-cause-name-${cause.id}`}>Name</Label>
            <Input
              id={`edit-cause-name-${cause.id}`}
              name="name"
              defaultValue={cause.name}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor={`edit-cause-description-${cause.id}`}>
              Description
            </Label>
            <Input
              id={`edit-cause-description-${cause.id}`}
              name="description"
              defaultValue={cause.description ?? ""}
            />
          </div>
          {isDrive && (
            <>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor={`edit-cause-date-${cause.id}`}>Date</Label>
                  <Input
                    id={`edit-cause-date-${cause.id}`}
                    name="date"
                    type="date"
                    defaultValue={cause.date ?? ""}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`edit-cause-daigs-${cause.id}`}>
                    Number of Daigs
                  </Label>
                  <Input
                    id={`edit-cause-daigs-${cause.id}`}
                    name="number_of_daigs"
                    type="number"
                    min={1}
                    defaultValue={cause.number_of_daigs ?? ""}
                    placeholder="e.g. 10"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`edit-cause-headcount-${cause.id}`}>
                    Expected Attendees
                  </Label>
                  <Input
                    id={`edit-cause-headcount-${cause.id}`}
                    name="expected_attendees"
                    type="number"
                    min={0}
                    placeholder="e.g. 500"
                    value={headcount || ""}
                    onChange={(e) => {
                      const value = parseInt(e.target.value, 10) || 0;
                      setHeadcount(value);
                    }}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor={`edit-cause-actual-${cause.id}`}>
                  Actual Attendees
                </Label>
                <Input
                  id={`edit-cause-actual-${cause.id}`}
                  name="actual_attendees"
                  type="number"
                  min={0}
                  defaultValue={cause.actual_attendees ?? ""}
                  placeholder="Optional"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor={`edit-cause-location-${cause.id}`}>
                  Location
                </Label>
                <Input
                  id={`edit-cause-location-${cause.id}`}
                  name="location"
                  defaultValue={cause.location ?? ""}
                  placeholder="e.g. Karachi"
                />
              </div>

              <div className="space-y-3 border-t pt-4">
                <Label className="text-base">Budget (Optional)</Label>
                {budgetLoading ? (
                  <p className="text-sm text-muted-foreground">
                    Loading budget items...
                  </p>
                ) : budgetItems.length > 0 ? (
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">
                      Changing expected attendees won&apos;t update the budget. Edit the
                      items below to change amounts and the total.
                    </p>
                    {budgetItems.map((item, index) => (
                      <BudgetItemPreview
                        key={index}
                        item={item}
                        headcount={headcount}
                        categories={categories}
                        currencies={currencies}
                        onEdit={() => setEditingIndex(index)}
                        onRemove={() => removeItem(index)}
                      />
                    ))}
                    {editingIndex !== null && budgetItems[editingIndex] && (
                      <Dialog
                        open={editingIndex !== null}
                        onOpenChange={(open) => !open && setEditingIndex(null)}
                      >
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Edit Budget Item</DialogTitle>
                          </DialogHeader>
                          <EditBudgetItemForm
                            item={budgetItems[editingIndex]!}
                            categories={categories}
                            currencies={currencies}
                            onSave={(updates) => {
                              updateItem(editingIndex, updates);
                              setEditingIndex(null);
                            }}
                            onCancel={() => setEditingIndex(null)}
                          />
                        </DialogContent>
                      </Dialog>
                    )}
                    <Button
                      type="button"
                      variant="outline"
                      onClick={addManualItem}
                      className="w-full"
                    >
                      <Plus className="mr-2 size-4" />
                      Add Item
                    </Button>
                    <div className="flex justify-between items-center pt-2 border-t">
                      <span className="font-medium">Total Budget:</span>
                      <span className="text-lg font-semibold">
                        {formatCurrency(calculateTotal(budgetItems, headcount))}{" "}
                        PKR
                      </span>
                    </div>
                  </div>
                ) : (
                  <>
                    <p className="text-sm text-muted-foreground">
                      No budget items yet. Add items manually.
                    </p>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={addManualItem}
                      className="w-full"
                    >
                      <Plus className="mr-2 size-4" />
                      Add Item
                    </Button>
                  </>
                )}
              </div>
            </>
          )}
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

// ── Delete Cause Dialog ──

function DeleteCauseDialog({ cause }: { cause: Cause }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    setDeleting(true);
    const result = await deleteCause(cause.id);
    if ("success" in result && result.success) {
      toast.success(
        cause.type === "drive" ? "Drive deleted" : "Cause deleted",
      );
      setOpen(false);
      router.refresh();
    } else {
      toast.error(
        cause.type === "drive"
          ? "Failed to delete drive"
          : "Failed to delete cause",
      );
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
          <DialogTitle>
            Delete {cause.type === "drive" ? "Drive" : "Cause"}
          </DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          Are you sure you want to delete{" "}
          <span className="font-medium text-foreground">{cause.name}</span>?
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

// ── Drive Card ──

function DriveCard({
  cause,
  summary,
  categories,
  currencies,
}: {
  cause: Cause;
  summary: DriveSummary | undefined;
  categories: Category[];
  currencies: Currency[];
}) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle>
              <Link
                href={`/protected/drives/${cause.id}`}
                className="hover:underline"
              >
                {cause.name}
              </Link>
            </CardTitle>
            {cause.description && (
              <CardDescription>{cause.description}</CardDescription>
            )}
          </div>
          <div className="flex items-center gap-1">
            <EditCauseDialog
              cause={cause}
              categories={categories}
              currencies={currencies}
            />
            <DeleteCauseDialog cause={cause} />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
          {cause.date && (
            <span className="flex items-center gap-1">
              <Calendar className="size-4" />
              {formatDate(cause.date)}
            </span>
          )}
          {cause.location && (
            <span className="flex items-center gap-1">
              <MapPin className="size-4" />
              {cause.location}
            </span>
          )}
          {cause.number_of_daigs && (
            <span className="flex items-center gap-1">
              <Users className="size-4" />
              {cause.number_of_daigs.toLocaleString()} daigs
            </span>
          )}
          {(cause.expected_attendees ?? cause.expected_headcount) && (
            <span className="flex items-center gap-1">
              <Users className="size-4" />
              {(cause.expected_attendees ?? cause.expected_headcount)?.toLocaleString()} expected
            </span>
          )}
        </div>
        {summary && (
          <div className="mt-4 grid grid-cols-3 gap-4">
            <div>
              <p className="text-xs text-muted-foreground">Budget</p>
              <p className="text-sm font-semibold">
                {formatCurrency(summary.total_budget_pkr ?? 0)}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Spent</p>
              <p className="text-sm font-semibold">
                {formatCurrency(summary.total_spent_pkr ?? 0)}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Remaining</p>
              <p className="text-sm font-semibold">
                {formatCurrency(summary.remaining_budget_pkr ?? 0)}
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ── Main Drives Client ──

export function DrivesClient({
  causes,
  summaries,
  templates,
  categories,
  currencies,
}: DrivesClientProps) {
  const drives = causes.filter((c) => c.type === "drive");
  const otherCauses = causes.filter((c) => c.type !== "drive");

  const summaryMap = new Map(
    summaries
      .filter((s): s is DriveSummary & { cause_id: string } => s.cause_id !== null)
      .map((s) => [s.cause_id, s]),
  );

  return (
    <div className="space-y-8">
      {/* Iftaar Drives */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-medium">Iftaar Drives</h2>
          <AddCauseDialog
            type="drive"
            templates={templates}
            categories={categories}
            currencies={currencies}
          />
        </div>
        {drives.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              No drives yet. Add one to get started.
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {drives.map((drive) => (
              <DriveCard
                key={drive.id}
                cause={drive}
                summary={summaryMap.get(drive.id)}
                categories={categories}
                currencies={currencies}
              />
            ))}
          </div>
        )}
      </section>

      {/* Other Causes */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-medium">Other Causes</h2>
          <AddCauseDialog
            type="other"
            templates={[]}
            categories={categories}
            currencies={currencies}
          />
        </div>
        {otherCauses.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              No other causes yet. Add one to get started.
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {otherCauses.map((cause) => (
              <div
                key={cause.id}
                className="flex items-center justify-between rounded-lg border px-4 py-3"
              >
                <div className="space-y-0.5">
                  <Link
                    href={`/protected/drives/${cause.id}`}
                    className="text-sm font-medium hover:underline"
                  >
                    {cause.name}
                  </Link>
                  {cause.description && (
                    <p className="text-xs text-muted-foreground">
                      {cause.description}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <EditCauseDialog
                    cause={cause}
                    categories={categories}
                    currencies={currencies}
                  />
                  <DeleteCauseDialog cause={cause} />
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
