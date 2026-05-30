import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export const dynamic = "force-dynamic";

// Providers whose scrapers return live data (not estimated)
const LIVE_PROVIDERS = new Set<string>(["Taptap Send", "Wise", "Remitly", "ICICI Money2India"]);

export async function GET() {
  const db = supabaseAdmin();

  // Use a subquery approach: fetch the latest rate_id per provider first,
  // then join back to get full rows. This guarantees we get the truly newest
  // row per provider regardless of how many total rows exist.
  const { data: latest, error: latestErr } = await db
    .from("rates")
    .select("provider_id, id, scraped_at")
    .order("scraped_at", { ascending: false });

  if (latestErr) {
    return NextResponse.json({ error: latestErr.message }, { status: 500 });
  }

  // De-dup in JS on the full unfiltered result
  const seen = new Map<string, string>(); // provider_id -> rate id
  for (const row of (latest ?? [])) {
    if (!seen.has(row.provider_id)) {
      seen.set(row.provider_id, row.id);
    }
  }

  const latestIds = Array.from(seen.values());
  if (latestIds.length === 0) return NextResponse.json([]);

  // Fetch the full rows for only those IDs
  const { data, error } = await db
    .from("rates")
    .select("*, provider:providers(*)")
    .in("id", latestIds);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const result = (data ?? []).map((row) => ({
    ...row,
    is_estimated: !LIVE_PROVIDERS.has(row.provider?.name ?? ""),
  }));

  // Sort by effective rate descending (best deal first)
  result.sort((a, b) => b.usd_inr_rate - a.usd_inr_rate);

  return NextResponse.json(result);
}
