"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function getReceipts(ledgerEntryId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("expense_receipts")
    .select("*")
    .eq("ledger_entry_id", ledgerEntryId)
    .order("created_at");
  if (error) throw error;

  // Generate signed URLs for each receipt
  const receiptsWithUrls = await Promise.all(
    data.map(async (receipt) => {
      const { data: urlData } = await supabase.storage
        .from("receipts")
        .createSignedUrl(receipt.storage_path, 3600); // 1 hour
      return {
        ...receipt,
        url: urlData?.signedUrl ?? null,
      };
    }),
  );

  return receiptsWithUrls;
}

export async function uploadReceipt(
  ledgerEntryId: string,
  storagePath: string,
  fileName: string,
  fileSize: number,
) {
  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  if (!claims?.claims?.sub) return { error: "Not authenticated" };

  const { error } = await supabase.from("expense_receipts").insert({
    ledger_entry_id: ledgerEntryId,
    storage_path: storagePath,
    file_name: fileName,
    file_size: fileSize,
  });

  if (error) {
    console.error("Failed to upload receipt:", error.message);
    return { error: "Failed to save. Please try again." };
  }
  return { success: true };
}

export async function deleteReceipt(receiptId: string) {
  const supabase = await createClient();

  // Get the receipt to find storage path
  const { data: receipt, error: fetchError } = await supabase
    .from("expense_receipts")
    .select("storage_path")
    .eq("id", receiptId)
    .single();

  if (fetchError || !receipt) return { error: "Receipt not found" };

  // Delete from storage
  const { error: storageError } = await supabase.storage
    .from("receipts")
    .remove([receipt.storage_path]);

  if (storageError) {
    console.error("Failed to delete receipt from storage:", storageError.message);
    return { error: "Failed to delete. Please try again." };
  }

  // Delete record
  const { error } = await supabase
    .from("expense_receipts")
    .delete()
    .eq("id", receiptId);

  if (error) {
    console.error("Failed to delete receipt record:", error.message);
    return { error: "Failed to delete. Please try again." };
  }

  revalidatePath("/protected/expenses");
  return { success: true };
}

export async function getReceiptSetting() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("app_settings")
    .select("value")
    .eq("key", "receipt_required")
    .single();

  if (error) return true; // Default to required
  return data.value === true || data.value === "true";
}

export async function updateReceiptSetting(required: boolean) {
  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  if (!claims?.claims?.sub) return { error: "Not authenticated" };

  const { error } = await supabase
    .from("app_settings")
    .upsert(
      {
        key: "receipt_required",
        value: JSON.stringify(required),
        updated_at: new Date().toISOString(),
      },
      { onConflict: "key" },
    );

  if (error) {
    console.error("Failed to update receipt setting:", error.message);
    return { error: "Failed to save. Please try again." };
  }

  revalidatePath("/protected/settings");
  revalidatePath("/protected/expenses");
  return { success: true };
}
