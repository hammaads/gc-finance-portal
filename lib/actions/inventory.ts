"use server";

import { recordAuditEvent, recordInventoryHistory } from "@/lib/actions/audit";
import { createClient } from "@/lib/supabase/server";
import {
  consumeInventorySchema,
  consumeInventoryMergedSchema,
  custodyTransferSchema,
  custodyTransferMergedSchema,
  adjustInventorySchema,
  adjustInventoryMergedSchema,
} from "@/lib/schemas/inventory";
import { revalidatePath } from "next/cache";

type InventoryLot = {
  ledger_entry_id: string;
  item_name: string;
  purchased_qty: number;
  amount_pkr: number;
  available_qty: number;
  consumed_qty: number;
  purchase_date: string | null;
  source_type: "donated" | "purchased";
};

function normalizeIds(ids: string[]) {
  return Array.from(new Set(ids));
}

async function getInventoryLotsByIds(ledgerEntryIds: string[]) {
  const supabase = await createClient();
  const uniqueIds = normalizeIds(ledgerEntryIds);
  const { data, error } = await supabase
    .from("inventory_current")
    .select(
      "ledger_entry_id, item_name, purchased_qty, amount_pkr, available_qty, consumed_qty, purchase_date, source_type",
    )
    .in("ledger_entry_id", uniqueIds);
  if (error) throw error;
  return ((data ?? []) as InventoryLot[]).sort((a, b) => {
    const aTime = a.purchase_date ? new Date(a.purchase_date).getTime() : 0;
    const bTime = b.purchase_date ? new Date(b.purchase_date).getTime() : 0;
    return aTime - bTime;
  });
}

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

export async function consumeInventoryMerged(formData: FormData) {
  const raw = {
    ledger_entry_ids: formData.getAll("ledger_entry_ids").map(String),
    cause_id: formData.get("cause_id"),
    quantity: formData.get("quantity"),
    notes: formData.get("notes"),
  };

  const parsed = consumeInventoryMergedSchema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors };

  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  const actorId = claims?.claims?.sub ?? null;
  if (!actorId) return { error: { quantity: ["Not authenticated"] } };

  const lots = await getInventoryLotsByIds(parsed.data.ledger_entry_ids);
  if (lots.length === 0) return { error: { quantity: ["Inventory item not found"] } };

  const requestedQty = Number(parsed.data.quantity);
  const totalAvailable = lots.reduce(
    (sum, lot) => sum + Number(lot.available_qty ?? 0),
    0,
  );
  if (requestedQty > totalAvailable) {
    return {
      error: {
        quantity: [
          `Only ${totalAvailable} available (requested ${requestedQty})`,
        ],
      },
    };
  }

  let remaining = requestedQty;
  const inserts: Array<{
    ledger_entry_id: string;
    cause_id: string;
    quantity: number;
    unit_price_pkr: number;
    consumed_by: string;
    source_type: "donated" | "purchased";
    notes: string;
  }> = [];

  for (const lot of lots) {
    if (remaining <= 0) break;
    const lotAvailable = Number(lot.available_qty ?? 0);
    if (lotAvailable <= 0) continue;
    const allocated = Math.min(remaining, lotAvailable);
    const unitPricePkr =
      Number(lot.amount_pkr ?? 0) / Math.max(Number(lot.purchased_qty ?? 0), 1);

    inserts.push({
      ledger_entry_id: lot.ledger_entry_id,
      cause_id: parsed.data.cause_id,
      quantity: allocated,
      unit_price_pkr: unitPricePkr,
      consumed_by: actorId,
      source_type: lot.source_type ?? "purchased",
      notes: parsed.data.notes,
    });
    remaining -= allocated;
  }

  if (remaining > 0) {
    return { error: { quantity: ["Could not allocate full quantity across lots"] } };
  }

  const { data: insertedRows, error } = await supabase
    .from("inventory_consumption")
    .insert(inserts)
    .select("id, ledger_entry_id, quantity");

  if (error) {
    console.error("Failed to consume merged inventory:", error.message);
    return { error: { quantity: ["Failed to save. Please try again."] } };
  }

  const lotById = new Map(lots.map((lot) => [lot.ledger_entry_id, lot]));
  for (const row of insertedRows ?? []) {
    const lot = lotById.get(row.ledger_entry_id);
    if (!lot) continue;

    await recordAuditEvent({
      actorId,
      tableName: "inventory_consumption",
      recordId: row.id,
      action: "consume",
      reason: parsed.data.notes,
      metadata: {
        source_type: lot.source_type ?? "purchased",
        quantity: Number(row.quantity),
        ledger_entry_id: row.ledger_entry_id,
        cause_id: parsed.data.cause_id,
        merged_item_action: true,
      },
    });

    if (lot.item_name) {
      await recordInventoryHistory({
        actorId,
        itemName: lot.item_name,
        changeType: "used",
        source: "drive_consumption",
        deltaQty: -Number(row.quantity),
        referenceTable: "inventory_consumption",
        referenceId: row.id,
        notes: parsed.data.notes,
        metadata: {
          source_type: lot.source_type ?? "purchased",
          cause_id: parsed.data.cause_id,
          ledger_entry_id: row.ledger_entry_id,
          merged_item_action: true,
        },
      });
    }
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

export async function transferCustodyMerged(formData: FormData) {
  const raw = {
    ledger_entry_ids: formData.getAll("ledger_entry_ids").map(String),
    from_volunteer_id: formData.get("from_volunteer_id"),
    to_volunteer_id: formData.get("to_volunteer_id"),
    quantity: formData.get("quantity"),
  };

  const parsed = custodyTransferMergedSchema.safeParse(raw);
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

  const lots = await getInventoryLotsByIds(parsed.data.ledger_entry_ids);
  if (lots.length === 0) {
    return {
      error: { from_volunteer_id: ["Volunteer does not hold this item"] },
    };
  }
  const lotById = new Map(lots.map((lot) => [lot.ledger_entry_id, lot]));

  const { data: holdingRows, error: holdError } = await supabase
    .from("inventory_by_custodian")
    .select("ledger_entry_id, qty_held")
    .eq("volunteer_id", parsed.data.from_volunteer_id)
    .in("ledger_entry_id", normalizeIds(parsed.data.ledger_entry_ids));

  if (holdError) {
    return {
      error: { from_volunteer_id: ["Volunteer does not hold this item"] },
    };
  }

  const holdings = (holdingRows ?? [])
    .map((row) => ({
      ledger_entry_id: row.ledger_entry_id as string,
      qty_held: Number(row.qty_held ?? 0),
      purchase_date: lotById.get(row.ledger_entry_id as string)?.purchase_date ?? null,
    }))
    .filter((row) => row.qty_held > 0)
    .sort((a, b) => {
      const aTime = a.purchase_date ? new Date(a.purchase_date).getTime() : 0;
      const bTime = b.purchase_date ? new Date(b.purchase_date).getTime() : 0;
      return aTime - bTime;
    });

  const totalHeld = holdings.reduce((sum, row) => sum + row.qty_held, 0);
  const requestedQty = Number(parsed.data.quantity);

  if (totalHeld <= 0) {
    return {
      error: { from_volunteer_id: ["Volunteer does not hold this item"] },
    };
  }

  if (requestedQty > totalHeld) {
    return {
      error: {
        quantity: [
          `Volunteer only holds ${totalHeld} (requested ${requestedQty})`,
        ],
      },
    };
  }

  let remaining = requestedQty;
  const inserts: Array<{
    ledger_entry_id: string;
    from_volunteer_id: string;
    to_volunteer_id: string;
    quantity: number;
    transferred_by: string;
  }> = [];
  for (const holding of holdings) {
    if (remaining <= 0) break;
    const allocated = Math.min(remaining, holding.qty_held);
    inserts.push({
      ledger_entry_id: holding.ledger_entry_id,
      from_volunteer_id: parsed.data.from_volunteer_id,
      to_volunteer_id: parsed.data.to_volunteer_id,
      quantity: allocated,
      transferred_by: actorId,
    });
    remaining -= allocated;
  }

  if (remaining > 0) {
    return { error: { quantity: ["Could not allocate full quantity across lots"] } };
  }

  const { data: transfers, error } = await supabase
    .from("custody_transfers")
    .insert(inserts)
    .select("id, ledger_entry_id, quantity");

  if (error) {
    console.error("Failed to transfer merged custody:", error.message);
    return { error: { quantity: ["Failed to save. Please try again."] } };
  }

  for (const transfer of transfers ?? []) {
    const lot = lotById.get(transfer.ledger_entry_id);
    await recordAuditEvent({
      actorId,
      tableName: "custody_transfers",
      recordId: transfer.id,
      action: "transfer",
      metadata: {
        ledger_entry_id: transfer.ledger_entry_id,
        from_volunteer_id: parsed.data.from_volunteer_id,
        to_volunteer_id: parsed.data.to_volunteer_id,
        quantity: Number(transfer.quantity),
        merged_item_action: true,
      },
    });

    if (lot?.item_name) {
      await recordInventoryHistory({
        actorId,
        itemName: lot.item_name,
        changeType: "transfer",
        source: "manual",
        deltaQty: 0,
        referenceTable: "custody_transfers",
        referenceId: transfer.id,
        notes: `Transferred ${Number(transfer.quantity)} between custodians`,
        metadata: {
          from_volunteer_id: parsed.data.from_volunteer_id,
          to_volunteer_id: parsed.data.to_volunteer_id,
          quantity: Number(transfer.quantity),
          ledger_entry_id: transfer.ledger_entry_id,
          merged_item_action: true,
        },
      });
    }
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

export async function adjustInventoryMerged(formData: FormData) {
  const raw = {
    ledger_entry_ids: formData.getAll("ledger_entry_ids").map(String),
    new_quantity: formData.get("new_quantity"),
  };

  const parsed = adjustInventoryMergedSchema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors };

  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  const actorId = claims?.claims?.sub ?? null;
  if (!actorId) return { error: { new_quantity: ["Not authenticated"] } };

  const lots = await getInventoryLotsByIds(parsed.data.ledger_entry_ids);
  if (lots.length === 0) return { error: { new_quantity: ["Expense not found"] } };
  const lotById = new Map(lots.map((lot) => [lot.ledger_entry_id, lot]));

  const { data: entries, error: entriesError } = await supabase
    .from("ledger_entries")
    .select("id, quantity, unit_price, item_name, cause_id, type")
    .in("id", normalizeIds(parsed.data.ledger_entry_ids));
  if (entriesError || !entries?.length) {
    return { error: { new_quantity: ["Expense not found"] } };
  }

  const consumedById = new Map(
    lots.map((lot) => [lot.ledger_entry_id, Number(lot.consumed_qty ?? 0)]),
  );
  const oldById = new Map(
    entries.map((entry) => [entry.id as string, Number(entry.quantity ?? 0)]),
  );

  const oldTotalQty = entries.reduce(
    (sum, entry) => sum + Number(entry.quantity ?? 0),
    0,
  );
  const minTotalQty = Array.from(consumedById.values()).reduce(
    (sum, consumed) => sum + consumed,
    0,
  );
  const newTotalQty = Number(parsed.data.new_quantity);

  if (newTotalQty < minTotalQty) {
    return {
      error: {
        new_quantity: [
          `Cannot reduce below ${minTotalQty} (${minTotalQty} already consumed)`,
        ],
      },
    };
  }

  const sortedLots = [...lots].sort((a, b) => {
    const aTime = a.purchase_date ? new Date(a.purchase_date).getTime() : 0;
    const bTime = b.purchase_date ? new Date(b.purchase_date).getTime() : 0;
    return aTime - bTime;
  });
  const targetById = new Map<string, number>();
  for (const lot of sortedLots) {
    targetById.set(lot.ledger_entry_id, oldById.get(lot.ledger_entry_id) ?? 0);
  }

  const delta = newTotalQty - oldTotalQty;
  if (delta > 0) {
    const firstLotId = sortedLots[0]?.ledger_entry_id;
    if (firstLotId) targetById.set(firstLotId, (targetById.get(firstLotId) ?? 0) + delta);
  } else if (delta < 0) {
    let toReduce = Math.abs(delta);
    for (const lot of [...sortedLots].reverse()) {
      if (toReduce <= 0) break;
      const current = targetById.get(lot.ledger_entry_id) ?? 0;
      const minAllowed = consumedById.get(lot.ledger_entry_id) ?? 0;
      const reducible = Math.max(current - minAllowed, 0);
      if (reducible <= 0) continue;
      const cut = Math.min(reducible, toReduce);
      targetById.set(lot.ledger_entry_id, current - cut);
      toReduce -= cut;
    }
    if (toReduce > 0) {
      return {
        error: {
          new_quantity: ["Could not safely distribute quantity reduction across lots"],
        },
      };
    }
  }

  for (const entry of entries) {
    const entryId = entry.id as string;
    const oldQty = Number(entry.quantity ?? 0);
    const newQty = Number(targetById.get(entryId) ?? oldQty);
    if (newQty === oldQty) continue;

    const newAmount = newQty * Number(entry.unit_price ?? 0);
    const { error } = await supabase
      .from("ledger_entries")
      .update({
        quantity: newQty,
        amount: newAmount,
      })
      .eq("id", entryId);
    if (error) {
      console.error("Failed to adjust merged inventory:", error.message);
      return { error: { new_quantity: ["Failed to save. Please try again."] } };
    }

    await recordAuditEvent({
      actorId,
      tableName: "ledger_entries",
      recordId: entryId,
      action: "adjust",
      previousData: { quantity: oldQty },
      newData: { quantity: newQty, amount: newAmount },
      metadata: { module: "inventory_adjustment", merged_item_action: true },
    });

    const lot = lotById.get(entryId);
    const deltaQty = newQty - oldQty;
    const isInventoryBacked =
      !!entry.item_name &&
      !entry.cause_id &&
      (entry.type === "expense_bank" ||
        entry.type === "expense_cash" ||
        entry.type === "donation_in_kind");

    if (isInventoryBacked && lot?.item_name && deltaQty !== 0) {
      await recordInventoryHistory({
        actorId,
        itemName: lot.item_name,
        changeType: "adjusted",
        source: "manual",
        deltaQty,
        referenceTable: "ledger_entries",
        referenceId: entryId,
        notes: "Manual inventory adjustment",
        metadata: {
          old_quantity: oldQty,
          new_quantity: newQty,
          merged_item_action: true,
        },
      });
    }
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
