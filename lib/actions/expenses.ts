"use server";

import { createClient } from "@/lib/supabase/server";
import { expenseSchema } from "@/lib/schemas/ledger";
import { resolveCanonicalItemName } from "@/lib/actions/donations";
import { revalidatePath } from "next/cache";

const expenseSelect =
  "*, currencies(code, symbol), causes(name), expense_categories(name), bank_accounts(account_name), from_user:volunteers!ledger_entries_from_user_id_fkey(name), custodian:volunteers!ledger_entries_custodian_id_fkey(name)";

export async function getExpenses(includeVoided = false) {
  const supabase = await createClient();
  let q = supabase
    .from("ledger_entries")
    .select(expenseSelect)
    .in("type", ["expense_bank", "expense_cash"])
    .order("date", { ascending: false })
    .order("created_at", { ascending: false });
  if (!includeVoided) q = q.is("deleted_at", null);
  const { data, error } = await q;
  if (error) throw error;
  return data;
}

export async function getExpenseById(id: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("ledger_entries")
    .select(expenseSelect)
    .eq("id", id)
    .in("type", ["expense_bank", "expense_cash"])
    .single();
  if (error || !data) return null;
  return data;
}

export async function getItemNameSuggestions() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("ledger_entries")
    .select("item_name")
    .in("type", ["expense_bank", "expense_cash", "donation_in_kind"])
    .is("deleted_at", null)
    .is("cause_id", null)
    .not("item_name", "is", null)
    .order("item_name");
  if (error) throw error;
  // Return unique item names
  const unique = [...new Set(data.map((d) => d.item_name as string))];
  return unique;
}

export async function createExpense(formData: FormData) {
  const type = formData.get("type") as string;
  const quantity = Number(formData.get("quantity")) || 1;
  const unitPrice = Number(formData.get("unit_price")) || 0;
  const amount = quantity * unitPrice;

  const raw: Record<string, unknown> = {
    type,
    amount,
    item_name: formData.get("item_name"),
    quantity,
    unit_price: unitPrice,
    currency_id: formData.get("currency_id"),
    exchange_rate_to_pkr: formData.get("exchange_rate_to_pkr"),
    date: formData.get("date"),
    description: formData.get("description") || null,
    category_id: formData.get("category_id"),
    cause_id: formData.get("cause_id") || null,
    custodian_id: formData.get("custodian_id") || null,
  };

  if (type === "expense_bank") {
    raw.bank_account_id = formData.get("bank_account_id");
  } else {
    raw.from_user_id = formData.get("from_user_id");
  }

  const parsed = expenseSchema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors };

  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  if (!claims?.claims?.sub)
    return { error: { item_name: ["Not authenticated"] } };

  const canonicalName = await resolveCanonicalItemName(supabase, parsed.data.item_name);
  const { data: inserted, error } = await supabase
    .from("ledger_entries")
    .insert({
      ...parsed.data,
      item_name: canonicalName,
      created_by: claims.claims.sub as string,
    })
    .select("id")
    .single();
  if (error) {
    console.error("Failed to create expense:", error.message);
    return { error: { item_name: ["Failed to save. Please try again."] } };
  }

  revalidatePath("/protected/expenses");
  revalidatePath("/protected/inventory");
  revalidatePath("/protected");
  return { success: true, id: inserted.id };
}

export async function createBulkExpenses(formData: FormData) {
  const itemsJson = formData.get("items") as string;
  let items: Record<string, unknown>[];
  try {
    items = JSON.parse(itemsJson);
  } catch {
    return { error: "Invalid items data" };
  }

  if (!items.length) return { error: "No items provided" };

  // Shared fields
  const shared = {
    type: formData.get("type") as string,
    currency_id: formData.get("currency_id") as string,
    exchange_rate_to_pkr: formData.get("exchange_rate_to_pkr") as string,
    date: formData.get("date") as string,
    cause_id: (formData.get("cause_id") as string) || null,
    custodian_id: (formData.get("custodian_id") as string) || null,
    bank_account_id: (formData.get("bank_account_id") as string) || null,
    from_user_id: (formData.get("from_user_id") as string) || null,
  };

  const validatedItems = [];
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const quantity = Number(item.quantity) || 1;
    const unitPrice = Number(item.unit_price) || 0;
    const amount = quantity * unitPrice;

    const raw: Record<string, unknown> = {
      ...shared,
      amount,
      item_name: item.item_name,
      quantity,
      unit_price: unitPrice,
      category_id: item.category_id,
      description: item.description || null,
    };

    const parsed = expenseSchema.safeParse(raw);
    if (!parsed.success) {
      return {
        error: `Item ${i + 1} (${item.item_name || "unnamed"}): ${Object.values(parsed.error.flatten().fieldErrors).flat().join(", ")}`,
      };
    }
    validatedItems.push(parsed.data);
  }

  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  if (!claims?.claims?.sub) return { error: "Not authenticated" };

  const rows = await Promise.all(
    validatedItems.map(async (item) => ({
      ...item,
      item_name: await resolveCanonicalItemName(supabase, item.item_name),
      created_by: claims.claims.sub as string,
    }))
  );

  const { data: inserted, error } = await supabase
    .from("ledger_entries")
    .insert(rows)
    .select("id");
  if (error) {
    console.error("Failed to create bulk expenses:", error.message);
    return { error: "Failed to save. Please try again." };
  }

  revalidatePath("/protected/expenses");
  revalidatePath("/protected/inventory");
  revalidatePath("/protected");
  return { success: true, ids: inserted.map((r) => r.id) };
}

export async function deleteExpense(id: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("ledger_entries")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id);
  if (error) {
    console.error("Failed to delete expense:", error.message);
    return { error: "Failed to delete. Please try again." };
  }

  revalidatePath("/protected/expenses");
  revalidatePath("/protected/inventory");
  revalidatePath("/protected");
  return { success: true };
}

/** Void expense (GC-EXP-004: voided rows excluded from inventory/reporting via deleted_at). */
export async function voidExpense(id: string, reason: string) {
  const trimmed = reason?.trim();
  if (!trimmed) return { error: { reason: ["Void reason is required."] } };

  const supabase = await createClient();
  const { error } = await supabase
    .from("ledger_entries")
    .update({
      deleted_at: new Date().toISOString(),
      void_reason: trimmed,
    } as Record<string, unknown>)
    .eq("id", id);
  if (error) {
    console.error("Failed to void expense:", error.message);
    return { error: { reason: ["Failed to void. Please try again."] } };
  }

  revalidatePath("/protected/expenses");
  revalidatePath("/protected/expenses/[id]");
  revalidatePath("/protected/inventory");
  revalidatePath("/protected");
  return { success: true };
}

export async function updateExpense(formData: FormData) {
  const id = formData.get("id") as string;
  if (!id) return { error: { item_name: ["Missing expense id"] } };

  const type = formData.get("type") as string;
  const quantity = Number(formData.get("quantity")) || 1;
  const unitPrice = Number(formData.get("unit_price")) || 0;
  const amount = quantity * unitPrice;

  const raw: Record<string, unknown> = {
    type,
    amount,
    item_name: formData.get("item_name"),
    quantity,
    unit_price: unitPrice,
    currency_id: formData.get("currency_id"),
    exchange_rate_to_pkr: formData.get("exchange_rate_to_pkr"),
    date: formData.get("date"),
    description: formData.get("description") || null,
    category_id: formData.get("category_id"),
    cause_id: formData.get("cause_id") || null,
    custodian_id: formData.get("custodian_id") || null,
  };
  if (type === "expense_bank") raw.bank_account_id = formData.get("bank_account_id");
  else raw.from_user_id = formData.get("from_user_id");

  const parsed = expenseSchema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors };

  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  if (!claims?.claims?.sub) return { error: { item_name: ["Not authenticated"] } };

  const canonicalName = await resolveCanonicalItemName(supabase, parsed.data.item_name);
  const payload = {
    ...parsed.data,
    item_name: canonicalName,
    cause_id: parsed.data.cause_id || null,
    custodian_id: parsed.data.custodian_id || null,
    updated_at: new Date().toISOString(),
  };
  const { error } = await supabase
    .from("ledger_entries")
    .update(payload)
    .eq("id", id);
  if (error) {
    console.error("Failed to update expense:", error.message);
    return { error: { item_name: ["Failed to save. Please try again."] } };
  }

  revalidatePath("/protected/expenses");
  revalidatePath("/protected/expenses/[id]");
  revalidatePath("/protected/inventory");
  revalidatePath("/protected");
  return { success: true };
}
