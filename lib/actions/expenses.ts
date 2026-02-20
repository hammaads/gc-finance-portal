"use server";

import { recordAuditEvent, recordInventoryHistory } from "@/lib/actions/audit";
import { createClient } from "@/lib/supabase/server";
import { expenseSchema } from "@/lib/schemas/ledger";
import { revalidatePath } from "next/cache";

type GetExpensesOptions = {
  includeVoided?: boolean;
};

export async function getExpenses(options: GetExpensesOptions = {}) {
  const supabase = await createClient();
  let query = supabase
    .from("ledger_entries")
    .select(
      "*, currencies(code, symbol), causes(name), expense_categories(name), bank_accounts(account_name), from_user:volunteers!ledger_entries_from_user_id_fkey(name), custodian:volunteers!ledger_entries_custodian_id_fkey(name)",
    )
    .in("type", ["expense_bank", "expense_cash"])
    .order("date", { ascending: false })
    .order("created_at", { ascending: false });

  if (!options.includeVoided) {
    query = query.is("deleted_at", null);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data;
}

export async function getExpenseById(id: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("ledger_entries")
    .select(
      "*, currencies(code, symbol), causes(name), expense_categories(name), bank_accounts(account_name), from_user:volunteers!ledger_entries_from_user_id_fkey(name), custodian:volunteers!ledger_entries_custodian_id_fkey(name)",
    )
    .eq("id", id)
    .in("type", ["expense_bank", "expense_cash"])
    .single();

  if (error) throw error;
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
  const actorId = claims?.claims?.sub ?? null;
  if (!actorId) return { error: { item_name: ["Not authenticated"] } };

  const { data: inserted, error } = await supabase
    .from("ledger_entries")
    .insert({
      ...parsed.data,
      created_by: actorId,
    })
    .select("*")
    .single();

  if (error) {
    console.error("Failed to create expense:", error.message);
    return { error: { item_name: ["Failed to save. Please try again."] } };
  }

  await recordAuditEvent({
    actorId,
    tableName: "ledger_entries",
    recordId: inserted.id,
    action: "create",
    newData: inserted,
    metadata: { module: "expenses" },
  });

  if (inserted.item_name && !inserted.cause_id) {
    await recordInventoryHistory({
      actorId,
      itemName: inserted.item_name,
      changeType: "received",
      source: "expense",
      deltaQty: Number(inserted.quantity ?? 0),
      referenceTable: "ledger_entries",
      referenceId: inserted.id,
      notes: "Inventory received through expense",
      metadata: { expense_type: inserted.type },
    });
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
  const actorId = claims?.claims?.sub ?? null;
  if (!actorId) return { error: "Not authenticated" };

  const rows = validatedItems.map((item) => ({
    ...item,
    created_by: actorId,
  }));

  const { data: inserted, error } = await supabase
    .from("ledger_entries")
    .insert(rows)
    .select("*");
  if (error) {
    console.error("Failed to create bulk expenses:", error.message);
    return { error: "Failed to save. Please try again." };
  }

  for (const row of inserted) {
    await recordAuditEvent({
      actorId,
      tableName: "ledger_entries",
      recordId: row.id,
      action: "create",
      newData: row,
      metadata: { module: "expenses", mode: "bulk" },
    });

    if (row.item_name && !row.cause_id) {
      await recordInventoryHistory({
        actorId,
        itemName: row.item_name,
        changeType: "received",
        source: "expense",
        deltaQty: Number(row.quantity ?? 0),
        referenceTable: "ledger_entries",
        referenceId: row.id,
        notes: "Inventory received through bulk expense",
        metadata: { mode: "bulk" },
      });
    }
  }

  revalidatePath("/protected/expenses");
  revalidatePath("/protected/inventory");
  revalidatePath("/protected");
  return { success: true, ids: inserted.map((r) => r.id) };
}

export async function voidExpense(id: string, reason: string) {
  const trimmedReason = reason.trim();
  if (!trimmedReason) {
    return { error: "Void reason is required." };
  }

  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  const actorId = claims?.claims?.sub ?? null;
  if (!actorId) return { error: "Not authenticated" };

  const { data: current, error: fetchError } = await supabase
    .from("ledger_entries")
    .select("id, type, item_name, quantity, cause_id, deleted_at, void_reason")
    .eq("id", id)
    .in("type", ["expense_bank", "expense_cash"])
    .single();

  if (fetchError || !current) {
    return { error: "Expense not found." };
  }
  if (current.deleted_at) {
    return { error: "Expense is already voided." };
  }

  const isInventoryBacked = !current.cause_id && !!current.item_name;
  if (isInventoryBacked) {
    const { count, error: usageError } = await supabase
      .from("inventory_consumption")
      .select("id", { count: "exact", head: true })
      .eq("ledger_entry_id", id);
    if (usageError) {
      console.error("Failed to check inventory usage:", usageError.message);
      return { error: "Could not validate inventory usage. Please retry." };
    }
    if ((count ?? 0) > 0) {
      return {
        error:
          "Cannot void this expense because stock has already been consumed from it.",
      };
    }
  }

  const timestamp = new Date().toISOString();
  const { error } = await supabase
    .from("ledger_entries")
    .update({
      deleted_at: timestamp,
      voided_at: timestamp,
      voided_by: actorId,
      void_reason: trimmedReason,
      restored_at: null,
      restored_by: null,
    })
    .eq("id", id);

  if (error) {
    console.error("Failed to void expense:", error.message);
    return { error: "Failed to void expense. Please try again." };
  }

  await recordAuditEvent({
    actorId,
    tableName: "ledger_entries",
    recordId: id,
    action: "void",
    reason: trimmedReason,
    previousData: current,
    metadata: { module: "expenses" },
  });

  if (isInventoryBacked && current.item_name && current.quantity) {
    await recordInventoryHistory({
      actorId,
      itemName: current.item_name,
      changeType: "void_reversal",
      source: "expense",
      deltaQty: -Number(current.quantity),
      referenceTable: "ledger_entries",
      referenceId: current.id,
      notes: trimmedReason,
      metadata: { action: "void" },
    });
  }

  revalidatePath("/protected/expenses");
  revalidatePath("/protected/inventory");
  revalidatePath("/protected");
  return { success: true };
}

export async function restoreExpense(id: string, reason?: string) {
  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  const actorId = claims?.claims?.sub ?? null;
  if (!actorId) return { error: "Not authenticated" };

  const { data: current, error: fetchError } = await supabase
    .from("ledger_entries")
    .select("id, type, item_name, quantity, cause_id, deleted_at, void_reason")
    .eq("id", id)
    .in("type", ["expense_bank", "expense_cash"])
    .single();

  if (fetchError || !current) {
    return { error: "Expense not found." };
  }
  if (!current.deleted_at) {
    return { error: "Expense is already active." };
  }

  const timestamp = new Date().toISOString();
  const { error } = await supabase
    .from("ledger_entries")
    .update({
      deleted_at: null,
      restored_at: timestamp,
      restored_by: actorId,
    })
    .eq("id", id);

  if (error) {
    console.error("Failed to restore expense:", error.message);
    return { error: "Failed to restore expense. Please try again." };
  }

  await recordAuditEvent({
    actorId,
    tableName: "ledger_entries",
    recordId: id,
    action: "restore",
    reason: reason?.trim() || null,
    previousData: current,
    metadata: { module: "expenses" },
  });

  const isInventoryBacked = !current.cause_id && !!current.item_name;
  if (isInventoryBacked && current.item_name && current.quantity) {
    await recordInventoryHistory({
      actorId,
      itemName: current.item_name,
      changeType: "restored",
      source: "expense",
      deltaQty: Number(current.quantity),
      referenceTable: "ledger_entries",
      referenceId: current.id,
      notes: reason?.trim() || "Expense restored",
      metadata: { action: "restore" },
    });
  }

  revalidatePath("/protected/expenses");
  revalidatePath("/protected/inventory");
  revalidatePath("/protected");
  return { success: true };
}

export async function deleteExpense(id: string, reason?: string) {
  return voidExpense(id, reason ?? "Voided from expenses list");
}
