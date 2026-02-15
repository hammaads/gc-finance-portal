"use server";

import { createClient } from "@/lib/supabase/server";
import { donationSchema } from "@/lib/schemas/ledger";
import { revalidatePath } from "next/cache";

export async function getDonations() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("ledger_entries")
    .select("*, currencies(code, symbol), donors(name), causes(name), bank_accounts(account_name), to_user:volunteers!ledger_entries_to_user_id_fkey(name), custodian:volunteers!ledger_entries_custodian_id_fkey(name)")
    .in("type", ["donation_bank", "donation_cash", "donation_in_kind"])
    .is("deleted_at", null)
    .order("date", { ascending: false })
    .order("created_at", { ascending: false });
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

  // Resolve donor: use existing donor_id or auto-create from name + phone
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
    if (donorError) return { error: { donor_id: [donorError.message] } };
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
  if (!claims?.claims?.sub) return { error: { amount: ["Not authenticated"] } };

  // For in-kind donations, fill in monetary defaults (amount=0, PKR currency)
  let insertData: Record<string, unknown> = {
    ...parsed.data,
    created_by: claims.claims.sub as string,
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

  const { error } = await supabase.from("ledger_entries").insert(insertData);
  if (error) return { error: { amount: [error.message] } };

  revalidatePath("/protected/donations");
  revalidatePath("/protected/donors");
  revalidatePath("/protected/inventory");
  revalidatePath("/protected");
  return { success: true };
}

export async function deleteDonation(id: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("ledger_entries")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id);
  if (error) return { error: error.message };

  revalidatePath("/protected/donations");
  revalidatePath("/protected");
  return { success: true };
}
