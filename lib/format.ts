export function formatPHP(amount: number): string {
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatDateRange(start: string, end: string): string {
  const s = new Date(start);
  const e = new Date(end);
  const sameMonth = s.getMonth() === e.getMonth() && s.getFullYear() === e.getFullYear();
  const fmt = (d: Date, opts: Intl.DateTimeFormatOptions) =>
    new Intl.DateTimeFormat("en-PH", opts).format(d);
  if (sameMonth) {
    return `${fmt(s, { month: "short", day: "numeric" })} – ${fmt(e, {
      day: "numeric",
      year: "numeric",
    })}`;
  }
  return `${fmt(s, { month: "short", day: "numeric" })} – ${fmt(e, {
    month: "short",
    day: "numeric",
    year: "numeric",
  })}`;
}

export function daysBetween(start: string, end: string): number {
  const s = new Date(start);
  const e = new Date(end);
  return Math.round((e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24)) + 1;
}

// Split a bill into a shared base (split equally among everyone, including those
// with 0 days) plus a usage portion allocated by person-days. Returns the amount
// owed per entry, in the same order as `days`. If nobody stayed any days, the
// whole bill is split equally.
export function splitAmounts(
  total: number,
  sharedPct: number,
  days: number[]
): number[] {
  const n = days.length;
  if (n === 0) return [];
  const pct = Math.min(Math.max(sharedPct, 0), 100);
  const base = total * (pct / 100);
  const usage = total - base;
  const totalDays = days.reduce((s, d) => s + d, 0);
  const basePer = base / n;
  return days.map((d) => {
    const usageShare = totalDays > 0 ? (d / totalDays) * usage : usage / n;
    return Math.round((basePer + usageShare) * 100) / 100;
  });
}

// Sortable month key ("2026-03") derived from a date string.
export function monthKey(dateStr: string): string {
  const d = new Date(dateStr);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

// Human label for a month key ("2026-03" → "March 2026").
export function monthLabelFromKey(key: string): string {
  const [y, m] = key.split("-").map(Number);
  return new Intl.DateTimeFormat("en-PH", { month: "long", year: "numeric" }).format(
    new Date(y, m - 1, 1)
  );
}

// Short label for a month key ("2026-03" → "Mar 2026"), handy for chips/titles.
export function monthShortFromKey(key: string): string {
  const [y, m] = key.split("-").map(Number);
  return new Intl.DateTimeFormat("en-PH", { month: "short", year: "numeric" }).format(
    new Date(y, m - 1, 1)
  );
}
