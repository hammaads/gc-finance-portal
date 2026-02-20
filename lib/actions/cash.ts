"use server";

import { createClient } from "@/lib/supabase/server";
import { cashTransferSchema, cashDepositSchema, bankWithdrawalSchema } from "@/lib/schemas/ledger";
import { getBaseCurrency } from "@/lib/actions/settings";
import { revalidatePath } from "next/cache";

export async function getVolunteerCashBalances() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("volunteer_cash_balances")
    .select("*");
  if (error) throw error;
  return data;
}

export async function createCashTransfer(formData: FormData) {
  const parsed = cashTransferSchema.safeParse({
    type: "cash_transfer",
    amount: formData.get("amount"),
    currency_id: formData.get("currency_id") || undefined,
    exchange_rate_to_pkr: formData.get("exchange_rate_to_pkr") || undefined,
    date: formData.get("date"),
    description: formData.get("description") || null,
    from_user_id: formData.get("from_user_id"),
    to_user_id: formData.get("to_user_id"),
  });
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors };

  let currency_id = parsed.data.currency_id;
  let exchange_rate_to_pkr = parsed.data.exchange_rate_to_pkr;
  if (currency_id == null || exchange_rate_to_pkr == null) {
    const base = await getBaseCurrency();
    if (!base) return { error: { amount: ["No base currency configured. Add a base currency in Settings."] } };
    currency_id = base.id;
    exchange_rate_to_pkr = base.exchange_rate_to_pkr;
  }

  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  if (!claims?.claims?.sub) return { error: { amount: ["Not authenticated"] } };

  const { error } = await supabase.from("ledger_entries").insert({
    type: "cash_transfer",
    amount: parsed.data.amount,
    currency_id,
    exchange_rate_to_pkr,
    date: parsed.data.date,
    description: parsed.data.description ?? null,
    from_user_id: parsed.data.from_user_id,
    to_user_id: parsed.data.to_user_id,
    created_by: claims.claims.sub as string,
  });
  if (error) {
    console.error("Failed to create cash transfer:", error.message);
    return { error: { amount: ["Failed to save. Please try again."] } };
  }

  revalidatePath("/protected/cash");
  revalidatePath("/protected");
  return { success: true };
}

export async function createCashDeposit(formData: FormData) {
  const parsed = cashDepositSchema.safeParse({
    type: "cash_deposit",
    amount: formData.get("amount"),
    currency_id: formData.get("currency_id") || undefined,
    exchange_rate_to_pkr: formData.get("exchange_rate_to_pkr") || undefined,
    date: formData.get("date"),
    description: formData.get("description") || null,
    from_user_id: formData.get("from_user_id"),
    bank_account_id: formData.get("bank_account_id"),
  });
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors };

  let currency_id = parsed.data.currency_id;
  let exchange_rate_to_pkr = parsed.data.exchange_rate_to_pkr;
  if (currency_id == null || exchange_rate_to_pkr == null) {
    const base = await getBaseCurrency();
    if (!base) return { error: { amount: ["No base currency configured. Add a base currency in Settings."] } };
    currency_id = base.id;
    exchange_rate_to_pkr = base.exchange_rate_to_pkr;
  }

  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  if (!claims?.claims?.sub) return { error: { amount: ["Not authenticated"] } };

  const { error } = await supabase.from("ledger_entries").insert({
    type: "cash_deposit",
    amount: parsed.data.amount,
    currency_id,
    exchange_rate_to_pkr,
    date: parsed.data.date,
    description: parsed.data.description ?? null,
    from_user_id: parsed.data.from_user_id,
    bank_account_id: parsed.data.bank_account_id,
    created_by: claims.claims.sub as string,
  });
  if (error) {
    console.error("Failed to create cash deposit:", error.message);
    return { error: { amount: ["Failed to save. Please try again."] } };
  }

  revalidatePath("/protected/cash");
  revalidatePath("/protected/bank-accounts");
  revalidatePath("/protected");
  return { success: true };
}

/** Bank → Volunteer transfer (GC-CASH-001). Uses base currency when currency not provided. */
export async function createBankWithdrawal(formData: FormData) {
  const parsed = bankWithdrawalSchema.safeParse({
    type: "bank_withdrawal",
    amount: formData.get("amount"),
    currency_id: formData.get("currency_id") || undefined,
    exchange_rate_to_pkr: formData.get("exchange_rate_to_pkr") || undefined,
    date: formData.get("date"),
    description: formData.get("description") || null,
    bank_account_id: formData.get("bank_account_id"),
    to_user_id: formData.get("to_user_id"),
  });
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors };

  let currency_id = parsed.data.currency_id;
  let exchange_rate_to_pkr = parsed.data.exchange_rate_to_pkr;
  if (currency_id == null || exchange_rate_to_pkr == null) {
    const base = await getBaseCurrency();
    if (!base) return { error: { amount: ["No base currency configured. Add a base currency in Settings."] } };
    currency_id = base.id;
    exchange_rate_to_pkr = base.exchange_rate_to_pkr;
  }

  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  if (!claims?.claims?.sub) return { error: { amount: ["Not authenticated"] } };

  const { error } = await supabase.from("ledger_entries").insert({
    type: "bank_withdrawal",
    amount: parsed.data.amount,
    currency_id,
    exchange_rate_to_pkr,
    date: parsed.data.date,
    description: parsed.data.description ?? null,
    bank_account_id: parsed.data.bank_account_id,
    to_user_id: parsed.data.to_user_id,
    created_by: claims.claims.sub as string,
  });
  if (error) {
    console.error("Failed to create bank withdrawal:", error.message);
    return { error: { amount: ["Failed to save. Please try again."] } };
  }

  revalidatePath("/protected/cash");
  revalidatePath("/protected/bank-accounts");
  revalidatePath("/protected");
  return { success: true };
}

export async function getVolunteerTransactions(volunteerId: string, includeVoided = false) {
  const supabase = await createClient();
  const { data: profile, error: profileError } = await supabase
    .from("volunteers")
    .select("id, name")
    .eq("id", volunteerId)
    .single();
  if (profileError || !profile) return null;

  let q = supabase
    .from("ledger_entries")
    .select(
      "*, currencies(code, symbol), donors(name), causes(name), expense_categories(name), bank_accounts(account_name), from_user:volunteers!ledger_entries_from_user_id_fkey(name), to_user:volunteers!ledger_entries_to_user_id_fkey(name)"
    )
    .or(`from_user_id.eq.${volunteerId},to_user_id.eq.${volunteerId}`)
    .in("type", [
      "donation_cash",
      "expense_cash",
      "cash_transfer",
      "cash_deposit",
      "bank_withdrawal",
    ])
    .order("date", { ascending: false })
    .order("created_at", { ascending: false });
  if (!includeVoided) q = q.is("deleted_at", null);
  const { data: entries, error } = await q;

  if (error) throw error;

  return {
    volunteer: profile,
    transactions: entries ?? [],
  };
}
