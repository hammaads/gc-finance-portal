"use server";

import { createClient } from "@/lib/supabase/server";
import { bankAccountSchema } from "@/lib/schemas/bank-accounts";
import { revalidatePath } from "next/cache";

export async function getBankAccounts() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("bank_accounts")
    .select("*, currencies(code, symbol, exchange_rate_to_pkr)")
    .is("deleted_at", null)
    .order("account_name");
  if (error) throw error;
  return data;
}

/** Bank balance row shape (matches bank_account_balances view for compatibility). */
export type BankAccountBalanceRow = {
  id: string | null;
  account_name: string | null;
  bank_name: string | null;
  currency_id: string | null;
  currency_code: string | null;
  currency_symbol: string | null;
  opening_balance: number | null;
  total_deposits: number | null;
  total_withdrawals: number | null;
  balance: number | null;
};

/**
 * Computes bank account balances from ledger entries using amount_pkr,
 * ensuring correct multi-currency handling. Replaces the buggy view that
 * summed raw amount instead of amount_pkr.
 */
export async function getBankAccountBalances(): Promise<BankAccountBalanceRow[]> {
  const supabase = await createClient();

  const [accountsResult, ledgerResult] = await Promise.all([
    supabase
      .from("bank_accounts")
      .select(
        "id, account_name, bank_name, currency_id, opening_balance, currencies(code, symbol, exchange_rate_to_pkr)",
      )
      .is("deleted_at", null)
      .order("account_name"),
    supabase
      .from("ledger_entries")
      .select("bank_account_id, type, amount_pkr")
      .not("bank_account_id", "is", null)
      .is("deleted_at", null),
  ]);

  if (accountsResult.error) throw accountsResult.error;
  if (ledgerResult.error) throw ledgerResult.error;

  const accounts = accountsResult.data ?? [];
  const ledgerEntries = ledgerResult.data ?? [];

  const { depositsByAccount, withdrawalsByAccount } = ledgerEntries.reduce(
    (acc, entry) => {
      const id = entry.bank_account_id!;
      const pkr = entry.amount_pkr ?? 0;

      if (entry.type === "donation_bank" || entry.type === "cash_deposit") {
        acc.depositsByAccount.set(id, (acc.depositsByAccount.get(id) ?? 0) + pkr);
      } else if (entry.type === "expense_bank") {
        acc.withdrawalsByAccount.set(
          id,
          (acc.withdrawalsByAccount.get(id) ?? 0) + pkr,
        );
      }
      return acc;
    },
    {
      depositsByAccount: new Map<string, number>(),
      withdrawalsByAccount: new Map<string, number>(),
    },
  );

  type CurrencyRelation =
    | { code: string; symbol: string; exchange_rate_to_pkr: number }
    | { code: string; symbol: string; exchange_rate_to_pkr: number }[]
    | null;

  return accounts.map((account) => {
    const raw = account.currencies as CurrencyRelation;
    const currency = Array.isArray(raw) ? raw[0] ?? null : raw;
    const rate = currency?.exchange_rate_to_pkr ?? 1;
    const rateSafe = rate > 0 ? rate : 1;

    const depositsPkr = depositsByAccount.get(account.id) ?? 0;
    const withdrawalsPkr = withdrawalsByAccount.get(account.id) ?? 0;
    const openingPkr =
      (account.opening_balance ?? 0) * rateSafe;
    const balancePkr = openingPkr + depositsPkr - withdrawalsPkr;

    return {
      id: account.id,
      account_name: account.account_name,
      bank_name: account.bank_name,
      currency_id: account.currency_id,
      currency_code: currency?.code ?? null,
      currency_symbol: currency?.symbol ?? null,
      opening_balance: account.opening_balance,
      total_deposits: depositsPkr / rateSafe,
      total_withdrawals: withdrawalsPkr / rateSafe,
      balance: balancePkr / rateSafe,
    };
  });
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
