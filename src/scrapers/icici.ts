import { Browser } from "playwright";
import { ScrapeResult } from "./types";

/**
 * ICICI Money2India scraper.
 *
 * Their rate is server-side rendered directly into the page HTML —
 * no separate API call is made. We read the text:
 *   "Exchange Rate: 1 USD - 94.51 INR"
 * and parse the number from it.
 */
export async function scrapeICICI(browser: Browser): Promise<ScrapeResult> {
  const context = await browser.newContext({
    userAgent:
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    locale: "en-US",
  });
  await context.addInitScript(`
    Object.defineProperty(navigator, 'webdriver', { get: () => false });
    window.chrome = { runtime: {} };
  `);
  const page = await context.newPage();

  try {
    await page.goto("https://www.money2india.com", { waitUntil: "load", timeout: 35000 });
    await page.waitForTimeout(3000);

    const bodyText: string = await page.evaluate(`document.body.innerText`);

    // Match "Exchange Rate: 1 USD - 94.51 INR" or "1 USD = 94.51 INR" etc.
    const patterns = [
      /Exchange Rate[:\s]+1\s*USD\s*[-=]\s*([\d.]+)\s*INR/i,
      /1\s*USD\s*[-=]\s*([\d.]+)\s*INR/i,
      /USD.*?[-=]\s*([\d.]+)\s*INR/i,
    ];

    for (const pattern of patterns) {
      const m = bodyText.match(pattern);
      if (m) {
        const rate = parseFloat(m[1]);
        if (rate > 70 && rate < 120) {
          return { providerName: "ICICI Money2India", usd_inr_rate: rate, fee_usd: 0, success: true };
        }
      }
    }

    throw new Error("Rate pattern not found in ICICI page text");
  } catch (err) {
    return { providerName: "ICICI Money2India", usd_inr_rate: 0, fee_usd: 0, success: false, error: String(err) };
  } finally {
    await context.close();
  }
}
