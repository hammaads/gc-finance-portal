"use server";

import { recordAuditEvent, recordInventoryHistory } from "@/lib/actions/audit";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

async function fetchLedgerEntry(id: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("ledger_entries")
    .select("id, type, item_name, quantity, cause_id, deleted_at")
    .eq("id", id)
    .single();

  if (error) return null;
  return data;
}

export async function voidLedgerEntry(
  id: string,
  reason: string,
  revalidateVolunteerId?: string,
) {
  const trimmedReason = reason.trim();
  if (!trimmedReason) return { error: "Void reason is required" };

  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  const actorId = claims?.claims?.sub ?? null;
  if (!actorId) return { error: "Not authenticated" };

  const current = await fetchLedgerEntry(id);
  if (!current) return { error: "Ledger entry not found" };
  if (current.deleted_at) return { error: "Ledger entry is already voided" };

  const isInventoryBacked =
    !!current.item_name &&
    !current.cause_id &&
    (current.type === "expense_bank" ||
      current.type === "expense_cash" ||
      current.type === "donation_in_kind");

  if (isInventoryBacked) {
    const { count, error: usageError } = await supabase
      .from("inventory_consumption")
      .select("id", { count: "exact", head: true })
      .eq("ledger_entry_id", id);

    if (usageError) return { error: "Could not validate inventory usage" };
    if ((count ?? 0) > 0) {
      return { error: "Cannot void because stock has already been consumed" };
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
    console.error("Failed to void ledger entry:", error.message);
    return { error: "Failed to void. Please try again." };
  }

  await recordAuditEvent({
    actorId,
    tableName: "ledger_entries",
    recordId: id,
    action: "void",
    reason: trimmedReason,
    previousData: current,
    metadata: { module: "ledger" },
  });

  if (isInventoryBacked && current.item_name && current.quantity) {
    await recordInventoryHistory({
      actorId,
      itemName: current.item_name,
      changeType: "void_reversal",
      source: current.type === "donation_in_kind" ? "donation" : "expense",
      deltaQty: -Number(current.quantity),
      referenceTable: "ledger_entries",
      referenceId: current.id,
      notes: trimmedReason,
      metadata: { action: "void" },
    });
  }

  revalidatePath("/protected/donations");
  revalidatePath("/protected/expenses");
  revalidatePath("/protected/cash");
  if (revalidateVolunteerId) {
    revalidatePath(`/protected/cash/${revalidateVolunteerId}`);
  }
  revalidatePath("/protected/bank-accounts");
  revalidatePath("/protected/inventory");
  revalidatePath("/protected");
  return { success: true };
}

export async function restoreLedgerEntry(
  id: string,
  reason?: string,
  revalidateVolunteerId?: string,
) {
  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  const actorId = claims?.claims?.sub ?? null;
  if (!actorId) return { error: "Not authenticated" };

  const current = await fetchLedgerEntry(id);
  if (!current) return { error: "Ledger entry not found" };
  if (!current.deleted_at) return { error: "Ledger entry is already active" };

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
    console.error("Failed to restore ledger entry:", error.message);
    return { error: "Failed to restore. Please try again." };
  }

  await recordAuditEvent({
    actorId,
    tableName: "ledger_entries",
    recordId: id,
    action: "restore",
    reason: reason?.trim() || null,
    previousData: current,
    metadata: { module: "ledger" },
  });

  const isInventoryBacked =
    !!current.item_name &&
    !current.cause_id &&
    (current.type === "expense_bank" ||
      current.type === "expense_cash" ||
      current.type === "donation_in_kind");

  if (isInventoryBacked && current.item_name && current.quantity) {
    await recordInventoryHistory({
      actorId,
      itemName: current.item_name,
      changeType: "restored",
      source: current.type === "donation_in_kind" ? "donation" : "expense",
      deltaQty: Number(current.quantity),
      referenceTable: "ledger_entries",
      referenceId: current.id,
      notes: reason?.trim() || "Ledger entry restored",
      metadata: { action: "restore" },
    });
  }

  revalidatePath("/protected/donations");
  revalidatePath("/protected/expenses");
  revalidatePath("/protected/cash");
  if (revalidateVolunteerId) {
    revalidatePath(`/protected/cash/${revalidateVolunteerId}`);
  }
  revalidatePath("/protected/bank-accounts");
  revalidatePath("/protected/inventory");
  revalidatePath("/protected");
  return { success: true };
}

/**
 * Backward-compatible wrapper used by existing UI.
 */
export async function deleteLedgerEntry(
  id: string,
  revalidateVolunteerId?: string,
  reason = "Voided from transaction history",
) {
  return voidLedgerEntry(id, reason, revalidateVolunteerId);
}
