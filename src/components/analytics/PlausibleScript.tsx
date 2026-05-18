import Script from "next/script";

/** Loads Plausible when NEXT_PUBLIC_PLAUSIBLE_DOMAIN is set (Day 13). */
export function PlausibleScript() {
  const domain = process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN;
  if (!domain) return null;

  return (
    <Script
      defer
      data-domain={domain}
      src="https://plausible.io/js/script.tagged-events.js"
      strategy="afterInteractive"
    />
  );
}
