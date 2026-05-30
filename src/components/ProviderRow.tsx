"use client";

import { useState } from "react";
import StarRating from "./StarRating";
import { effectiveINR, formatINR, formatUSD, timeAgo } from "@/lib/format";
import type { RateWithProvider } from "@/lib/supabase";

interface Props {
  entry: RateWithProvider;
  sendUSD: number;
  isBest: boolean;
  rank: number;
}

function ProviderLogo({ name, logoUrl }: { name: string; logoUrl: string | null }) {
  const [imgFailed, setImgFailed] = useState(false);

  // Initials badge shown when no logo or image fails to load
  const initials = name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  if (!logoUrl || imgFailed) {
    return (
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 text-xs font-bold flex items-center justify-center shrink-0">
          {initials}
        </div>
        <span className="font-semibold text-slate-700 text-sm leading-tight">{name}</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={logoUrl}
        alt={name}
        className="h-7 w-auto max-w-[72px] object-contain"
        onError={() => setImgFailed(true)}
      />
      <span className="font-semibold text-slate-700 text-sm leading-tight">{name}</span>
    </div>
  );
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

      {/* Rank + logo + name */}
      <div className="flex items-center gap-3 sm:w-48 shrink-0">
        <span className="text-slate-400 text-sm font-semibold w-5 text-center shrink-0">{rank}</span>
        <ProviderLogo name={provider.name} logoUrl={provider.logo_url} />
      </div>

      {/* Rate + fee + INR + trust */}
      <div className="flex-1 grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
        <div>
          <p className="text-slate-400 text-xs mb-0.5">Exchange rate</p>
          <p className="font-semibold text-slate-800">
            1 USD = {usd_inr_rate.toFixed(2)} INR
          </p>
          {is_stale && (
            <span className="text-xs text-amber-500 font-medium">stale</span>
          )}
        </div>

        <div>
          <p className="text-slate-400 text-xs mb-0.5">Transfer fee</p>
          <p className="font-semibold text-slate-800">
            {fee_usd === 0 ? "Variable" : `$${formatUSD(fee_usd)}`}
          </p>
        </div>

        <div>
          <p className="text-slate-400 text-xs mb-0.5">You send ${formatUSD(sendUSD)}</p>
          <p className={`font-bold text-lg ${isBest ? "text-green-700" : "text-slate-800"}`}>
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

      {/* Send now + timestamp */}
      <div className="flex flex-col items-end gap-2 shrink-0">
        <a
          href={provider.affiliate_url}
          target="_blank"
          rel="noopener noreferrer"
          className={`inline-block rounded-lg px-4 py-2 text-sm font-semibold transition-colors
            ${isBest
              ? "bg-green-500 text-white hover:bg-green-600"
              : "bg-blue-600 text-white hover:bg-blue-700"
            }`}
        >
          Send now ↗
        </a>
        <span className="text-xs text-slate-400">{timeAgo(scraped_at)}</span>
      </div>
    </div>
  );
}
