/**
 * Fallback scraper — used when Playwright scraping is blocked.
 *
 * Fetches the mid-market USD/INR rate from a free public API (no key needed),
 * then applies each provider's typical spread and fee structure.
 *
 * Spreads are based on publicly observed rates from 2024-2025 comparisons.
 * These are estimates — accurate scraping remains the goal for Phase 2.
 */

import { ScrapeResult } from "./types";

const PROVIDER_CONFIG: Record<
  string,
  { spread: number; fee: number }
> = {
  Remitly:             { spread: 0.007, fee: 0.00 },   // ~0.7% margin, no flat fee
  Wise:                { spread: 0.000, fee: 2.30 },   // mid-market rate, flat+% fee
  "Western Union":     { spread: 0.018, fee: 5.00 },   // ~1.8% margin + $5 flat
  Xoom:                { spread: 0.013, fee: 4.99 },   // ~1.3% margin + $4.99 flat
  "ICICI Money2India": { spread: 0.006, fee: 0.00 },   // ~0.6% margin
  "Taptap Send":       { spread: 0.001, fee: 0.00 },   // ~0.1% margin, near mid-market
};

let cachedRate: number | null = null;
let cacheTime = 0;

async function getMidMarketRate(): Promise<number> {
  // Cache for 10 minutes to avoid hammering the free API
  if (cachedRate && Date.now() - cacheTime < 10 * 60 * 1000) return cachedRate;

  // open.er-api.com — completely free, no key
  const res = await fetch("https://open.er-api.com/v6/latest/USD", {
    headers: { "User-Agent": "remittance-poc/0.1" },
  });
  if (!res.ok) throw new Error(`ExchangeRate API returned ${res.status}`);
  const data = await res.json();
  const rate: number = data?.rates?.INR;
  if (!rate) throw new Error("INR rate missing from ExchangeRate API response");

  cachedRate = rate;
  cacheTime = Date.now();
  return rate;
}

export async function getFallbackRate(providerName: string): Promise<ScrapeResult> {
  try {
    const midMarket = await getMidMarketRate();
    const config = PROVIDER_CONFIG[providerName] ?? { spread: 0.01, fee: 0 };
    const providerRate = midMarket * (1 - config.spread);

    return {
      providerName,
      usd_inr_rate: parseFloat(providerRate.toFixed(4)),
      fee_usd: config.fee,
      success: true,
      is_estimated: true,
    };
  } catch (err) {
    return {
      providerName,
      usd_inr_rate: 0,
      fee_usd: 0,
      success: false,
      error: `Fallback also failed: ${err}`,
    };
  }
}
