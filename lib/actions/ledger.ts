"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

/**
 * Soft-deletes a ledger entry by setting deleted_at.
 * Use for any ledger entry type (donation, expense, cash transfer, cash deposit).
 * @param revalidateVolunteerId - Optional volunteer id to revalidate that volunteer's transaction page
 */
export async function deleteLedgerEntry(
  id: string,
  revalidateVolunteerId?: string
) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("ledger_entries")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id);
  if (error) return { error: error.message };

  revalidatePath("/protected/donations");
  revalidatePath("/protected/expenses");
  revalidatePath("/protected/cash");
  if (revalidateVolunteerId) {
    revalidatePath(`/protected/cash/${revalidateVolunteerId}`);
  }
  revalidatePath("/protected/bank-accounts");
  revalidatePath("/protected");
  return { success: true };
}
