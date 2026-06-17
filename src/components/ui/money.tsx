"use client";

import { usePrefs } from "@/components/prefs/prefs-provider";
import { formatCompact, formatMoney } from "@/lib/currency";

export function Money({ value, compact = false }: { value: number; compact?: boolean }) {
  const { currency } = usePrefs();
  return <>{compact ? formatCompact(value, currency) : formatMoney(value, currency)}</>;
}
