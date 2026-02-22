"use server";

import { recordAuditEvent, recordInventoryHistory } from "@/lib/actions/audit";
import { createClient } from "@/lib/supabase/server";
import {
  consumeInventorySchema,
  custodyTransferSchema,
  adjustInventorySchema,
} from "@/lib/schemas/inventory";
import { revalidatePath } from "next/cache";

export async function getInventoryItems() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("inventory_current")
    .select("*")
    .order("item_name");
  if (error) throw error;
  return data;
}

export async function getInventoryByCustodian() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("inventory_by_custodian")
    .select("*");
  if (error) throw error;
  return data;
}

export async function getInventoryHistory(itemKey: string) {
  const supabase = await createClient();
  const normalized = itemKey.trim().toLowerCase().replace(/\s+/g, " ");
  const { data, error } = await supabase
    .from("inventory_history")
    .select("*")
    .eq("item_key", normalized)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}

export async function getCustodyTransfers(ledgerEntryId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("custody_transfers")
    .select(
      "*, from_volunteer:volunteers!custody_transfers_from_volunteer_id_fkey(name), to_volunteer:volunteers!custody_transfers_to_volunteer_id_fkey(name), transferred:profiles!custody_transfers_transferred_by_fkey(display_name)",
    )
    .eq("ledger_entry_id", ledgerEntryId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}

export async function consumeInventory(formData: FormData) {
  const raw = {
    ledger_entry_id: formData.get("ledger_entry_id"),
    cause_id: formData.get("cause_id"),
    quantity: formData.get("quantity"),
    notes: formData.get("notes"),
  };

  const parsed = consumeInventorySchema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors };

  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  const actorId = claims?.claims?.sub ?? null;
  if (!actorId) return { error: { quantity: ["Not authenticated"] } };

  // Get the inventory lot to check availability and compute unit price.
  const { data: item, error: itemError } = await supabase
    .from("inventory_current")
    .select("*")
    .eq("ledger_entry_id", parsed.data.ledger_entry_id)
    .single();

  if (itemError || !item) {
    return { error: { quantity: ["Inventory item not found"] } };
  }

  if (parsed.data.quantity > Number(item.available_qty)) {
    return {
      error: {
        quantity: [
          `Only ${item.available_qty} available (requested ${parsed.data.quantity})`,
        ],
      },
    };
  }

  const sourceType =
    (item.source_type as "donated" | "purchased" | null) ?? "purchased";
  const unitPricePkr =
    Number(item.amount_pkr) / Math.max(Number(item.purchased_qty), 1);

  const { data: inserted, error } = await supabase
    .from("inventory_consumption")
    .insert({
      ledger_entry_id: parsed.data.ledger_entry_id,
      cause_id: parsed.data.cause_id,
      quantity: parsed.data.quantity,
      unit_price_pkr: unitPricePkr,
      consumed_by: actorId,
      source_type: sourceType,
      notes: parsed.data.notes,
    })
    .select("id")
    .single();

  if (error) {
    console.error("Failed to consume inventory:", error.message);
    return { error: { quantity: ["Failed to save. Please try again."] } };
  }

  await recordAuditEvent({
    actorId,
    tableName: "inventory_consumption",
    recordId: inserted.id,
    action: "consume",
    reason: parsed.data.notes,
    metadata: {
      source_type: sourceType,
      quantity: parsed.data.quantity,
      ledger_entry_id: parsed.data.ledger_entry_id,
      cause_id: parsed.data.cause_id,
    },
  });

  if (item.item_name) {
    await recordInventoryHistory({
      actorId,
      itemName: item.item_name,
      changeType: "used",
      source: "drive_consumption",
      deltaQty: -Number(parsed.data.quantity),
      referenceTable: "inventory_consumption",
      referenceId: inserted.id,
      notes: parsed.data.notes,
      metadata: {
        source_type: sourceType,
        cause_id: parsed.data.cause_id,
        ledger_entry_id: parsed.data.ledger_entry_id,
      },
    });
  }

  revalidatePath("/protected/inventory");
  revalidatePath("/protected/drives");
  revalidatePath("/protected");
  return { success: true };
}

export async function transferCustody(formData: FormData) {
  const raw = {
    ledger_entry_id: formData.get("ledger_entry_id"),
    from_volunteer_id: formData.get("from_volunteer_id"),
    to_volunteer_id: formData.get("to_volunteer_id"),
    quantity: formData.get("quantity"),
  };

  const parsed = custodyTransferSchema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors };

  if (parsed.data.from_volunteer_id === parsed.data.to_volunteer_id) {
    return {
      error: { to_volunteer_id: ["Cannot transfer to the same volunteer"] },
    };
  }

  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  const actorId = claims?.claims?.sub ?? null;
  if (!actorId) return { error: { quantity: ["Not authenticated"] } };

  const { data: holdings, error: holdError } = await supabase
    .from("inventory_by_custodian")
    .select("qty_held")
    .eq("ledger_entry_id", parsed.data.ledger_entry_id)
    .eq("volunteer_id", parsed.data.from_volunteer_id)
    .single();

  if (holdError || !holdings) {
    return {
      error: { from_volunteer_id: ["Volunteer does not hold this item"] },
    };
  }

  if (parsed.data.quantity > Number(holdings.qty_held)) {
    return {
      error: {
        quantity: [
          `Volunteer only holds ${holdings.qty_held} (requested ${parsed.data.quantity})`,
        ],
      },
    };
  }

  const { data: transfer, error } = await supabase
    .from("custody_transfers")
    .insert({
      ledger_entry_id: parsed.data.ledger_entry_id,
      from_volunteer_id: parsed.data.from_volunteer_id,
      to_volunteer_id: parsed.data.to_volunteer_id,
      quantity: parsed.data.quantity,
      transferred_by: actorId,
    })
    .select("id")
    .single();

  if (error) {
    console.error("Failed to transfer custody:", error.message);
    return { error: { quantity: ["Failed to save. Please try again."] } };
  }

  const { data: item } = await supabase
    .from("inventory_current")
    .select("item_name")
    .eq("ledger_entry_id", parsed.data.ledger_entry_id)
    .single();

  await recordAuditEvent({
    actorId,
    tableName: "custody_transfers",
    recordId: transfer.id,
    action: "transfer",
    metadata: {
      ledger_entry_id: parsed.data.ledger_entry_id,
      from_volunteer_id: parsed.data.from_volunteer_id,
      to_volunteer_id: parsed.data.to_volunteer_id,
      quantity: parsed.data.quantity,
    },
  });

  if (item?.item_name) {
    await recordInventoryHistory({
      actorId,
      itemName: item.item_name,
      changeType: "transfer",
      source: "manual",
      deltaQty: 0,
      referenceTable: "custody_transfers",
      referenceId: transfer.id,
      notes: `Transferred ${parsed.data.quantity} between custodians`,
      metadata: {
        from_volunteer_id: parsed.data.from_volunteer_id,
        to_volunteer_id: parsed.data.to_volunteer_id,
        quantity: parsed.data.quantity,
      },
    });
  }

  revalidatePath("/protected/inventory");
  revalidatePath("/protected");
  return { success: true };
}

export async function adjustInventory(formData: FormData) {
  const raw = {
    ledger_entry_id: formData.get("ledger_entry_id"),
    new_quantity: formData.get("new_quantity"),
  };

  const parsed = adjustInventorySchema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors };

  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  const actorId = claims?.claims?.sub ?? null;
  if (!actorId) return { error: { new_quantity: ["Not authenticated"] } };

  const { data: consumedAgg } = await supabase
    .from("inventory_consumption")
    .select("quantity")
    .eq("ledger_entry_id", parsed.data.ledger_entry_id);

  const consumedQty = (consumedAgg ?? []).reduce(
    (sum, row) => sum + Number(row.quantity ?? 0),
    0,
  );
  const minQty = consumedQty;

  if (parsed.data.new_quantity < minQty) {
    return {
      error: {
        new_quantity: [
          `Cannot reduce below ${minQty} (${consumedQty} already consumed)`,
        ],
      },
    };
  }

  const { data: entry, error: entryError } = await supabase
    .from("ledger_entries")
    .select("id, quantity, unit_price, item_name, cause_id, type")
    .eq("id", parsed.data.ledger_entry_id)
    .single();

  if (entryError || !entry) {
    return { error: { new_quantity: ["Expense not found"] } };
  }

  const oldQty = Number(entry.quantity ?? 0);
  const newQty = Number(parsed.data.new_quantity);
  const delta = newQty - oldQty;
  const newAmount = newQty * Number(entry.unit_price ?? 0);

  const { error } = await supabase
    .from("ledger_entries")
    .update({
      quantity: newQty,
      amount: newAmount,
    })
    .eq("id", parsed.data.ledger_entry_id);

  if (error) {
    console.error("Failed to adjust inventory:", error.message);
    return { error: { new_quantity: ["Failed to save. Please try again."] } };
  }

  await recordAuditEvent({
    actorId,
    tableName: "ledger_entries",
    recordId: entry.id,
    action: "adjust",
    previousData: { quantity: oldQty },
    newData: { quantity: newQty, amount: newAmount },
    metadata: { module: "inventory_adjustment" },
  });

  const isInventoryBacked =
    !!entry.item_name &&
    !entry.cause_id &&
    (entry.type === "expense_bank" ||
      entry.type === "expense_cash" ||
      entry.type === "donation_in_kind");

  if (isInventoryBacked && entry.item_name && delta !== 0) {
    await recordInventoryHistory({
      actorId,
      itemName: entry.item_name,
      changeType: "adjusted",
      source: "manual",
      deltaQty: delta,
      referenceTable: "ledger_entries",
      referenceId: entry.id,
      notes: "Manual inventory adjustment",
      metadata: { old_quantity: oldQty, new_quantity: newQty },
    });
  }

  revalidatePath("/protected/inventory");
  revalidatePath("/protected/expenses");
  revalidatePath("/protected");
  return { success: true };
}

export async function getDriveExpenseBreakdown(causeId: string) {
  const supabase = await createClient();

  // Direct expenses for this drive.
  const { data: directExpenses, error: directError } = await supabase
    .from("ledger_entries")
    .select(
      "id, item_name, quantity, unit_price, amount_pkr, date, expense_categories(name)",
    )
    .eq("cause_id", causeId)
    .in("type", ["expense_bank", "expense_cash"])
    .is("deleted_at", null)
    .order("date", { ascending: false });
  if (directError) throw directError;

  // Consumed inventory for this drive.
  const { data: consumedItems, error: consumedError } = await supabase
    .from("inventory_consumption")
    .select(
      "id, quantity, total_pkr, unit_price_pkr, source_type, notes, created_at, ledger_entry:ledger_entries!inventory_consumption_ledger_entry_id_fkey(item_name, expense_categories(name))",
    )
    .eq("cause_id", causeId)
    .order("created_at", { ascending: false });
  if (consumedError) throw consumedError;

  return { directExpenses, consumedItems };
}
