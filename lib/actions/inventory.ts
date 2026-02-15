"use server";

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

export async function getCustodyTransfers(ledgerEntryId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("custody_transfers")
    .select(
      "*, from_volunteer:profiles!custody_transfers_from_volunteer_id_fkey(display_name), to_volunteer:profiles!custody_transfers_to_volunteer_id_fkey(display_name), transferred:profiles!custody_transfers_transferred_by_fkey(display_name)",
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
  };

  const parsed = consumeInventorySchema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors };

  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  if (!claims?.claims?.sub)
    return { error: { quantity: ["Not authenticated"] } };

  // Get the inventory item to check availability and compute unit price
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

  // Compute unit price in PKR for cost allocation
  const unitPricePkr =
    Number(item.amount_pkr) / Number(item.purchased_qty);

  const { error } = await supabase.from("inventory_consumption").insert({
    ledger_entry_id: parsed.data.ledger_entry_id,
    cause_id: parsed.data.cause_id,
    quantity: parsed.data.quantity,
    unit_price_pkr: unitPricePkr,
    consumed_by: claims.claims.sub as string,
  });

  if (error) return { error: { quantity: [error.message] } };

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
  if (!claims?.claims?.sub)
    return { error: { quantity: ["Not authenticated"] } };

  // Check that from_volunteer holds enough
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

  const { error } = await supabase.from("custody_transfers").insert({
    ledger_entry_id: parsed.data.ledger_entry_id,
    from_volunteer_id: parsed.data.from_volunteer_id,
    to_volunteer_id: parsed.data.to_volunteer_id,
    quantity: parsed.data.quantity,
    transferred_by: claims.claims.sub as string,
  });

  if (error) return { error: { quantity: [error.message] } };

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
  if (!claims?.claims?.sub)
    return { error: { new_quantity: ["Not authenticated"] } };

  // Get current consumed quantity to ensure new_quantity >= consumed
  const { data: item, error: itemError } = await supabase
    .from("inventory_current")
    .select("consumed_qty, purchased_qty")
    .eq("ledger_entry_id", parsed.data.ledger_entry_id)
    .single();

  // If item not in inventory_current, it may be fully consumed — check ledger directly
  const consumedQty = item ? Number(item.consumed_qty) : 0;
  const minQty = consumedQty; // Can't reduce below already-consumed amount

  if (parsed.data.new_quantity < minQty) {
    return {
      error: {
        new_quantity: [
          `Cannot reduce below ${minQty} (${consumedQty} already consumed)`,
        ],
      },
    };
  }

  // Update the quantity on the ledger entry and recompute amount
  const { data: entry, error: entryError } = await supabase
    .from("ledger_entries")
    .select("unit_price")
    .eq("id", parsed.data.ledger_entry_id)
    .single();

  if (entryError || !entry) {
    return { error: { new_quantity: ["Expense not found"] } };
  }

  const newAmount = parsed.data.new_quantity * Number(entry.unit_price);

  const { error } = await supabase
    .from("ledger_entries")
    .update({
      quantity: parsed.data.new_quantity,
      amount: newAmount,
    })
    .eq("id", parsed.data.ledger_entry_id);

  if (error) return { error: { new_quantity: [error.message] } };

  revalidatePath("/protected/inventory");
  revalidatePath("/protected/expenses");
  revalidatePath("/protected");
  return { success: true };
}

export async function getDriveExpenseBreakdown(causeId: string) {
  const supabase = await createClient();

  // Direct expenses for this drive
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

  // Consumed inventory for this drive
  const { data: consumedItems, error: consumedError } = await supabase
    .from("inventory_consumption")
    .select(
      "id, quantity, total_pkr, unit_price_pkr, created_at, ledger_entry:ledger_entries!inventory_consumption_ledger_entry_id_fkey(item_name, expense_categories(name))",
    )
    .eq("cause_id", causeId)
    .order("created_at", { ascending: false });
  if (consumedError) throw consumedError;

  return { directExpenses, consumedItems };
}
