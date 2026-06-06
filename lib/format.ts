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

// Split a bill fairly and exactly (shares always sum to `total`):
//   1. a shared base (sharedPct of the bill) split equally among everyone,
//      including those with 0 days — covers fridge/wifi/standby load;
//   2. an absent-day fee (perAbsentDay × each person's absent days) charged to
//      whoever was away — shifts cost onto absentees without changing the total;
//   3. the remainder allocated by person-days (presence).
// If the base + absent fees would exceed the bill, the absent fees are scaled
// down to fit. If nobody stayed any days, the remainder is split equally.
export function splitAmounts(
  total: number,
  sharedPct: number,
  days: number[],
  opts: { periodDays?: number; perAbsentDay?: number } = {}
): number[] {
  const n = days.length;
  if (n === 0) return [];
  const pct = Math.min(Math.max(sharedPct, 0), 100);
  const periodDays = Math.max(0, opts.periodDays ?? 0);
  const perAbsentDay = Math.max(0, opts.perAbsentDay ?? 0);

  const base = total * (pct / 100);
  const basePer = base / n;
  const totalDays = days.reduce((s, d) => s + d, 0);

  const rawAbsent = days.map(
    (d) => Math.max(0, periodDays - d) * perAbsentDay
  );
  const absentTotal = rawAbsent.reduce((s, a) => s + a, 0);

  let usagePool = total - base - absentTotal;
  let absent = rawAbsent;
  if (usagePool < 0) {
    // Base + absent fees exceed the bill: scale the fees to fit, no usage pool.
    const available = Math.max(0, total - base);
    const scale = absentTotal > 0 ? available / absentTotal : 0;
    absent = rawAbsent.map((a) => a * scale);
    usagePool = 0;
  }

  return days.map((d, i) => {
    const usageShare = totalDays > 0 ? (d / totalDays) * usagePool : usagePool / n;
    return Math.round((basePer + absent[i] + usageShare) * 100) / 100;
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
