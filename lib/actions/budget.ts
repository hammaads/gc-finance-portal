"use server";

import { createClient } from "@/lib/supabase/server";
import { budgetItemSchema } from "@/lib/schemas/budget";
import { revalidatePath } from "next/cache";

export async function getBudgetItems(causeId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("budget_items")
    .select("*, expense_categories(name), currencies(code, symbol)")
    .eq("cause_id", causeId)
    .is("deleted_at", null)
    .order("created_at");
  if (error) throw error;
  return data;
}

export async function getBudgetVsActual(causeId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("budget_vs_actual")
    .select("*")
    .eq("cause_id", causeId);
  if (error) throw error;
  return data;
}

export async function createBudgetItem(formData: FormData) {
  const parsed = budgetItemSchema.safeParse({
    cause_id: formData.get("cause_id"),
    category_id: formData.get("category_id"),
    description: formData.get("description"),
    quantity: formData.get("quantity"),
    unit_price: formData.get("unit_price"),
    currency_id: formData.get("currency_id"),
    exchange_rate_to_pkr: formData.get("exchange_rate_to_pkr"),
  });
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors };

  const supabase = await createClient();
  const { error } = await supabase.from("budget_items").insert(parsed.data);
  if (error) return { error: { description: [error.message] } };

  revalidatePath(`/protected/drives/${parsed.data.cause_id}`);
  return { success: true };
}

export async function updateBudgetItem(formData: FormData) {
  const parsed = budgetItemSchema.safeParse({
    id: formData.get("id"),
    cause_id: formData.get("cause_id"),
    category_id: formData.get("category_id"),
    description: formData.get("description"),
    quantity: formData.get("quantity"),
    unit_price: formData.get("unit_price"),
    currency_id: formData.get("currency_id"),
    exchange_rate_to_pkr: formData.get("exchange_rate_to_pkr"),
  });
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors };

  const { id, ...rest } = parsed.data;
  const supabase = await createClient();
  const { error } = await supabase.from("budget_items").update(rest).eq("id", id!);
  if (error) return { error: { description: [error.message] } };

  revalidatePath(`/protected/drives/${parsed.data.cause_id}`);
  return { success: true };
}

export async function deleteBudgetItem(id: string, causeId: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("budget_items")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id);
  if (error) return { error: error.message };

  revalidatePath(`/protected/drives/${causeId}`);
  return { success: true };
}

// ── Templates ──

export async function getDriveTemplates() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("drive_templates")
    .select("*")
    .is("deleted_at", null)
    .order("name");
  if (error) throw error;
  return data;
}

export async function saveDriveTemplate(name: string, templateData: unknown[]) {
  const supabase = await createClient();
  const { error } = await supabase.from("drive_templates").insert({
    name,
    template_data: templateData,
  });
  if (error) return { error: error.message };
  return { success: true };
}

export async function deleteDriveTemplate(id: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("drive_templates")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id);
  if (error) return { error: error.message };
  return { success: true };
}
