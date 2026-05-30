import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

/**
 * POST /api/scrape
 *
 * Called by Vercel Cron (or GitHub Actions) every 15 minutes.
 * Protected by a shared secret in the Authorization header.
 *
 * The Playwright import is dynamic so that this module can be bundled
 * by Next.js without pulling Playwright into the client bundle. In
 * production you will need a custom Vercel function with the Playwright
 * layer, or run the scraper in a separate GitHub Actions job that POSTs
 * the results back here.
 */
export async function POST(req: NextRequest) {
  // Auth check
  const auth = req.headers.get("authorization") ?? "";
  const secret = process.env.SCRAPE_SECRET;
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = supabaseAdmin();

  try {
    // Dynamic import keeps Playwright out of the default Next.js bundle
    const { scrapeAllRates } = await import("@/scrapers/index");
    const results = await scrapeAllRates();

    const successes = results.filter((r) => r.success);
    const failures = results.filter((r) => !r.success);

    // Fetch provider id map
    const { data: providers } = await db.from("providers").select("id, name");
    const providerMap = Object.fromEntries(
      (providers ?? []).map((p) => [p.name, p.id])
    );

    // Upsert successful rates
    for (const r of successes) {
      const providerId = providerMap[r.providerName];
      if (!providerId) continue;

      await db.from("rates").insert({
        provider_id: providerId,
        usd_inr_rate: r.usd_inr_rate,
        fee_usd: r.fee_usd,
        scraped_at: new Date().toISOString(),
        is_stale: false,
      });
    }

    // Mark stale for failures that have a previous rate
    for (const r of failures) {
      const providerId = providerMap[r.providerName];
      if (!providerId) continue;

      // Mark the most recent existing row as stale
      const { data: last } = await db
        .from("rates")
        .select("id")
        .eq("provider_id", providerId)
        .order("scraped_at", { ascending: false })
        .limit(1);

      if (last?.[0]) {
        await db.from("rates").update({ is_stale: true }).eq("id", last[0].id);
      }
    }

    return NextResponse.json({
      scraped: successes.length,
      failed: failures.map((f) => ({ provider: f.providerName, error: f.error })),
    });
  } catch (err) {
    console.error("[scrape] unexpected error:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

/**
 * GET /api/scrape — used by Vercel Cron (cron jobs call GET by default
 * when the route is listed in vercel.json under "crons").
 * We delegate to the POST handler after verifying the cron secret that
 * Vercel injects via the `authorization` header automatically.
 */
export async function GET(req: NextRequest) {
  return POST(req);
}
