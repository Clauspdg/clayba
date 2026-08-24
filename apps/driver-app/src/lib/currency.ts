/**
 * Same pattern as the web driver earnings page
 * (apps/web/src/app/(driver)/driver/earnings/page.tsx) — `Intl.NumberFormat`
 * glues the symbol to the number correctly ("$0.00", not "USD 0.00" or
 * "$ 0.00"), which the old `{currency} {amount.toFixed(2)}` string
 * concatenation in Earnings/Wallet did not. Hermes (this app's JS engine)
 * has full `Intl` support since RN 0.71, so no polyfill is needed.
 */
export function formatMoney(amount: number, currency: string, locale: string): string {
  return new Intl.NumberFormat(locale, { style: "currency", currency }).format(amount);
}
