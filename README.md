# USD → INR Remittance Rate Comparator

Compare live USD→INR exchange rates from the top remittance providers in one place. No more switching between 6 browser tabs.

**Live app:** https://currency-exchange-minespam182001-9284s-projects.vercel.app

---

## What it does

- Shows live exchange rates from 6 providers side by side
- Calculates exactly how many INR your family receives for any USD amount
- Ranks providers by best effective rate (after fees)
- Rates refresh automatically every 5 minutes via GitHub Actions

---

## Providers

| Provider | Rate source | Fee model |
|---|---|---|
| Taptap Send | Live (browser API intercept) | No flat fee |
| Wise | Live (public rates endpoint) | $2.30 flat |
| Remitly | Live (public calculator API) | Free above $1000 |
| ICICI Money2India | Live (DOM scrape) | No flat fee |
| Xoom | Estimated | $4.99 flat |
| Western Union | Estimated | $5.00 flat |

Rows marked **● live** show the real rate from the provider. Rows marked **~ estimated** use the mid-market rate with a typical spread applied — always verify on the provider's site before sending.

---

## Tech stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 14 (App Router, React) |
| Scraping | Playwright (headless Chromium) |
| Database | Supabase (Postgres) |
| Scheduler | GitHub Actions (every 5 min) |
| Deployment | Vercel |

---

## Project structure

```
src/
├── app/
│   ├── page.tsx                  # Main page (server component)
│   ├── layout.tsx
│   └── api/
│       ├── rates/route.ts        # GET latest rate per provider
│       ├── providers/route.ts    # GET provider metadata
│       └── scrape/route.ts       # POST — trigger scrape (local use)
├── components/
│   ├── RateTable.tsx             # Client: calculator + sorted list
│   ├── ProviderRow.tsx           # One provider card
│   ├── AmountInput.tsx           # USD input field
│   └── StarRating.tsx            # Trustpilot stars
├── lib/
│   ├── supabase.ts               # Supabase clients + shared types
│   └── format.ts                 # INR/USD formatting, effectiveINR()
└── scrapers/
    ├── index.ts                  # Orchestrates all scrapers
    ├── http.ts                   # HTTP-only scrapers (Wise, Remitly)
    ├── taptap.ts                 # Browser session intercept
    ├── icici.ts                  # DOM scrape
    ├── westernunion.ts           # Playwright (fallback to estimate)
    ├── xoom.ts                   # Playwright (fallback to estimate)
    ├── fallback.ts               # Mid-market + spread estimates
    ├── trustpilot.ts             # Trustpilot star ratings (daily)
    ├── writeToDb.ts              # GitHub Actions entry point
    └── run.ts                    # Local test script

supabase/
├── schema.sql                    # Run once to create tables + seed providers
└── migrate_add_is_estimated.sql  # Optional: track live vs estimated in DB

.github/workflows/
└── scrape.yml                    # Runs every 5 min on GitHub Actions
```

---

## Database schema

**`providers`** — static metadata, updated daily
```sql
id, name, logo_url, affiliate_url,
trustpilot_score, trustpilot_reviews, trustpilot_updated_at
```

**`rates`** — time-series, written every 5 min
```sql
id, provider_id, usd_inr_rate, fee_usd, scraped_at, is_stale
```

---

## Local development

### 1. Clone and install

```bash
git clone https://github.com/minespam182001-collab/currency-_exchange.git
cd currency-_exchange
npm install
npx playwright install chromium
```

### 2. Configure environment

```bash
cp .env.local.example .env
```

Fill in `.env`:
```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
SCRAPE_SECRET=your-random-secret
```

### 3. Set up the database

Run `supabase/schema.sql` in your Supabase SQL editor. This creates the tables and seeds the 6 providers.

### 4. Run locally

```bash
npm run dev
```

Open http://localhost:3000. The page will show empty rates until you trigger the first scrape.

### 5. Test the scrapers (Phase 1 validation)

```bash
npx ts-node --project tsconfig.scraper.json src/scrapers/run.ts
```

You should see at least 4 providers print a live rate.

### 6. Trigger a scrape manually

```bash
curl -X POST http://localhost:3000/api/scrape \
  -H "Authorization: Bearer YOUR_SCRAPE_SECRET"
```

---

## Deployment

### Vercel

The app is already deployed. To redeploy after changes:

```bash
vercel --prod
```

### GitHub Actions (automated scraping)

The workflow at `.github/workflows/scrape.yml` runs every 5 minutes and writes rates directly to Supabase. It requires two repository secrets:

| Secret | Value |
|---|---|
| `SUPABASE_URL` | Your Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Your Supabase service role key |

Set them at: **GitHub repo → Settings → Secrets and variables → Actions**

---

## How the scrapers work

| Provider | Method |
|---|---|
| **Wise** | `GET wise.com/rates/history+live` — public, no auth |
| **Remitly** | `GET api.remitly.io/v3/calculator/estimate` — public, no auth |
| **Taptap Send** | Playwright loads the page, browser session authenticates, we intercept `GET /api/fxRates` response |
| **ICICI Money2India** | Playwright loads the page, rate is server-rendered in HTML, parsed with regex |
| **Western Union** | Rate only loads after user interaction — uses fallback estimate |
| **Xoom** | Requires PayPal login — uses fallback estimate |

Each scraper follows the chain: **HTTP → Playwright → Estimated fallback**

---

## POC success criteria

- [x] Scraper runs uninterrupted automatically without manual intervention
- [x] At least 3 providers with live data (we have 4)
- [x] Rate accuracy verified against provider apps
- [x] Mobile-responsive comparison table
- [x] Live amount calculator
- [ ] User validation (5 target users, 3 of 5 say they'd use it before next transfer)

---

## Open questions

1. Can Xoom rates be obtained without PayPal login?
2. Can Western Union rates be scraped after selecting destination country?
3. Should the calculator ask for the user's typical send amount instead of defaulting to $500?
4. Do we need a legal disclaimer about not being affiliated with any provider?
