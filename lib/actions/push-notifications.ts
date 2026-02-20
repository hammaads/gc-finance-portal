"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function subscribePush(formData: FormData) {
  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  if (!claims?.claims?.sub) return { error: "Not authenticated" };

  const endpoint = formData.get("endpoint") as string;
  const p256dh = formData.get("p256dh") as string;
  const auth = formData.get("auth") as string;

  if (!endpoint || !p256dh || !auth) {
    return { error: "Missing subscription data" };
  }

  const { error } = await supabase.from("push_subscriptions").upsert(
    {
      user_id: claims.claims.sub as string,
      endpoint,
      p256dh,
      auth,
    },
    { onConflict: "endpoint" },
  );

  if (error) {
    console.error("Failed to save push subscription:", error.message);
    return { error: "Failed to save subscription" };
  }

  revalidatePath("/protected/settings");
  return { success: true };
}

export async function unsubscribePush() {
  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  if (!claims?.claims?.sub) return { error: "Not authenticated" };

  const { error } = await supabase
    .from("push_subscriptions")
    .delete()
    .eq("user_id", claims.claims.sub as string);

  if (error) {
    console.error("Failed to delete push subscription:", error.message);
    return { error: "Failed to remove subscription" };
  }

  revalidatePath("/protected/settings");
  return { success: true };
}

export async function getPushSubscriptionStatus() {
  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  if (!claims?.claims?.sub) return false;

  const { count } = await supabase
    .from("push_subscriptions")
    .select("id", { count: "exact", head: true })
    .eq("user_id", claims.claims.sub as string);

  return (count ?? 0) > 0;
}
