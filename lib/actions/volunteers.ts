"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function getVolunteers() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("volunteers")
    .select("id, name, phone")
    .order("name");
  if (error) throw error;
  return data;
}

export async function createVolunteer(name: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("volunteers")
    .insert({ name: name.trim() })
    .select("id, name")
    .single();
  if (error) return { error: error.message };
  revalidatePath("/protected");
  return { success: true, volunteer: data };
}
