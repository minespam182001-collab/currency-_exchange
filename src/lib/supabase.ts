import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Browser-safe client (anon key)
export const supabase = createClient(url, anonKey);

// Server-only client with full DB access — used in API routes and scraper
export function supabaseAdmin() {
  if (!serviceKey) throw new Error("SUPABASE_SERVICE_ROLE_KEY is not set");
  return createClient(url, serviceKey, { auth: { persistSession: false } });
}

// ---- shared types -------------------------------------------------------

export interface Provider {
  id: string;
  name: string;
  logo_url: string | null;
  affiliate_url: string;
  trustpilot_score: number | null;
  trustpilot_reviews: number | null;
  trustpilot_updated_at: string | null;
}

export interface Rate {
  id: string;
  provider_id: string;
  usd_inr_rate: number;
  fee_usd: number;
  scraped_at: string;
  is_stale: boolean;
  is_estimated?: boolean; // injected at API layer, not stored in DB
}

export interface RateWithProvider extends Rate {
  provider: Provider;
}
