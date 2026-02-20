"use server";

import { createClient } from "@/lib/supabase/server";

/** Shape of one inventory history entry (GC-INV-003). Table created by migration. */
export type InventoryHistoryEntry = {
  id: string;
  ledger_entry_id: string | null;
  item_name: string;
  change_type: "received" | "used" | "adjusted";
  delta: number;
  source: "donation" | "expense" | "drive_consumption" | "manual";
  reference_id: string | null;
  notes: string | null;
  quantity_after: number | null;
  created_at: string;
  created_by: string | null;
};

/**
 * Fetch inventory history for an item (by ledger_entry_id or item_name).
 * Returns [] until migration 20250220110000_add_inventory_history is run.
 */
export async function getInventoryHistory(
  opts: { ledgerEntryId?: string; itemName?: string }
): Promise<InventoryHistoryEntry[]> {
  const supabase = await createClient();
  let query = supabase
    .from("inventory_history")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(100);

  if (opts.ledgerEntryId) {
    query = query.eq("ledger_entry_id", opts.ledgerEntryId);
  } else if (opts.itemName?.trim()) {
    query = query.ilike("item_name", opts.itemName.trim());
  } else {
    return [];
  }

  const { data, error } = await query;
  if (error) return []; // Table may not exist yet
  return (data ?? []) as InventoryHistoryEntry[];
}
