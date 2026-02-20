"use server";

import { createClient } from "@/lib/supabase/server";
import { budgetItemSchema } from "@/lib/schemas/budget";
import { templateSchema } from "@/lib/schemas/templates";
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

export async function getTemplate(id: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("drive_templates")
    .select("*")
    .eq("id", id)
    .is("deleted_at", null)
    .single();
  if (error) throw error;
  return data;
}

export async function createDriveTemplate(formData: FormData) {
  const name = formData.get("name") as string;
  const itemsJson = formData.get("items") as string;

  if (!itemsJson) {
    return { error: { items: ["Add at least one item"] } };
  }

  let items: unknown;
  try {
    items = JSON.parse(itemsJson);
  } catch {
    return { error: { items: ["Invalid items format"] } };
  }

  const parsed = templateSchema.safeParse({ name, items });

  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("drive_templates").insert({
    name: parsed.data.name,
    template_data: { items: parsed.data.items },
  });

  if (error) return { error: { name: [error.message] } };

  revalidatePath("/protected/settings");
  return { success: true };
}

export async function updateDriveTemplate(formData: FormData) {
  const id = formData.get("id") as string;
  const name = formData.get("name") as string;
  const itemsJson = formData.get("items") as string;

  if (!itemsJson) {
    return { error: { items: ["Add at least one item"] } };
  }

  let items: unknown;
  try {
    items = JSON.parse(itemsJson);
  } catch {
    return { error: { items: ["Invalid items format"] } };
  }

  const parsed = templateSchema.safeParse({ id, name, items });

  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("drive_templates")
    .update({
      name: parsed.data.name,
      template_data: { items: parsed.data.items },
    })
    .eq("id", id);

  if (error) return { error: { name: [error.message] } };

  revalidatePath("/protected/settings");
  return { success: true };
}

export async function deleteDriveTemplate(id: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("drive_templates")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id);
  if (error) return { error: error.message };

  revalidatePath("/protected/settings");
  return { success: true };
}

export async function recalculateBudgetItems(causeId: string) {
  const supabase = await createClient();

  const { data: items, error: fetchError } = await supabase
    .from("budget_items")
    .select("*")
    .eq("cause_id", causeId)
    .is("deleted_at", null);

  if (fetchError) return { error: fetchError.message };
  if (!items || items.length === 0) return { success: true };

  // Note: Full recalculation requires template linkage (template_id on causes).
  // budget_items stores quantity/unit_price but not people_per_unit.
  // For MVP, no-op - budget items retain their current quantities.
  return { success: true };
}
