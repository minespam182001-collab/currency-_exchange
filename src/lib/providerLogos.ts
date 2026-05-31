/** Local logo assets in /public/logos — bundled with the app, no external fetch. */
export const PROVIDER_LOGOS: Record<string, string> = {
  Remitly: "/logos/remitly.png",
  Wise: "/logos/wise.png",
  "Western Union": "/logos/western-union.png",
  Xoom: "/logos/xoom.png",
  "ICICI Money2India": "/logos/icici-money2india.svg",
  "Taptap Send": "/logos/taptap-send.png",
};

export function getProviderLogo(name: string, _logoUrl?: string | null): string | null {
  return PROVIDER_LOGOS[name] ?? null;
}
