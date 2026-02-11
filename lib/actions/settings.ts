"use server";

import { createClient } from "@/lib/supabase/server";
import { expenseCategorySchema, currencySchema } from "@/lib/schemas/settings";
import { revalidatePath } from "next/cache";

// ── Expense Categories ──

export async function getExpenseCategories() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("expense_categories")
    .select("*")
    .is("deleted_at", null)
    .order("name");
  if (error) throw error;
  return data;
}

export async function createExpenseCategory(formData: FormData) {
  const parsed = expenseCategorySchema.safeParse({
    name: formData.get("name"),
  });
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors };

  const supabase = await createClient();
  const { error } = await supabase.from("expense_categories").insert({ name: parsed.data.name });
  if (error) return { error: { name: [error.message] } };

  revalidatePath("/protected/settings");
  return { success: true };
}

export async function updateExpenseCategory(formData: FormData) {
  const parsed = expenseCategorySchema.safeParse({
    id: formData.get("id"),
    name: formData.get("name"),
  });
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors };

  const supabase = await createClient();
  const { error } = await supabase
    .from("expense_categories")
    .update({ name: parsed.data.name })
    .eq("id", parsed.data.id!);
  if (error) return { error: { name: [error.message] } };

  revalidatePath("/protected/settings");
  return { success: true };
}

export async function deleteExpenseCategory(id: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("expense_categories")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id);
  if (error) return { error: error.message };

  revalidatePath("/protected/settings");
  return { success: true };
}

// ── Currencies ──

export async function getCurrencies() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("currencies")
    .select("*")
    .is("deleted_at", null)
    .order("is_base", { ascending: false })
    .order("code");
  if (error) throw error;
  return data;
}

export async function createCurrency(formData: FormData) {
  const parsed = currencySchema.safeParse({
    code: formData.get("code"),
    name: formData.get("name"),
    symbol: formData.get("symbol"),
    exchange_rate_to_pkr: formData.get("exchange_rate_to_pkr"),
    is_base: formData.get("is_base") === "true",
  });
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors };

  const supabase = await createClient();
  const { error } = await supabase.from("currencies").insert(parsed.data);
  if (error) return { error: { code: [error.message] } };

  revalidatePath("/protected/settings");
  return { success: true };
}

export async function updateCurrency(formData: FormData) {
  const parsed = currencySchema.safeParse({
    id: formData.get("id"),
    code: formData.get("code"),
    name: formData.get("name"),
    symbol: formData.get("symbol"),
    exchange_rate_to_pkr: formData.get("exchange_rate_to_pkr"),
    is_base: formData.get("is_base") === "true",
  });
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors };

  const { id, ...rest } = parsed.data;
  const supabase = await createClient();
  const { error } = await supabase.from("currencies").update(rest).eq("id", id!);
  if (error) return { error: { code: [error.message] } };

  revalidatePath("/protected/settings");
  return { success: true };
}

export async function deleteCurrency(id: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("currencies")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id);
  if (error) return { error: error.message };

  revalidatePath("/protected/settings");
  return { success: true };
}
