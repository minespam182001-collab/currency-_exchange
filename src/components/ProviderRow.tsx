import StarRating from "./StarRating";
import ProviderLogo from "./ProviderLogo";
import { effectiveINR, formatINR, formatUSD, timeAgo } from "@/lib/format";
import type { RateWithProvider } from "@/lib/supabase";

interface Props {
  entry: RateWithProvider;
  sendUSD: number;
  isBest: boolean;
  rank: number;
}

export default function ProviderRow({ entry, sendUSD, isBest, rank }: Props) {
  const { provider, usd_inr_rate, fee_usd, scraped_at, is_stale } = entry;
  const inrReceived = effectiveINR(sendUSD, usd_inr_rate, fee_usd);

  return (
    <div
      className={`relative flex flex-col sm:flex-row sm:items-center gap-4 rounded-2xl border p-4 sm:p-5 transition-shadow
        ${isBest
          ? "border-green-400 bg-green-50 shadow-md shadow-green-100"
          : "border-slate-200 bg-white hover:shadow-sm"
        }`}
    >
      {/* Best badge */}
      {isBest && (
        <span className="absolute -top-3 left-4 bg-green-500 text-white text-xs font-bold px-2.5 py-0.5 rounded-full">
          Best Rate
        </span>
      )}

      {/* Rank + avatar + name */}
      <div className="flex items-center gap-3 sm:w-52 shrink-0">
        <span className="text-slate-400 text-sm font-semibold w-4 text-center shrink-0">{rank}</span>
        <ProviderLogo name={provider.name} logoUrl={provider.logo_url} />
        <div className="min-w-0">
          <p className="font-semibold text-slate-800 text-sm leading-tight truncate">{provider.name}</p>
          {is_stale ? (
            <p className="text-xs text-amber-500 font-medium">stale data</p>
          ) : entry.is_estimated ? (
            <p className="text-xs text-slate-400 font-medium">~ estimated</p>
          ) : (
            <p className="text-xs text-green-600 font-medium">● live</p>
          )}
        </div>
      </div>

      {/* Data grid */}
      <div className="flex-1 grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
        <div>
          <p className="text-slate-400 text-xs mb-0.5">Exchange rate</p>
          <p className="font-semibold text-slate-800">
            {entry.is_estimated ? "~" : ""}{usd_inr_rate.toFixed(2)}{" "}
            <span className="text-slate-400 font-normal text-xs">INR</span>
          </p>
        </div>

        <div>
          <p className="text-slate-400 text-xs mb-0.5">Transfer fee</p>
          <p className="font-semibold text-slate-800">
            {fee_usd === 0 ? (
              <span className="text-green-600">Free</span>
            ) : (
              `$${formatUSD(fee_usd)}`
            )}
          </p>
        </div>

        <div>
          <p className="text-slate-400 text-xs mb-0.5">You receive</p>
          <p className={`font-bold text-base ${isBest ? "text-green-700" : "text-slate-800"}`}>
            ₹{formatINR(inrReceived)}
          </p>
        </div>

        <div>
          <p className="text-slate-400 text-xs mb-0.5">Trust score</p>
          <StarRating
            score={provider.trustpilot_score}
            reviews={provider.trustpilot_reviews}
          />
        </div>
      </div>

      {/* CTA */}
      <div className="flex flex-col items-end gap-1.5 shrink-0">
        <a
          href={provider.affiliate_url}
          target="_blank"
          rel="noopener noreferrer"
          className={`inline-block rounded-lg px-4 py-2 text-sm font-semibold transition-colors whitespace-nowrap
            ${isBest
              ? "bg-green-500 text-white hover:bg-green-600"
              : "bg-slate-800 text-white hover:bg-slate-700"
            }`}
        >
          Send now ↗
        </a>
        <span className="text-xs text-slate-400">{timeAgo(scraped_at)}</span>
      </div>
    </div>
  );
}
