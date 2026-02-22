"use server";

import { recordAuditEvent } from "@/lib/actions/audit";
import { createClient } from "@/lib/supabase/server";
import {
  cashDepositSchema,
  cashTransferSchema,
  cashWithdrawalSchema,
} from "@/lib/schemas/ledger";
import { revalidatePath } from "next/cache";

async function getBaseCurrency() {
  const supabase = await createClient();
  const { data: currency, error } = await supabase
    .from("currencies")
    .select("id, exchange_rate_to_pkr")
    .eq("is_base", true)
    .single();
  if (error || !currency) {
    return null;
  }
  return currency;
}

export async function getVolunteerCashBalances() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("volunteer_cash_balances")
    .select("*");
  if (error) throw error;
  return data;
}

export async function createCashTransfer(formData: FormData) {
  const baseCurrency = await getBaseCurrency();
  if (!baseCurrency) {
    return { error: { amount: ["Base currency is not configured"] } };
  }

  const parsed = cashTransferSchema.safeParse({
    type: "cash_transfer",
    amount: formData.get("amount"),
    currency_id: baseCurrency.id,
    exchange_rate_to_pkr: baseCurrency.exchange_rate_to_pkr,
    date: formData.get("date"),
    description: formData.get("description") || null,
    from_user_id: formData.get("from_user_id"),
    to_user_id: formData.get("to_user_id"),
  });
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors };

  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  const actorId = claims?.claims?.sub ?? null;
  if (!actorId) return { error: { amount: ["Not authenticated"] } };

  const { data: inserted, error } = await supabase
    .from("ledger_entries")
    .insert({
      ...parsed.data,
      created_by: actorId,
    })
    .select("id")
    .single();
  if (error) {
    console.error("Failed to create cash transfer:", error.message);
    return { error: { amount: ["Failed to save. Please try again."] } };
  }

  await recordAuditEvent({
    actorId,
    tableName: "ledger_entries",
    recordId: inserted.id,
    action: "create",
    metadata: { module: "cash_transfer" },
  });

  revalidatePath("/protected/cash");
  revalidatePath("/protected");
  return { success: true };
}

export async function createCashDeposit(formData: FormData) {
  const bankAccountId = formData.get("bank_account_id") as string;
  if (!bankAccountId) {
    return { error: { bank_account_id: ["Select a bank account"] } };
  }

  const supabase = await createClient();
  const { data: bank, error: bankError } = await supabase
    .from("bank_accounts")
    .select("currency_id, currencies(exchange_rate_to_pkr)")
    .eq("id", bankAccountId)
    .single();

  if (bankError || !bank?.currency_id) {
    return { error: { bank_account_id: ["Bank account not found"] } };
  }

  const currencyRelation = bank.currencies as
    | { exchange_rate_to_pkr: number }
    | { exchange_rate_to_pkr: number }[]
    | null;
  const exchangeRate = Array.isArray(currencyRelation)
    ? (currencyRelation[0]?.exchange_rate_to_pkr ?? 1)
    : (currencyRelation?.exchange_rate_to_pkr ?? 1);

  const parsed = cashDepositSchema.safeParse({
    type: "cash_deposit",
    amount: formData.get("amount"),
    currency_id: bank.currency_id,
    exchange_rate_to_pkr: exchangeRate,
    date: formData.get("date"),
    description: formData.get("description") || null,
    from_user_id: formData.get("from_user_id"),
    bank_account_id: bankAccountId,
  });
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors };

  const { data: claims } = await supabase.auth.getClaims();
  const actorId = claims?.claims?.sub ?? null;
  if (!actorId) return { error: { amount: ["Not authenticated"] } };

  const { data: inserted, error } = await supabase
    .from("ledger_entries")
    .insert({
      ...parsed.data,
      created_by: actorId,
    })
    .select("id")
    .single();
  if (error) {
    console.error("Failed to create cash deposit:", error.message);
    return { error: { amount: ["Failed to save. Please try again."] } };
  }

  await recordAuditEvent({
    actorId,
    tableName: "ledger_entries",
    recordId: inserted.id,
    action: "create",
    metadata: { module: "cash_deposit" },
  });

  revalidatePath("/protected/cash");
  revalidatePath("/protected/bank-accounts");
  revalidatePath("/protected");
  return { success: true };
}

export async function createCashWithdrawal(formData: FormData) {
  const bankAccountId = formData.get("bank_account_id") as string;
  if (!bankAccountId) {
    return { error: { bank_account_id: ["Select a bank account"] } };
  }

  const supabase = await createClient();
  const { data: bank, error: bankError } = await supabase
    .from("bank_accounts")
    .select("currency_id, currencies(exchange_rate_to_pkr)")
    .eq("id", bankAccountId)
    .single();

  if (bankError || !bank?.currency_id) {
    return { error: { bank_account_id: ["Bank account not found"] } };
  }

  const currencyRelation = bank.currencies as
    | { exchange_rate_to_pkr: number }
    | { exchange_rate_to_pkr: number }[]
    | null;
  const exchangeRate = Array.isArray(currencyRelation)
    ? (currencyRelation[0]?.exchange_rate_to_pkr ?? 1)
    : (currencyRelation?.exchange_rate_to_pkr ?? 1);

  const parsed = cashWithdrawalSchema.safeParse({
    type: "cash_withdrawal",
    amount: formData.get("amount"),
    currency_id: bank.currency_id,
    exchange_rate_to_pkr: exchangeRate,
    date: formData.get("date"),
    description: formData.get("description") || null,
    bank_account_id: bankAccountId,
    to_user_id: formData.get("to_user_id"),
  });
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors };

  const { data: claims } = await supabase.auth.getClaims();
  const actorId = claims?.claims?.sub ?? null;
  if (!actorId) return { error: { amount: ["Not authenticated"] } };

  const { data: inserted, error } = await supabase
    .from("ledger_entries")
    .insert({
      ...parsed.data,
      created_by: actorId,
    })
    .select("id")
    .single();
  if (error) {
    console.error("Failed to create cash withdrawal:", error.message);
    return { error: { amount: ["Failed to save. Please try again."] } };
  }

  await recordAuditEvent({
    actorId,
    tableName: "ledger_entries",
    recordId: inserted.id,
    action: "create",
    metadata: { module: "cash_withdrawal" },
  });

  revalidatePath("/protected/cash");
  revalidatePath("/protected/bank-accounts");
  revalidatePath("/protected");
  return { success: true };
}

export async function getVolunteerTransactions(volunteerId: string) {
  const supabase = await createClient();
  const { data: profile, error: profileError } = await supabase
    .from("volunteers")
    .select("id, name")
    .eq("id", volunteerId)
    .single();
  if (profileError || !profile) return null;

  const { data: entries, error } = await supabase
    .from("ledger_entries")
    .select(
      "*, currencies(code, symbol), donors(name), causes(name), expense_categories(name), bank_accounts(account_name), from_user:volunteers!ledger_entries_from_user_id_fkey(name), to_user:volunteers!ledger_entries_to_user_id_fkey(name)",
    )
    .or(`from_user_id.eq.${volunteerId},to_user_id.eq.${volunteerId}`)
    .in("type", [
      "donation_cash",
      "expense_cash",
      "cash_transfer",
      "cash_deposit",
      "cash_withdrawal",
    ])
    .is("deleted_at", null)
    .order("date", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) throw error;

  return {
    volunteer: profile,
    transactions: entries ?? [],
  };
}
