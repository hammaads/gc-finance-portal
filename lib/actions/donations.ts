"use server";

import { recordAuditEvent, recordInventoryHistory } from "@/lib/actions/audit";
import { createClient } from "@/lib/supabase/server";
import { donationSchema } from "@/lib/schemas/ledger";
import { revalidatePath } from "next/cache";

type GetDonationsOptions = {
  includeVoided?: boolean;
};

export async function getDonations(options: GetDonationsOptions = {}) {
  const supabase = await createClient();
  let query = supabase
    .from("ledger_entries")
    .select(
      "*, currencies(code, symbol), donors(name), causes(name), bank_accounts(account_name), to_user:volunteers!ledger_entries_to_user_id_fkey(name), custodian:volunteers!ledger_entries_custodian_id_fkey(name)",
    )
    .in("type", ["donation_bank", "donation_cash", "donation_in_kind"])
    .order("date", { ascending: false })
    .order("created_at", { ascending: false });

  if (!options.includeVoided) {
    query = query.is("deleted_at", null);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data;
}

export async function getDonationById(id: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("ledger_entries")
    .select(
      "*, currencies(code, symbol), donors(name), causes(name), bank_accounts(account_name), to_user:volunteers!ledger_entries_to_user_id_fkey(name), custodian:volunteers!ledger_entries_custodian_id_fkey(name)",
    )
    .eq("id", id)
    .in("type", ["donation_bank", "donation_cash", "donation_in_kind"])
    .single();

  if (error) throw error;
  return data;
}

function emptyToNull(value: FormDataEntryValue | null): string | null {
  if (value === null || value === undefined) return null;
  const s = String(value).trim();
  return s === "" ? null : s;
}

export async function createDonation(formData: FormData) {
  const type = formData.get("type") as string;

  // Resolve donor: use existing donor_id or auto-create from name + phone.
  let donorId = emptyToNull(formData.get("donor_id"));
  const donorName = emptyToNull(formData.get("donor_name"));
  const donorPhone = emptyToNull(formData.get("donor_phone"));

  if (!donorId && donorName) {
    const supabase = await createClient();
    const { data: newDonor, error: donorError } = await supabase
      .from("donors")
      .insert({ name: donorName, phone: donorPhone })
      .select("id")
      .single();
    if (donorError) {
      console.error("Failed to create donor:", donorError.message);
      return { error: { donor_id: ["Failed to save donor. Please try again."] } };
    }
    donorId = newDonor.id;
  }

  if (!donorId) return { error: { donor_id: ["Donor name is required"] } };

  let raw: Record<string, unknown>;

  if (type === "donation_in_kind") {
    raw = {
      type,
      date: formData.get("date"),
      donor_id: donorId,
      item_name: formData.get("item_name"),
      quantity: formData.get("quantity"),
      custodian_id: formData.get("custodian_id"),
      description: emptyToNull(formData.get("description")),
      cause_id: emptyToNull(formData.get("cause_id")),
    };
  } else {
    raw = {
      type,
      amount: formData.get("amount"),
      currency_id: formData.get("currency_id"),
      exchange_rate_to_pkr: formData.get("exchange_rate_to_pkr"),
      date: formData.get("date"),
      description: emptyToNull(formData.get("description")),
      donor_id: donorId,
      cause_id: emptyToNull(formData.get("cause_id")),
    };
    if (type === "donation_bank") {
      raw.bank_account_id = formData.get("bank_account_id");
    } else {
      raw.to_user_id = formData.get("to_user_id");
    }
  }

  const parsed = donationSchema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors };

  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  const actorId = claims?.claims?.sub ?? null;
  if (!actorId) return { error: { amount: ["Not authenticated"] } };

  // For in-kind donations, fill in monetary defaults (amount=0, PKR currency).
  let insertData: Record<string, unknown> = {
    ...parsed.data,
    created_by: actorId,
  };
  if (type === "donation_in_kind") {
    const { data: pkr } = await supabase
      .from("currencies")
      .select("id")
      .eq("is_base", true)
      .single();
    insertData = {
      ...insertData,
      amount: 0,
      unit_price: 0,
      currency_id: pkr?.id,
      exchange_rate_to_pkr: 1,
    };
  }

  const { data: inserted, error } = await supabase
    .from("ledger_entries")
    .insert(insertData)
    .select("*")
    .single();

  if (error) {
    console.error("Failed to create donation:", error.message);
    return { error: { amount: ["Failed to save. Please try again."] } };
  }

  await recordAuditEvent({
    actorId,
    tableName: "ledger_entries",
    recordId: inserted.id,
    action: "create",
    newData: inserted,
    metadata: { module: "donations" },
  });

  if (
    inserted.type === "donation_in_kind" &&
    inserted.item_name &&
    inserted.quantity
  ) {
    await recordInventoryHistory({
      actorId,
      itemName: inserted.item_name,
      changeType: "received",
      source: "donation",
      deltaQty: Number(inserted.quantity),
      referenceTable: "ledger_entries",
      referenceId: inserted.id,
      notes: "In-kind donation received",
      metadata: { donation_type: inserted.type },
    });
  }

  revalidatePath("/protected/donations");
  revalidatePath("/protected/donors");
  revalidatePath("/protected/inventory");
  revalidatePath("/protected");
  return { success: true };
}

export async function voidDonation(id: string, reason: string) {
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
    .select("id, type, item_name, quantity, deleted_at, void_reason")
    .eq("id", id)
    .in("type", ["donation_bank", "donation_cash", "donation_in_kind"])
    .single();

  if (fetchError || !current) {
    return { error: "Donation not found." };
  }

  if (current.deleted_at) {
    return { error: "Donation is already voided." };
  }

  if (current.type === "donation_in_kind") {
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
          "Cannot void this donation because stock has already been consumed from it.",
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
    console.error("Failed to void donation:", error.message);
    return { error: "Failed to void donation. Please try again." };
  }

  await recordAuditEvent({
    actorId,
    tableName: "ledger_entries",
    recordId: id,
    action: "void",
    reason: trimmedReason,
    previousData: current,
    metadata: { module: "donations" },
  });

  if (
    current.type === "donation_in_kind" &&
    current.item_name &&
    current.quantity
  ) {
    await recordInventoryHistory({
      actorId,
      itemName: current.item_name,
      changeType: "void_reversal",
      source: "donation",
      deltaQty: -Number(current.quantity),
      referenceTable: "ledger_entries",
      referenceId: current.id,
      notes: trimmedReason,
      metadata: { action: "void" },
    });
  }

  revalidatePath("/protected/donations");
  revalidatePath("/protected/inventory");
  revalidatePath("/protected");
  return { success: true };
}

export async function restoreDonation(id: string, reason?: string) {
  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  const actorId = claims?.claims?.sub ?? null;
  if (!actorId) return { error: "Not authenticated" };

  const { data: current, error: fetchError } = await supabase
    .from("ledger_entries")
    .select("id, type, item_name, quantity, deleted_at, void_reason")
    .eq("id", id)
    .in("type", ["donation_bank", "donation_cash", "donation_in_kind"])
    .single();

  if (fetchError || !current) {
    return { error: "Donation not found." };
  }

  if (!current.deleted_at) {
    return { error: "Donation is already active." };
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
    console.error("Failed to restore donation:", error.message);
    return { error: "Failed to restore donation. Please try again." };
  }

  await recordAuditEvent({
    actorId,
    tableName: "ledger_entries",
    recordId: id,
    action: "restore",
    reason: reason?.trim() || null,
    previousData: current,
    metadata: { module: "donations" },
  });

  if (
    current.type === "donation_in_kind" &&
    current.item_name &&
    current.quantity
  ) {
    await recordInventoryHistory({
      actorId,
      itemName: current.item_name,
      changeType: "restored",
      source: "donation",
      deltaQty: Number(current.quantity),
      referenceTable: "ledger_entries",
      referenceId: current.id,
      notes: reason?.trim() || "Donation restored",
      metadata: { action: "restore" },
    });
  }

  revalidatePath("/protected/donations");
  revalidatePath("/protected/inventory");
  revalidatePath("/protected");
  return { success: true };
}

export async function deleteDonation(id: string, reason?: string) {
  return voidDonation(id, reason ?? "Voided from donations list");
}
