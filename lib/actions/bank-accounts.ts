"use server";

import { createClient } from "@/lib/supabase/server";
import { bankAccountSchema } from "@/lib/schemas/bank-accounts";
import { revalidatePath } from "next/cache";

export async function getBankAccounts() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("bank_accounts")
    .select("*, currencies(code, symbol)")
    .is("deleted_at", null)
    .order("account_name");
  if (error) throw error;
  return data;
}

export async function getBankAccountBalances() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("bank_account_balances")
    .select("*");
  if (error) throw error;
  return data;
}

export async function getBankAccountStatement(accountId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("ledger_entries")
    .select("*, currencies(code, symbol), donors(name), causes(name), expense_categories(name), from_user:profiles!ledger_entries_from_user_id_fkey(display_name), to_user:profiles!ledger_entries_to_user_id_fkey(display_name)")
    .eq("bank_account_id", accountId)
    .is("deleted_at", null)
    .order("date", { ascending: false })
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}

export async function createBankAccount(formData: FormData) {
  const parsed = bankAccountSchema.safeParse({
    account_name: formData.get("account_name"),
    bank_name: formData.get("bank_name"),
    account_number: formData.get("account_number") || null,
    currency_id: formData.get("currency_id"),
    opening_balance: formData.get("opening_balance"),
  });
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors };

  const supabase = await createClient();
  const { error } = await supabase.from("bank_accounts").insert(parsed.data);
  if (error) return { error: { account_name: [error.message] } };

  revalidatePath("/protected/bank-accounts");
  return { success: true };
}

export async function updateBankAccount(formData: FormData) {
  const parsed = bankAccountSchema.safeParse({
    id: formData.get("id"),
    account_name: formData.get("account_name"),
    bank_name: formData.get("bank_name"),
    account_number: formData.get("account_number") || null,
    currency_id: formData.get("currency_id"),
    opening_balance: formData.get("opening_balance"),
  });
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors };

  const { id, ...rest } = parsed.data;
  const supabase = await createClient();
  const { error } = await supabase.from("bank_accounts").update(rest).eq("id", id!);
  if (error) return { error: { account_name: [error.message] } };

  revalidatePath("/protected/bank-accounts");
  return { success: true };
}

export async function deleteBankAccount(id: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("bank_accounts")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id);
  if (error) return { error: error.message };

  revalidatePath("/protected/bank-accounts");
  return { success: true };
}
