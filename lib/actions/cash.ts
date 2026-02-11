"use server";

import { createClient } from "@/lib/supabase/server";
import { cashTransferSchema, cashDepositSchema } from "@/lib/schemas/ledger";
import { revalidatePath } from "next/cache";

export async function getVolunteerCashBalances() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("volunteer_cash_balances")
    .select("*");
  if (error) throw error;
  return data;
}

export async function getProfiles() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .order("display_name");
  if (error) throw error;
  return data;
}

export async function createCashTransfer(formData: FormData) {
  const parsed = cashTransferSchema.safeParse({
    type: "cash_transfer",
    amount: formData.get("amount"),
    currency_id: formData.get("currency_id"),
    exchange_rate_to_pkr: formData.get("exchange_rate_to_pkr"),
    date: formData.get("date"),
    description: formData.get("description") || null,
    from_user_id: formData.get("from_user_id"),
    to_user_id: formData.get("to_user_id"),
  });
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors };

  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  if (!claims?.claims?.sub) return { error: { amount: ["Not authenticated"] } };

  const { error } = await supabase.from("ledger_entries").insert({
    ...parsed.data,
    created_by: claims.claims.sub as string,
  });
  if (error) return { error: { amount: [error.message] } };

  revalidatePath("/protected/cash");
  revalidatePath("/protected");
  return { success: true };
}

export async function createCashDeposit(formData: FormData) {
  const parsed = cashDepositSchema.safeParse({
    type: "cash_deposit",
    amount: formData.get("amount"),
    currency_id: formData.get("currency_id"),
    exchange_rate_to_pkr: formData.get("exchange_rate_to_pkr"),
    date: formData.get("date"),
    description: formData.get("description") || null,
    from_user_id: formData.get("from_user_id"),
    bank_account_id: formData.get("bank_account_id"),
  });
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors };

  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  if (!claims?.claims?.sub) return { error: { amount: ["Not authenticated"] } };

  const { error } = await supabase.from("ledger_entries").insert({
    ...parsed.data,
    created_by: claims.claims.sub as string,
  });
  if (error) return { error: { amount: [error.message] } };

  revalidatePath("/protected/cash");
  revalidatePath("/protected/bank-accounts");
  revalidatePath("/protected");
  return { success: true };
}
