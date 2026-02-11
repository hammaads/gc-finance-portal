"use server";

import { createClient } from "@/lib/supabase/server";
import { donorSchema } from "@/lib/schemas/donors";
import { revalidatePath } from "next/cache";

export async function getDonors() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("donors")
    .select("*")
    .is("deleted_at", null)
    .order("name");
  if (error) throw error;
  return data;
}

export async function getDonor(id: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("donors")
    .select("*")
    .eq("id", id)
    .single();
  if (error) throw error;
  return data;
}

export async function getDonorDonations(donorId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("ledger_entries")
    .select("*, currencies(code, symbol), causes(name), bank_accounts(account_name), to_user:profiles!ledger_entries_to_user_id_fkey(display_name)")
    .eq("donor_id", donorId)
    .is("deleted_at", null)
    .order("date", { ascending: false });
  if (error) throw error;
  return data;
}

export async function createDonor(formData: FormData) {
  const parsed = donorSchema.safeParse({
    name: formData.get("name"),
    phone: formData.get("phone") || null,
    email: formData.get("email") || null,
  });
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors };

  const supabase = await createClient();
  const { error } = await supabase.from("donors").insert(parsed.data);
  if (error) return { error: { name: [error.message] } };

  revalidatePath("/protected/donors");
  return { success: true };
}

export async function updateDonor(formData: FormData) {
  const parsed = donorSchema.safeParse({
    id: formData.get("id"),
    name: formData.get("name"),
    phone: formData.get("phone") || null,
    email: formData.get("email") || null,
  });
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors };

  const { id, ...rest } = parsed.data;
  const supabase = await createClient();
  const { error } = await supabase.from("donors").update(rest).eq("id", id!);
  if (error) return { error: { name: [error.message] } };

  revalidatePath("/protected/donors");
  return { success: true };
}

export async function deleteDonor(id: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("donors")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id);
  if (error) return { error: error.message };

  revalidatePath("/protected/donors");
  return { success: true };
}
