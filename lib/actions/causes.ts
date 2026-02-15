"use server";

import { createClient } from "@/lib/supabase/server";
import { causeSchema } from "@/lib/schemas/causes";
import { revalidatePath } from "next/cache";

export async function getCauses() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("causes")
    .select("*")
    .is("deleted_at", null)
    .order("date", { ascending: false, nullsFirst: false })
    .order("name");
  if (error) throw error;
  return data;
}

export async function getCause(id: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("causes")
    .select("*")
    .eq("id", id)
    .single();
  if (error) throw error;
  return data;
}

export async function getDriveFinancialSummaries() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("drive_financial_summary")
    .select("*");
  if (error) throw error;
  return data;
}

export async function getDriveFinancialSummary(causeId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("drive_financial_summary")
    .select("*")
    .eq("cause_id", causeId)
    .single();
  if (error) throw error;
  return data;
}

export async function createCause(formData: FormData) {
  const parsed = causeSchema.safeParse({
    name: formData.get("name"),
    type: formData.get("type"),
    description: formData.get("description") || null,
    date: formData.get("date") || null,
    location: formData.get("location") || null,
    expected_headcount: formData.get("expected_headcount") || null,
  });
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors };

  const supabase = await createClient();
  const { data: cause, error: causeError } = await supabase
    .from("causes")
    .insert(parsed.data)
    .select()
    .single();

  if (causeError) return { error: { name: [causeError.message] } };

  const budgetItemsJson = formData.get("budget_items");
  if (budgetItemsJson && typeof budgetItemsJson === "string") {
    try {
      const budgetItems = JSON.parse(budgetItemsJson) as Array<{
        category_id: string;
        description: string;
        quantity: number;
        price_per_unit: number;
        currency_id: string;
        exchange_rate_to_pkr: number;
      }>;

      if (Array.isArray(budgetItems) && budgetItems.length > 0 && cause) {
        const itemsToInsert = budgetItems.map((item) => ({
          cause_id: cause.id,
          category_id: item.category_id,
          description: item.description,
          quantity: item.quantity,
          unit_price: item.price_per_unit,
          currency_id: item.currency_id,
          exchange_rate_to_pkr: item.exchange_rate_to_pkr,
          amount_pkr:
            item.quantity * item.price_per_unit * item.exchange_rate_to_pkr,
        }));

        const { error: itemsError } = await supabase
          .from("budget_items")
          .insert(itemsToInsert);

        if (itemsError) {
          console.error("Failed to create budget items:", itemsError);
        }
      }
    } catch (e) {
      console.error("Failed to parse budget items:", e);
    }
  }

  revalidatePath("/protected/drives");
  return { success: true };
}

export async function updateCause(formData: FormData) {
  const parsed = causeSchema.safeParse({
    id: formData.get("id"),
    name: formData.get("name"),
    type: formData.get("type"),
    description: formData.get("description") || null,
    date: formData.get("date") || null,
    location: formData.get("location") || null,
    expected_headcount: formData.get("expected_headcount") || null,
  });
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors };

  const { id, ...rest } = parsed.data;
  const supabase = await createClient();
  const { error } = await supabase.from("causes").update(rest).eq("id", id!);
  if (error) return { error: { name: [error.message] } };

  const budgetItemsJson = formData.get("budget_items");
  if (budgetItemsJson && typeof budgetItemsJson === "string" && id) {
    try {
      const budgetItems = JSON.parse(budgetItemsJson) as Array<{
        category_id: string;
        description: string;
        quantity: number;
        price_per_unit: number;
        currency_id: string;
        exchange_rate_to_pkr: number;
      }>;

      if (Array.isArray(budgetItems)) {
        const { error: softDeleteError } = await supabase
          .from("budget_items")
          .update({ deleted_at: new Date().toISOString() })
          .eq("cause_id", id)
          .is("deleted_at", null);

        if (softDeleteError) {
          console.error("Failed to soft-delete existing budget items:", softDeleteError);
        } else if (budgetItems.length > 0) {
          const itemsToInsert = budgetItems
            .filter((item) => item.category_id && item.description?.trim())
            .map((item) => ({
              cause_id: id,
              category_id: item.category_id,
              description: item.description,
              quantity: item.quantity,
              unit_price: item.price_per_unit,
              currency_id: item.currency_id,
              exchange_rate_to_pkr: item.exchange_rate_to_pkr,
              amount_pkr:
                item.quantity *
                item.price_per_unit *
                item.exchange_rate_to_pkr,
            }));

          if (itemsToInsert.length > 0) {
            const { error: itemsError } = await supabase
              .from("budget_items")
              .insert(itemsToInsert);

            if (itemsError) {
              console.error("Failed to create budget items:", itemsError);
            }
          }
        }
      }
    } catch (e) {
      console.error("Failed to parse budget items:", e);
    }
  }

  revalidatePath("/protected/drives");
  if (id) revalidatePath(`/protected/drives/${id}`);
  return { success: true };
}

export async function deleteCause(id: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("causes")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id);
  if (error) return { error: error.message };

  revalidatePath("/protected/drives");
  return { success: true };
}
