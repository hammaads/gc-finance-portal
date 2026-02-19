"use server";

import { createClient } from "@/lib/supabase/server";

export async function getEmailImportLogs() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("email_import_logs")
    .select(
      "*, donors(name), bank_accounts(account_name, bank_name), ledger_entries(amount, amount_pkr, date, external_ref)",
    )
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}
