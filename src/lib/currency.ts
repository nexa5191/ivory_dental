// Multi-currency engine. Store values are always in USD; we convert at display.

export interface Currency {
  code: string;
  symbol: string;
  name: string;
  rate: number; // units per 1 USD
}

export const CURRENCIES: Currency[] = [
  { code: "USD", symbol: "$", name: "US Dollar", rate: 1 },
  { code: "EUR", symbol: "€", name: "Euro", rate: 0.92 },
  { code: "GBP", symbol: "£", name: "British Pound", rate: 0.79 },
  { code: "INR", symbol: "₹", name: "Indian Rupee", rate: 83.2 },
  { code: "JPY", symbol: "¥", name: "Japanese Yen", rate: 157 },
  { code: "AED", symbol: "د.إ", name: "UAE Dirham", rate: 3.67 },
];

export function findCurrency(code: string): Currency {
  return CURRENCIES.find((c) => c.code === code) ?? CURRENCIES[0];
}

// Standard formatting in the chosen currency.
export function formatMoney(usd: number, currency: Currency): string {
  const value = usd * currency.rate;
  const fractionless = currency.code === "JPY" || Math.abs(value) >= 1000;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency.code,
    maximumFractionDigits: fractionless ? 0 : 2,
    minimumFractionDigits: 0,
  }).format(value);
}

// Compact / scaled formatting:
//   INR  → Lakh (L) and Crore (Cr)
//   else → K and Million (M)
export function formatCompact(usd: number, currency: Currency): string {
  const value = usd * currency.rate;
  const sym = currency.symbol;
  const sign = value < 0 ? "-" : "";
  const abs = Math.abs(value);

  if (currency.code === "INR") {
    if (abs >= 1e7) return `${sign}${sym}${(abs / 1e7).toFixed(2)} Cr`;
    if (abs >= 1e5) return `${sign}${sym}${(abs / 1e5).toFixed(2)} L`;
    if (abs >= 1e3) return `${sign}${sym}${(abs / 1e3).toFixed(1)} K`;
    return `${sign}${sym}${abs.toFixed(0)}`;
  }

  if (abs >= 1e6) return `${sign}${sym}${(abs / 1e6).toFixed(2)} M`;
  if (abs >= 1e3) return `${sign}${sym}${(abs / 1e3).toFixed(1)} K`;
  return `${sign}${sym}${abs.toFixed(currency.code === "JPY" ? 0 : 2)}`;
}
