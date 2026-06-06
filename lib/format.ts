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
