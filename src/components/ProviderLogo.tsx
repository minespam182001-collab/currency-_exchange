"use client";

import { useState } from "react";
import { getProviderLogo } from "@/lib/providerLogos";

const BRAND: Record<string, { bg: string; text: string; abbr: string }> = {
  Remitly: { bg: "#333B9E", text: "#fff", abbr: "Re" },
  Wise: { bg: "#163300", text: "#9FE870", abbr: "Wi" },
  "Western Union": { bg: "#FFBB00", text: "#1a1a1a", abbr: "WU" },
  Xoom: { bg: "#003087", text: "#fff", abbr: "Xo" },
  "ICICI Money2India": { bg: "#F37B20", text: "#fff", abbr: "IM" },
  "Taptap Send": { bg: "#5B2D8E", text: "#fff", abbr: "TS" },
};

function FallbackAvatar({ name }: { name: string }) {
  const brand = BRAND[name] ?? { bg: "#64748b", text: "#fff", abbr: name.slice(0, 2).toUpperCase() };
  return (
    <div
      className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 text-xs font-bold tracking-tight select-none"
      style={{ background: brand.bg, color: brand.text }}
      aria-hidden
    >
      {brand.abbr}
    </div>
  );
}

interface Props {
  name: string;
  logoUrl: string | null | undefined;
}

export default function ProviderLogo({ name, logoUrl }: Props) {
  const [failed, setFailed] = useState(false);
  const src = getProviderLogo(name, logoUrl);

  if (!src || failed) {
    return <FallbackAvatar name={name} />;
  }

  return (
    <div className="w-10 h-10 rounded-xl overflow-hidden shrink-0 bg-white border border-slate-100 flex items-center justify-center p-1.5">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={`${name} logo`}
        width={32}
        height={32}
        className="object-contain w-full h-full"
        onError={() => setFailed(true)}
      />
    </div>
  );
}
