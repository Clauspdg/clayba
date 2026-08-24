/**
 * Same pattern as the driver app / web driver earnings page —
 * `Intl.NumberFormat` glues the symbol to the number correctly ("$0.00",
 * not "USD 0.00" or "$ 0.00"), which manual `{currency} {amount.toFixed(2)}`
 * string concatenation does not. Hermes (this app's JS engine) has full
 * `Intl` support since RN 0.71, so no polyfill is needed.
 */
export function formatMoney(amount: number, currency: string, locale: string): string {
  return new Intl.NumberFormat(locale, { style: "currency", currency }).format(amount);
}
