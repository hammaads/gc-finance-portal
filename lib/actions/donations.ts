"use server";

import { createClient } from "@/lib/supabase/server";
import { donationSchema } from "@/lib/schemas/ledger";
import { revalidatePath } from "next/cache";

export async function getDonations() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("ledger_entries")
    .select("*, currencies(code, symbol), donors(name), causes(name), bank_accounts(account_name), to_user:profiles!ledger_entries_to_user_id_fkey(display_name)")
    .in("type", ["donation_bank", "donation_cash"])
    .is("deleted_at", null)
    .order("date", { ascending: false })
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}

export async function createDonation(formData: FormData) {
  const type = formData.get("type") as string;

  const raw: Record<string, unknown> = {
    type,
    amount: formData.get("amount"),
    currency_id: formData.get("currency_id"),
    exchange_rate_to_pkr: formData.get("exchange_rate_to_pkr"),
    date: formData.get("date"),
    description: formData.get("description") || null,
    donor_id: formData.get("donor_id"),
    cause_id: formData.get("cause_id") || null,
  };

  if (type === "donation_bank") {
    raw.bank_account_id = formData.get("bank_account_id");
  } else {
    raw.to_user_id = formData.get("to_user_id");
  }

  const parsed = donationSchema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors };

  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  if (!claims?.claims?.sub) return { error: { amount: ["Not authenticated"] } };

  const { error } = await supabase.from("ledger_entries").insert({
    ...parsed.data,
    created_by: claims.claims.sub as string,
  });
  if (error) return { error: { amount: [error.message] } };

  revalidatePath("/protected/donations");
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
