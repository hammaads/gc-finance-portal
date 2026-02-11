"use server";

import { createClient } from "@/lib/supabase/server";
import { expenseSchema } from "@/lib/schemas/ledger";
import { revalidatePath } from "next/cache";

export async function getExpenses() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("ledger_entries")
    .select("*, currencies(code, symbol), causes(name), expense_categories(name), bank_accounts(account_name), from_user:profiles!ledger_entries_from_user_id_fkey(display_name)")
    .in("type", ["expense_bank", "expense_cash"])
    .is("deleted_at", null)
    .order("date", { ascending: false })
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}

export async function createExpense(formData: FormData) {
  const type = formData.get("type") as string;

  const raw: Record<string, unknown> = {
    type,
    amount: formData.get("amount"),
    currency_id: formData.get("currency_id"),
    exchange_rate_to_pkr: formData.get("exchange_rate_to_pkr"),
    date: formData.get("date"),
    description: formData.get("description") || null,
    category_id: formData.get("category_id"),
    cause_id: formData.get("cause_id") || null,
  };

  if (type === "expense_bank") {
    raw.bank_account_id = formData.get("bank_account_id");
  } else {
    raw.from_user_id = formData.get("from_user_id");
  }

  const parsed = expenseSchema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors };

  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  if (!claims?.claims?.sub) return { error: { amount: ["Not authenticated"] } };

  const { error } = await supabase.from("ledger_entries").insert({
    ...parsed.data,
    created_by: claims.claims.sub as string,
  });
  if (error) return { error: { amount: [error.message] } };

  revalidatePath("/protected/expenses");
  revalidatePath("/protected");
  return { success: true };
}

export async function deleteExpense(id: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("ledger_entries")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id);
  if (error) return { error: error.message };

  revalidatePath("/protected/expenses");
  revalidatePath("/protected");
  return { success: true };
}
