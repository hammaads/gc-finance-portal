"use server";

import { createClient } from "@/lib/supabase/server";
import { recordAuditEvent } from "@/lib/actions/audit";
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
    number_of_daigs: formData.get("number_of_daigs") || null,
    expected_attendees: formData.get("expected_attendees") || null,
    actual_attendees: formData.get("actual_attendees") || null,
    expected_headcount: formData.get("expected_headcount") || null,
  });
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors };

  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  if (!claims?.claims?.sub) return { error: { name: ["Not authenticated"] } };

  const payload = {
    ...parsed.data,
    expected_headcount:
      parsed.data.expected_headcount ??
      parsed.data.expected_attendees ??
      null,
  };

  const { data: cause, error: causeError } = await supabase
    .from("causes")
    .insert(payload)
    .select()
    .single();

  if (causeError) {
    console.error("Failed to create cause:", causeError.message);
    return { error: { name: ["Failed to save. Please try again."] } };
  }

  await recordAuditEvent({
    actorId: claims.claims.sub as string,
    tableName: "causes",
    recordId: cause.id,
    action: "create",
    newData: cause,
    metadata: { module: "causes" },
  });

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
    number_of_daigs: formData.get("number_of_daigs") || null,
    expected_attendees: formData.get("expected_attendees") || null,
    actual_attendees: formData.get("actual_attendees") || null,
    expected_headcount: formData.get("expected_headcount") || null,
  });
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors };

  const { id, ...rest } = parsed.data;
  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  if (!claims?.claims?.sub) return { error: { name: ["Not authenticated"] } };

  const updatePayload = {
    ...rest,
    expected_headcount:
      rest.expected_headcount ?? rest.expected_attendees ?? null,
  };

  const { error } = await supabase
    .from("causes")
    .update(updatePayload)
    .eq("id", id!);
  if (error) {
    console.error("Failed to update cause:", error.message);
    return { error: { name: ["Failed to save. Please try again."] } };
  }

  await recordAuditEvent({
    actorId: claims.claims.sub as string,
    tableName: "causes",
    recordId: id ?? null,
    action: "update",
    newData: updatePayload,
    metadata: { module: "causes" },
  });

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
  const { data: claims } = await supabase.auth.getClaims();
  if (!claims?.claims?.sub) return { error: "Not authenticated" };

  const timestamp = new Date().toISOString();
  const { error } = await supabase
    .from("causes")
    .update({
      deleted_at: timestamp,
      voided_at: timestamp,
      voided_by: claims.claims.sub as string,
      void_reason: "Voided from drives screen",
    })
    .eq("id", id);
  if (error) {
    console.error("Failed to delete cause:", error.message);
    return { error: "Failed to delete. Please try again." };
  }

  await recordAuditEvent({
    actorId: claims.claims.sub as string,
    tableName: "causes",
    recordId: id,
    action: "void",
    reason: "Voided from drives screen",
    metadata: { module: "causes" },
  });

  revalidatePath("/protected/drives");
  return { success: true };
}
