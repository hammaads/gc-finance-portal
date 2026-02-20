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
  const { data: claims } = await supabase.auth.getClaims();
  if (!claims?.claims?.sub) return { error: { name: ["Not authenticated"] } };

  const { data: category, error } = await supabase
    .from("expense_categories")
    .insert({ name: parsed.data.name })
    .select()
    .single();
  if (error) {
    console.error("Failed to create expense category:", error.message);
    return { error: { name: ["Failed to save. Please try again."] } };
  }

  revalidatePath("/protected/settings");
  return { success: true, category };
}

export async function updateExpenseCategory(formData: FormData) {
  const parsed = expenseCategorySchema.safeParse({
    id: formData.get("id"),
    name: formData.get("name"),
  });
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors };

  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  if (!claims?.claims?.sub) return { error: { name: ["Not authenticated"] } };

  const { error } = await supabase
    .from("expense_categories")
    .update({ name: parsed.data.name })
    .eq("id", parsed.data.id!);
  if (error) {
    console.error("Failed to update expense category:", error.message);
    return { error: { name: ["Failed to save. Please try again."] } };
  }

  revalidatePath("/protected/settings");
  return { success: true };
}

export async function deleteExpenseCategory(id: string) {
  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  if (!claims?.claims?.sub) return { error: "Not authenticated" };

  const { error } = await supabase
    .from("expense_categories")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id);
  if (error) {
    console.error("Failed to delete expense category:", error.message);
    return { error: "Failed to delete. Please try again." };
  }

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

/** Base currency (e.g. PKR) for defaulting cash transfer/deposit (GC-UX-001) */
export async function getBaseCurrency() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("currencies")
    .select("id, exchange_rate_to_pkr")
    .is("deleted_at", null)
    .eq("is_base", true)
    .limit(1)
    .single();
  if (error || !data) return null;
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
  const { data: claims } = await supabase.auth.getClaims();
  if (!claims?.claims?.sub) return { error: { code: ["Not authenticated"] } };

  const { error } = await supabase.from("currencies").insert(parsed.data);
  if (error) {
    console.error("Failed to create currency:", error.message);
    return { error: { code: ["Failed to save. Please try again."] } };
  }

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
  const { data: claims } = await supabase.auth.getClaims();
  if (!claims?.claims?.sub) return { error: { code: ["Not authenticated"] } };

  const { error } = await supabase.from("currencies").update(rest).eq("id", id!);
  if (error) {
    console.error("Failed to update currency:", error.message);
    return { error: { code: ["Failed to save. Please try again."] } };
  }

  revalidatePath("/protected/settings");
  return { success: true };
}

export async function deleteCurrency(id: string) {
  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  if (!claims?.claims?.sub) return { error: "Not authenticated" };

  const { error } = await supabase
    .from("currencies")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id);
  if (error) {
    console.error("Failed to delete currency:", error.message);
    return { error: "Failed to delete. Please try again." };
  }

  revalidatePath("/protected/settings");
  return { success: true };
}
