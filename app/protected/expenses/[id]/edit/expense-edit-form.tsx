"use client";

import { useRouter } from "next/navigation";
import { useActionState, useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { updateExpense } from "@/lib/actions/expenses";
import { getItemNameSuggestions } from "@/lib/actions/expenses";
import { toast } from "sonner";
import { format } from "date-fns";
import { ItemNameCombobox } from "@/components/ui/item-name-combobox";

type Expense = Awaited<ReturnType<typeof import("@/lib/actions/expenses").getExpenseById>>;
type Currency = { id: string; code: string; symbol: string; exchange_rate_to_pkr: number };
type BankAccount = { id: string; account_name: string; bank_name: string; currency_id: string; currencies: { code: string } | null };
type Cause = { id: string; name: string; type: string };
type Volunteer = { id: string; name: string };
type Category = { id: string; name: string };

export function ExpenseEditForm({
  expense,
  currencies,
  bankAccounts,
  causes,
  volunteers,
  categories,
}: {
  expense: NonNullable<Expense>;
  currencies: Currency[];
  bankAccounts: BankAccount[];
  causes: Cause[];
  volunteers: Volunteer[];
  categories: Category[];
}) {
  const router = useRouter();
  const [itemNames, setItemNames] = useState<string[]>([expense.item_name ?? ""].filter(Boolean));
  const [itemName, setItemName] = useState(expense.item_name ?? "");
  useEffect(() => {
    getItemNameSuggestions().then((names) => setItemNames((prev) => (names.length ? names : prev)));
  }, []);

  const [state, formAction, pending] = useActionState(
    async (_: unknown, formData: FormData) => {
      const result = await updateExpense(formData);
      if (result?.error) return result;
      toast.success("Expense updated");
      router.push(`/protected/expenses/${expense.id}`);
      router.refresh();
      return { success: true };
    },
    null
  );

  const err = (state as { error?: Record<string, string[]> })?.error ?? {};
  const isBank = expense.type === "expense_bank";
  const driveCauses = causes.filter((c) => c.type === "drive");

  return (
    <form action={formAction} className="rounded-lg border bg-card p-6 space-y-4 max-w-xl">
      <input type="hidden" name="id" value={expense.id} />
      <input type="hidden" name="type" value={expense.type} />

      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2 space-y-2">
          <Label>Item name</Label>
          <ItemNameCombobox itemNames={itemNames} value={itemName} onChange={setItemName} />
          <input type="hidden" name="item_name" value={itemName} />
        </div>
        <div className="space-y-2">
          <Label>Category</Label>
          <select name="category_id" defaultValue={expense.category_id ?? ""} required className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm">
            <option value="">Select category</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <Label>Date</Label>
          <Input
            name="date"
            type="date"
            defaultValue={expense.date ? format(new Date(expense.date), "yyyy-MM-dd") : ""}
            required
          />
        </div>
        <div className="space-y-2">
          <Label>Quantity</Label>
          <Input name="quantity" type="number" min="0" step="1" defaultValue={Number(expense.quantity) || 1} required />
        </div>
        <div className="space-y-2">
          <Label>Unit price</Label>
          <Input name="unit_price" type="number" min="0" step="0.01" defaultValue={Number(expense.unit_price) ?? 0} required />
        </div>
        <div className="space-y-2">
          <Label>Currency</Label>
          <select name="currency_id" defaultValue={expense.currency_id} className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm">
            {currencies.map((c) => (
              <option key={c.id} value={c.id}>{c.code} ({c.symbol})</option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <Label>Exchange rate to PKR</Label>
          <Input
            name="exchange_rate_to_pkr"
            type="number"
            min="0"
            step="0.0001"
            defaultValue={Number(expense.exchange_rate_to_pkr) ?? 1}
            required
          />
        </div>
        <div className="space-y-2">
          <Label>Drive / Cause (optional)</Label>
          <select name="cause_id" defaultValue={expense.cause_id ?? ""} className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm">
            <option value="">General</option>
            {driveCauses.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
        {isBank ? (
          <div className="space-y-2">
            <Label>Bank account</Label>
            <select name="bank_account_id" defaultValue={expense.bank_account_id ?? ""} required className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm">
              <option value="">Select account</option>
              {bankAccounts.map((b) => (
                <option key={b.id} value={b.id}>{b.account_name}</option>
              ))}
            </select>
          </div>
        ) : (
          <div className="space-y-2">
            <Label>Paid by (volunteer)</Label>
            <select name="from_user_id" defaultValue={expense.from_user_id ?? ""} required className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm">
              <option value="">Select volunteer</option>
              {volunteers.map((v) => (
                <option key={v.id} value={v.id}>{v.name}</option>
              ))}
            </select>
          </div>
        )}
        <div className="space-y-2 col-span-2">
          <Label>Custodian (optional, for general expenses)</Label>
          <select name="custodian_id" defaultValue={expense.custodian_id ?? ""} className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm">
            <option value="">—</option>
            {volunteers.map((v) => (
              <option key={v.id} value={v.id}>{v.name}</option>
            ))}
          </select>
        </div>
        <div className="col-span-2 space-y-2">
          <Label>Description (optional)</Label>
          <Textarea name="description" rows={2} defaultValue={expense.description ?? ""} />
        </div>
      </div>

      <div className="flex gap-2">
        <Button type="submit" disabled={pending}>{pending ? "Saving..." : "Save"}</Button>
        <Button type="button" variant="outline" asChild>
          <Link href={`/protected/expenses/${expense.id}`}>Cancel</Link>
        </Button>
      </div>
      {Object.keys(err).length > 0 && (
        <p className="text-sm text-destructive">
          {Object.values(err).flat().join(" ")}
        </p>
      )}
    </form>
  );
}
