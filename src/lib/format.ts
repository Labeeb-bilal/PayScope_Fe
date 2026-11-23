const currencyFormatters = new Map<string, Intl.NumberFormat>();

/** "₹25,00,000"-style formatting is locale-specific; we use en-US grouping everywhere for consistency in one table. */
export function formatMoney(amount: number, currency: string): string {
  let f = currencyFormatters.get(currency);
  if (!f) {
    f = new Intl.NumberFormat('en-US', { style: 'currency', currency, maximumFractionDigits: 0 });
    currencyFormatters.set(currency, f);
  }
  return f.format(amount);
}

/** Compact money for KPI cards and chart axes: $653.4M, $58.7K. */
export function formatCompactMoney(amount: number, currency = 'USD'): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency, notation: 'compact', maximumFractionDigits: 1 }).format(amount);
}

export function formatNumber(n: number): string {
  return new Intl.NumberFormat('en-US').format(n);
}

export function formatPercent(ratio: number, digits = 0): string {
  return `${(ratio * 100).toFixed(digits)}%`;
}

/** Percentage change between two salaries, e.g. +8.5%. Returns null when there is no previous value. */
export function salaryChangePct(previous: number | null, next: number): string | null {
  if (previous === null || previous === 0) return null;
  const pct = ((next - previous) / previous) * 100;
  return `${pct >= 0 ? '+' : ''}${pct.toFixed(1)}%`;
}

export function formatDate(iso: string): string {
  const d = new Date(`${iso.slice(0, 10)}T00:00:00Z`);
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' });
}

export function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}
