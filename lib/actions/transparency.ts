"use server";

import { createClient } from "@/lib/supabase/server";
import { headers } from "next/headers";

// ── In-memory rate limiter (per server instance) ────────────
const rateLimitMap = new Map<
  string,
  { count: number; windowStart: number }
>();
const RATE_LIMIT_WINDOW_MS = 60_000; // 1 minute
const RATE_LIMIT_MAX = 5;

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);

  if (!entry || now - entry.windowStart > RATE_LIMIT_WINDOW_MS) {
    rateLimitMap.set(ip, { count: 1, windowStart: now });
    return true;
  }

  if (entry.count >= RATE_LIMIT_MAX) return false;
  entry.count++;
  return true;
}

// Periodic cleanup to prevent memory leaks
if (typeof globalThis !== "undefined") {
  const CLEANUP_KEY = "__transparency_rate_limit_cleanup";
  if (!(globalThis as Record<string, unknown>)[CLEANUP_KEY]) {
    (globalThis as Record<string, unknown>)[CLEANUP_KEY] = true;
    setInterval(() => {
      const now = Date.now();
      for (const [ip, entry] of rateLimitMap) {
        if (now - entry.windowStart > RATE_LIMIT_WINDOW_MS * 2) {
          rateLimitMap.delete(ip);
        }
      }
    }, RATE_LIMIT_WINDOW_MS * 5);
  }
}

// ── Public drive summaries (aggregate only) ─────────────────

export async function getDriveSummaries() {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_public_drive_summaries");
  if (error) {
    console.error("Failed to fetch drive summaries:", error.message);
    return [];
  }
  return data ?? [];
}

// ── Donation verification by Raast Tx ID ────────────────────

export async function verifyDonation(txRef: string): Promise<{
  found: boolean;
  date?: string;
  amount?: number;
  currency_symbol?: string;
  cause_name?: string | null;
  error?: string;
}> {
  // Rate limiting by IP
  const headersList = await headers();
  const ip =
    headersList.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";

  if (!checkRateLimit(ip)) {
    return { found: false, error: "Too many attempts. Please try again in a minute." };
  }

  // Input validation (defense in depth — also validated in the DB function)
  const normalized = txRef.trim().toUpperCase().replace(/[\s\-]/g, "");

  if (normalized.length < 10 || normalized.length > 50) {
    return { found: false };
  }

  if (!/^[A-Z0-9]+$/.test(normalized)) {
    return { found: false };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("verify_donation", {
    p_tx_ref: normalized,
  });

  if (error) {
    console.error("Donation verification error:", error.message);
    return { found: false };
  }

  return data ?? { found: false };
}
