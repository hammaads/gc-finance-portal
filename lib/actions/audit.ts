"use server";

import { createClient } from "@/lib/supabase/server";

type AuditEventInput = {
  actorId: string | null;
  tableName: string;
  recordId?: string | null;
  action:
    | "create"
    | "update"
    | "void"
    | "restore"
    | "consume"
    | "transfer"
    | "adjust";
  reason?: string | null;
  previousData?: Record<string, unknown> | null;
  newData?: Record<string, unknown> | null;
  metadata?: Record<string, unknown> | null;
};

type InventoryHistoryInput = {
  actorId: string | null;
  itemName: string;
  changeType:
    | "received"
    | "used"
    | "adjusted"
    | "void_reversal"
    | "restored"
    | "transfer";
  source: "donation" | "expense" | "drive_consumption" | "manual";
  deltaQty: number;
  referenceTable?: string | null;
  referenceId?: string | null;
  notes?: string | null;
  metadata?: Record<string, unknown> | null;
};

function normalizeInventoryItemKey(itemName: string): string {
  return itemName.trim().toLowerCase().replace(/\s+/g, " ");
}

export async function recordAuditEvent(input: AuditEventInput) {
  try {
    const supabase = await createClient();
    await supabase.from("audit_events").insert({
      actor_id: input.actorId,
      table_name: input.tableName,
      record_id: input.recordId ?? null,
      action: input.action,
      reason: input.reason ?? null,
      previous_data: input.previousData ?? null,
      new_data: input.newData ?? null,
      metadata: input.metadata ?? {},
    });
  } catch (error) {
    console.error("Failed to record audit event", error);
  }
}

export async function recordInventoryHistory(input: InventoryHistoryInput) {
  try {
    const itemKey = normalizeInventoryItemKey(input.itemName);
    const supabase = await createClient();
    await supabase.from("inventory_history").insert({
      actor_id: input.actorId,
      item_key: itemKey,
      item_name: input.itemName,
      change_type: input.changeType,
      source: input.source,
      delta_qty: input.deltaQty,
      reference_table: input.referenceTable ?? null,
      reference_id: input.referenceId ?? null,
      notes: input.notes ?? null,
      metadata: input.metadata ?? {},
    });
  } catch (error) {
    console.error("Failed to record inventory history", error);
  }
}
