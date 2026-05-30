/**
 * HTTP-only scrapers — hit provider APIs directly without a browser.
 * These are the same endpoints their own web calculators call.
 * No Playwright needed; far less likely to be blocked.
 */

import { ScrapeResult } from "./types";

const BROWSER_UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function fetchJSON(url: string, init?: RequestInit): Promise<any> {
  const res = await fetch(url, {
    ...init,
    headers: {
      "User-Agent": BROWSER_UA,
      Accept: "application/json, text/plain, */*",
      "Accept-Language": "en-US,en;q=0.9",
      ...(init?.headers ?? {}),
    },
    signal: AbortSignal.timeout(15_000),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

// ─── Wise ───────────────────────────────────────────────────────────────────
// Wise publishes their live mid-market rate via a public history endpoint.
// They charge a fee (flat + %) rather than a spread on the rate itself.
export async function httpWise(): Promise<ScrapeResult> {
  try {
    const data = await fetchJSON(
      "https://wise.com/rates/history+live?source=USD&target=INR&length=1&resolution=hourly&unit=day",
      { headers: { Referer: "https://wise.com/" } }
    );
    // Returns array [{source, target, value, time}] — take the last (most recent) entry
    const entries = Array.isArray(data) ? data : [];
    const latest = entries[entries.length - 1];
    const rate = latest?.value;
    if (rate && rate > 50) {
      return { providerName: "Wise", usd_inr_rate: parseFloat(rate), fee_usd: 2.30, success: true };
    }
    throw new Error("No rate value in Wise history+live response");
  } catch (err) {
    return { providerName: "Wise", usd_inr_rate: 0, fee_usd: 0, success: false, error: String(err) };
  }
}

// ─── Remitly ────────────────────────────────────────────────────────────────
// Remitly's calculator uses a public v3 estimate endpoint (no auth needed).
// Shape: { estimate: { exchange_rate: { base_rate: "94.61" }, fee: { total_fee_amount: "0.00" } } }
export async function httpRemitly(): Promise<ScrapeResult> {
  try {
    const data = await fetchJSON(
      "https://api.remitly.io/v3/calculator/estimate?conduit=USA%3AUSD-IND%3AINR&anchor=SEND&amount=1000&purpose=OTHER&customer_segment=STANDARD&customer_recognition=UNRECOGNIZED&strict_promo=false",
      {
        headers: {
          Origin: "https://www.remitly.com",
          Referer: "https://www.remitly.com/",
        },
      }
    );
    const rate = data?.estimate?.exchange_rate?.base_rate;
    const fee = data?.estimate?.fee?.total_fee_amount ?? "0";
    if (rate && parseFloat(rate) > 50) {
      return {
        providerName: "Remitly",
        usd_inr_rate: parseFloat(rate),
        fee_usd: parseFloat(fee),
        success: true,
      };
    }
    throw new Error("No rate in Remitly v3 response");
  } catch (err) {
    return { providerName: "Remitly", usd_inr_rate: 0, fee_usd: 0, success: false, error: String(err) };
  }
}

// ─── Western Union ──────────────────────────────────────────────────────────
// WU exposes a public pricing endpoint used by their send page.
export async function httpWesternUnion(): Promise<ScrapeResult> {
  try {
    const data = await fetchJSON(
      "https://www.westernunion.com/wuconnect/rates/corridors?fromCurrencyCode=USD&toCurrencyCode=INR&fromCountryCode=US&toCountryCode=IN",
      {
        headers: {
          Origin: "https://www.westernunion.com",
          Referer: "https://www.westernunion.com/us/en/send-money/app/start",
        },
      }
    );
    const rate =
      data?.exchangeRate ??
      data?.rate ??
      data?.corridors?.[0]?.exchangeRate ??
      data?.[0]?.exchangeRate;
    if (rate && rate > 50) {
      return { providerName: "Western Union", usd_inr_rate: parseFloat(rate), fee_usd: 0, success: true };
    }
    throw new Error("No rate in WU response");
  } catch (err) {
    return { providerName: "Western Union", usd_inr_rate: 0, fee_usd: 0, success: false, error: String(err) };
  }
}

// ─── Xoom ───────────────────────────────────────────────────────────────────
// Xoom (PayPal) has a public transfer quote endpoint.
export async function httpXoom(): Promise<ScrapeResult> {
  try {
    const data = await fetchJSON(
      "https://www.xoom.com/service/transfer-quote?sendAmount=1000&sendCurrency=USD&receiveCurrency=INR&recipientCountryCode=IN&transferType=BANK_DEPOSIT",
      {
        headers: {
          Origin: "https://www.xoom.com",
          Referer: "https://www.xoom.com/india/sendmoney",
        },
      }
    );
    const rate =
      data?.exchangeRate ??
      data?.exchange_rate ??
      data?.data?.exchangeRate ??
      data?.quote?.exchangeRate;
    const fee = data?.fee ?? data?.transferFee ?? data?.data?.fee ?? 0;
    if (rate && rate > 50) {
      return {
        providerName: "Xoom",
        usd_inr_rate: parseFloat(rate),
        fee_usd: parseFloat(fee),
        success: true,
      };
    }
    throw new Error("No rate in Xoom response");
  } catch (err) {
    return { providerName: "Xoom", usd_inr_rate: 0, fee_usd: 0, success: false, error: String(err) };
  }
}

// ─── ICICI Money2India ───────────────────────────────────────────────────────
export async function httpICICI(): Promise<ScrapeResult> {
  try {
    const data = await fetchJSON(
      "https://www.money2india.com/m2i/remittance/getExchangeRate?fromCurrencyCode=USD&toCurrencyCode=INR",
      {
        headers: {
          Origin: "https://www.money2india.com",
          Referer: "https://www.money2india.com/",
        },
      }
    );
    const rate =
      data?.exchangeRate ??
      data?.rate ??
      data?.data?.exchangeRate ??
      data?.data?.rate;
    if (rate && rate > 50) {
      return { providerName: "ICICI Money2India", usd_inr_rate: parseFloat(rate), fee_usd: 0, success: true };
    }
    throw new Error("No rate in ICICI response");
  } catch (err) {
    return { providerName: "ICICI Money2India", usd_inr_rate: 0, fee_usd: 0, success: false, error: String(err) };
  }
}

// ─── Taptap Send ────────────────────────────────────────────────────────────
export async function httpTaptap(): Promise<ScrapeResult> {
  try {
    const data = await fetchJSON(
      "https://api.taptapsend.com/api/transfer-quotes?sourceCurrency=USD&destinationCurrency=INR&sourceAmount=1000&destinationCountry=IN",
      {
        headers: {
          Origin: "https://www.taptapsend.com",
          Referer: "https://www.taptapsend.com/",
        },
      }
    );
    const rate =
      data?.exchangeRate ??
      data?.rate ??
      data?.data?.exchangeRate ??
      data?.quotes?.[0]?.exchangeRate;
    if (rate && rate > 50) {
      return { providerName: "Taptap Send", usd_inr_rate: parseFloat(rate), fee_usd: 0, success: true };
    }
    throw new Error("No rate in Taptap response");
  } catch (err) {
    return { providerName: "Taptap Send", usd_inr_rate: 0, fee_usd: 0, success: false, error: String(err) };
  }
}
