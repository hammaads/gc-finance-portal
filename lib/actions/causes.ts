"use server";

import { createClient } from "@/lib/supabase/server";
import { causeSchema } from "@/lib/schemas/causes";
import { revalidatePath } from "next/cache";

export async function getCauses() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("causes")
    .select("*")
    .is("deleted_at", null)
    .order("date", { ascending: false, nullsFirst: false })
    .order("name");
  if (error) throw error;
  return data;
}

export async function getCause(id: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("causes")
    .select("*")
    .eq("id", id)
    .single();
  if (error) throw error;
  return data;
}

export async function getDriveFinancialSummaries() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("drive_financial_summary")
    .select("*");
  if (error) throw error;
  return data;
}

export async function getDriveFinancialSummary(causeId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("drive_financial_summary")
    .select("*")
    .eq("cause_id", causeId)
    .single();
  if (error) throw error;
  return data;
}

export async function createCause(formData: FormData) {
  const parsed = causeSchema.safeParse({
    name: formData.get("name"),
    type: formData.get("type"),
    description: formData.get("description") || null,
    date: formData.get("date") || null,
    location: formData.get("location") || null,
    expected_headcount: formData.get("expected_headcount") || null,
  });
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors };

  const supabase = await createClient();
  const { error } = await supabase.from("causes").insert(parsed.data);
  if (error) return { error: { name: [error.message] } };

  revalidatePath("/protected/drives");
  return { success: true };
}

export async function updateCause(formData: FormData) {
  const parsed = causeSchema.safeParse({
    id: formData.get("id"),
    name: formData.get("name"),
    type: formData.get("type"),
    description: formData.get("description") || null,
    date: formData.get("date") || null,
    location: formData.get("location") || null,
    expected_headcount: formData.get("expected_headcount") || null,
  });
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors };

  const { id, ...rest } = parsed.data;
  const supabase = await createClient();
  const { error } = await supabase.from("causes").update(rest).eq("id", id!);
  if (error) return { error: { name: [error.message] } };

  revalidatePath("/protected/drives");
  return { success: true };
}

export async function deleteCause(id: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("causes")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id);
  if (error) return { error: error.message };

  revalidatePath("/protected/drives");
  return { success: true };
}
