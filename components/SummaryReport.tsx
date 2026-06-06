"use client";

import { useMemo, useRef, useState } from "react";
import { X, Copy, Check, Download, Zap, Droplets } from "lucide-react";
import { toPng } from "html-to-image";
import type { Bill } from "@/lib/types";
import {
  formatPHP,
  formatDateRange,
  monthKey,
  monthLabelFromKey,
  monthShortFromKey,
} from "@/lib/format";

interface Props {
  bills: Bill[];
  onClose: () => void;
}

interface Line {
  name: string;
  days: number;
  amount: number;
  pct: number;
}
interface BillData {
  bill: Bill;
  totalDays: number;
  lines: Line[];
}
interface MonthData {
  key: string;
  monthTotal: number;
  bills: BillData[];
}
interface TypeSummary {
  months: MonthData[];
  perPerson: Map<string, number>;
  total: number;
}

function summarize(typeBills: Bill[]): TypeSummary {
  const byMonth = new Map<string, Bill[]>();
  for (const b of typeBills) {
    const k = monthKey(b.period_end);
    (byMonth.get(k) ?? byMonth.set(k, []).get(k)!).push(b);
  }
  const perPerson = new Map<string, number>();
  let total = 0;
  const months = [...byMonth.keys()].sort().map((key) => {
    const monthBills = byMonth
      .get(key)!
      .sort((a, b) => a.period_end.localeCompare(b.period_end));
    let monthTotal = 0;
    const bills = monthBills.map((bill) => {
      const entries = bill.entries ?? [];
      const totalDays = entries.reduce((s, e) => s + e.days_stayed, 0);
      monthTotal += bill.total_amount;
      const lines = [...entries]
        .sort((a, b) => b.days_stayed - a.days_stayed)
        .map((e) => {
          perPerson.set(
            e.roommate_name,
            (perPerson.get(e.roommate_name) ?? 0) + e.amount_owed
          );
          return {
            name: e.roommate_name,
            days: e.days_stayed,
            amount: e.amount_owed,
            // Share of the bill's cost (with a shared base, this differs from day-share).
            pct: bill.total_amount > 0 ? (e.amount_owed / bill.total_amount) * 100 : 0,
          };
        });
      return { bill, totalDays, lines };
    });
    total += monthTotal;
    return { key, monthTotal, bills };
  });
  return { months, perPerson, total };
}

type TypeFilter = "both" | "water" | "electricity";

export default function SummaryReport({ bills, onClose }: Props) {
  const [copied, setCopied] = useState(false);
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("both");
  const reportRef = useRef<HTMLDivElement>(null);

  // Months that actually have bills, ascending.
  const availableMonths = useMemo(() => {
    const set = new Set(bills.map((b) => monthKey(b.period_end)));
    return [...set].sort();
  }, [bills]);

  const [selected, setSelected] = useState<Set<string>>(
    () => new Set(availableMonths)
  );

  const selectedSorted = useMemo(
    () => [...selected].sort(),
    [selected]
  );

  const filtered = useMemo(
    () => bills.filter((b) => selected.has(monthKey(b.period_end))),
    [bills, selected]
  );

  const water = useMemo(
    () => summarize(filtered.filter((b) => b.type === "water")),
    [filtered]
  );
  const electricity = useMemo(
    () => summarize(filtered.filter((b) => b.type === "electricity")),
    [filtered]
  );

  const includeWater = typeFilter !== "electricity";
  const includeElec = typeFilter !== "water";
  const isBoth = typeFilter === "both";
  const grandTotal =
    (includeWater ? water.total : 0) + (includeElec ? electricity.total : 0);

  // Per-person totals scoped to the selected bill type(s).
  const combined = useMemo(() => {
    const names = new Set<string>();
    if (includeWater) water.perPerson.forEach((_, k) => names.add(k));
    if (includeElec) electricity.perPerson.forEach((_, k) => names.add(k));
    return [...names]
      .map((name) => {
        const w = includeWater ? water.perPerson.get(name) ?? 0 : 0;
        const e = includeElec ? electricity.perPerson.get(name) ?? 0 : 0;
        return { name, water: w, electricity: e, total: w + e };
      })
      .sort((a, b) => b.total - a.total);
  }, [water, electricity, includeWater, includeElec]);

  const rangeLabel =
    selectedSorted.length === 0
      ? "No months selected"
      : selectedSorted.map(monthShortFromKey).join(", ");

  function toggleMonth(key: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  }

  const allSelected = selected.size === availableMonths.length;
  function toggleAll() {
    setSelected(allSelected ? new Set() : new Set(availableMonths));
  }

  function buildText(): string {
    const scopeLabel =
      typeFilter === "both" ? "WATER + ELECTRICITY" : typeFilter.toUpperCase();
    const L: string[] = [];
    L.push(`SPLIT SUMMARY (${scopeLabel}) — ${rangeLabel}`);
    L.push(
      isBoth
        ? `Total: ${formatPHP(grandTotal)} (water ${formatPHP(
            water.total
          )} + electricity ${formatPHP(electricity.total)})`
        : `Total: ${formatPHP(grandTotal)}`
    );
    L.push("");
    L.push(`PER PERSON${isBoth ? " (combined)" : ""}`);
    for (const p of combined) {
      L.push(
        isBoth
          ? `• ${p.name} — ${formatPHP(p.total)}  (water ${formatPHP(
              p.water
            )} · electricity ${formatPHP(p.electricity)})`
          : `• ${p.name} — ${formatPHP(p.total)}`
      );
    }
    const sections = [
      ["WATER", water, includeWater],
      ["ELECTRICITY", electricity, includeElec],
    ] as const;
    for (const [label, data, include] of sections) {
      if (!include || data.total === 0) continue;
      L.push("");
      L.push(`${label} — ${formatPHP(data.total)}`);
      for (const m of data.months) {
        L.push(`  ${monthLabelFromKey(m.key)} — ${formatPHP(m.monthTotal)}`);
        for (const bd of m.bills) {
          L.push(
            `    ${formatDateRange(bd.bill.period_start, bd.bill.period_end)} · ${formatPHP(
              bd.bill.total_amount
            )} · ${bd.totalDays} person-days${
              bd.bill.shared_pct ? ` · ${bd.bill.shared_pct}% shared` : ""
            }${bd.bill.notes ? " · " + bd.bill.notes : ""}`
          );
          for (const l of bd.lines) {
            L.push(
              `      - ${l.name}: ${l.days}d (${l.pct.toFixed(1)}%) → ${formatPHP(
                l.amount
              )}`
            );
          }
        }
      }
      L.push("  Per person:");
      for (const [name, amt] of [...data.perPerson.entries()].sort(
        (a, b) => b[1] - a[1]
      )) {
        L.push(`    • ${name} → ${formatPHP(amt)}`);
      }
    }
    return L.join("\n");
  }

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(buildText());
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      alert("Could not copy. Try selecting the text manually.");
    }
  }

  async function handleDownload() {
    if (!reportRef.current) return;
    try {
      const dataUrl = await toPng(reportRef.current, {
        backgroundColor: "#FBF8F2",
        pixelRatio: 2,
      });
      const link = document.createElement("a");
      link.download = `split-summary-${selectedSorted[0] ?? "report"}.png`;
      link.href = dataUrl;
      link.click();
    } catch (e) {
      console.error(e);
      alert("Could not generate image.");
    }
  }

  const scopedBillCount =
    (includeWater ? filtered.filter((b) => b.type === "water").length : 0) +
    (includeElec ? filtered.filter((b) => b.type === "electricity").length : 0);
  const hasData = grandTotal > 0 || scopedBillCount > 0;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 lg:p-3 bg-ink-900/50 backdrop-blur-md animate-fade-in"
      onClick={onClose}
    >
      <div
        className="bg-cream-50 rounded-t-3xl sm:rounded-3xl shadow-float w-full sm:max-w-lg lg:max-w-5xl max-h-[92vh] lg:max-h-[94vh] flex flex-col animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Toolbar */}
        <div className="flex-shrink-0 bg-cream-50/95 backdrop-blur px-5 py-3 flex items-center justify-between border-b border-cream-200 rounded-t-3xl">
          <span className="text-xs uppercase tracking-widest text-ink-500 font-medium">
            Split summary
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={handleCopy}
              disabled={!hasData}
              className="p-2 rounded-lg hover:bg-cream-100 text-ink-700 disabled:opacity-30"
              title="Copy summary"
            >
              {copied ? (
                <Check className="w-4 h-4 text-forest-600" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
            </button>
            <button
              onClick={handleDownload}
              disabled={!hasData}
              className="p-2 rounded-lg hover:bg-cream-100 text-ink-700 disabled:opacity-30"
              title="Download as image"
            >
              <Download className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-cream-100 text-ink-700"
              title="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Controls (not captured in image) */}
        <div className="flex-shrink-0 px-5 py-4 lg:py-2.5 border-b border-cream-200">
          <div className="flex items-center justify-between gap-2 mb-2.5 lg:mb-2">
            {/* Type filter */}
            <div className="flex items-center gap-1 p-0.5 bg-cream-100 rounded-full ring-1 ring-inset ring-cream-200">
              {([
                ["both", "Both", null],
                ["water", "Water", Droplets],
                ["electricity", "Electricity", Zap],
              ] as const).map(([val, label, Icon]) => {
                const on = typeFilter === val;
                const activeInk =
                  val === "water"
                    ? "text-ocean-mid"
                    : val === "electricity"
                    ? "text-amber-mid"
                    : "text-forest-700";
                return (
                  <button
                    key={val}
                    onClick={() => setTypeFilter(val)}
                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold transition-all ${
                      on
                        ? `bg-white shadow-soft ${activeInk}`
                        : "text-ink-500 hover:text-ink-800"
                    }`}
                  >
                    {Icon && <Icon className="w-3.5 h-3.5" />}
                    {label}
                  </button>
                );
              })}
            </div>
            {availableMonths.length > 0 && (
              <button
                onClick={toggleAll}
                className="flex-shrink-0 text-xs font-semibold text-forest-600 hover:text-forest-800"
              >
                {allSelected ? "Clear all" : "Select all"}
              </button>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            {availableMonths.map((key) => {
              const on = selected.has(key);
              return (
                <button
                  key={key}
                  onClick={() => toggleMonth(key)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                    on
                      ? "bg-forest-grad text-cream-50 border-transparent shadow-soft"
                      : "bg-white text-ink-700 border-cream-200 hover:border-forest-600/40"
                  }`}
                >
                  {monthShortFromKey(key)}
                </button>
              );
            })}
          </div>
        </div>

        {/* Scrollable report */}
        <div className="overflow-y-auto">
          {!hasData ? (
            <div className="p-10 text-center text-sm text-ink-500">
              {selected.size === 0
                ? "Select one or more months above to build the summary."
                : "No bills in the selected months."}
            </div>
          ) : (
            <div
              ref={reportRef}
              className="p-5 sm:p-6 bg-cream-50 lg:grid lg:grid-cols-2 lg:gap-x-8 lg:items-start"
            >
              {/* Headline */}
              <div className="text-center pb-5 lg:pb-2 border-b border-cream-200 lg:col-span-2">
                <div className="text-xs uppercase tracking-widest text-ink-500 mb-1">
                  {isBoth
                    ? "Detailed split"
                    : `Detailed ${typeFilter} split`}{" "}
                  · {rangeLabel}
                </div>
                <div className="font-serif text-4xl lg:text-[2rem] text-ink-900 tnum">
                  {formatPHP(grandTotal)}
                </div>
                {isBoth && (
                  <div className="text-xs text-ink-500 mt-1.5 lg:mt-1 flex items-center justify-center gap-3">
                    <span className="inline-flex items-center gap-1 text-ocean-mid">
                      <Droplets className="w-3 h-3" /> {formatPHP(water.total)}
                    </span>
                    <span className="inline-flex items-center gap-1 text-amber-mid">
                      <Zap className="w-3 h-3" /> {formatPHP(electricity.total)}
                    </span>
                  </div>
                )}
              </div>

              {/* Per-person totals (scoped to selected type) */}
              <div className="py-5 lg:py-2.5 border-b border-cream-200 lg:col-span-2">
                <h3 className="text-xs uppercase tracking-widest text-ink-500 mb-3 lg:mb-2">
                  Per person{isBoth ? " · combined" : ` · ${typeFilter}`}
                </h3>
                <div className="space-y-2.5 lg:grid lg:grid-cols-2 lg:gap-x-8 lg:gap-y-2.5 lg:space-y-0">
                  {combined.map((p) => (
                    <div key={p.name} className="flex items-baseline gap-3">
                      <span className="flex-1 min-w-0 truncate text-sm font-medium text-ink-900">
                        {p.name}
                      </span>
                      {isBoth && (
                        <span className="text-[11px] text-ink-500 flex-shrink-0 tnum">
                          <span className="text-ocean-mid">{formatPHP(p.water)}</span>
                          {" · "}
                          <span className="text-amber-mid">{formatPHP(p.electricity)}</span>
                        </span>
                      )}
                      <span className="font-serif text-lg text-ink-900 flex-shrink-0 tnum w-24 text-right">
                        {formatPHP(p.total)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Detailed sections */}
              {includeWater && (
                <TypeSection
                  title="Water"
                  Icon={Droplets}
                  accent="ocean"
                  data={water}
                  showPerPerson={isBoth}
                  wide={!isBoth}
                />
              )}
              {includeElec && (
                <TypeSection
                  title="Electricity"
                  Icon={Zap}
                  accent="amber"
                  data={electricity}
                  showPerPerson={isBoth}
                  wide={!isBoth}
                />
              )}

              <p className="mt-6 text-[10px] text-ink-400 text-center lg:col-span-2">
                Dorm Bill Splitter · person-days method
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function TypeSection({
  title,
  Icon,
  accent,
  data,
  showPerPerson,
  wide,
}: {
  title: string;
  Icon: typeof Zap;
  accent: "ocean" | "amber";
  data: TypeSummary;
  showPerPerson: boolean;
  wide: boolean;
}) {
  if (data.total === 0) return null;
  const ink = accent === "ocean" ? "text-ocean-mid" : "text-amber-mid";
  const tint = accent === "ocean" ? "bg-ocean-tint" : "bg-amber-tint";
  const perPersonSorted = [...data.perPerson.entries()].sort((a, b) => b[1] - a[1]);

  return (
    <div
      className={`py-5 lg:py-2.5 border-b border-cream-200 last:border-0 lg:border-b-0 lg:self-start ${
        wide ? "lg:col-span-2" : ""
      }`}
    >
      <div className="flex items-center justify-between mb-4 lg:mb-2">
        <div className="flex items-center gap-2">
          <span className={`w-7 h-7 rounded-lg ${tint} ${ink} flex items-center justify-center`}>
            <Icon className="w-4 h-4" />
          </span>
          <h3 className="font-serif text-xl text-ink-900">{title}</h3>
        </div>
        <span className={`font-serif text-lg tnum ${ink}`}>{formatPHP(data.total)}</span>
      </div>

      <div
        className={`space-y-5 lg:space-y-2 ${
          wide ? "lg:grid lg:grid-cols-2 lg:gap-x-8 lg:gap-y-2 lg:space-y-0 lg:items-start" : ""
        }`}
      >
        {data.months.map((m) => (
          <div key={m.key}>
            {/* Month header — shown only when a month has multiple bills,
                otherwise the bill's own date line carries the month. */}
            {m.bills.length > 1 && (
              <div className="flex items-baseline justify-between mb-2 lg:mb-1.5">
                <h4 className="text-xs uppercase tracking-wider text-ink-700 font-semibold">
                  {monthLabelFromKey(m.key)}
                </h4>
                <span className="text-xs text-ink-500 tnum">{formatPHP(m.monthTotal)}</span>
              </div>
            )}

            <div className="space-y-3 lg:space-y-2">
              {m.bills.map((bd) => (
                <div
                  key={bd.bill.id}
                  className="rounded-xl border border-cream-200 bg-white p-3 lg:p-2"
                >
                  <div className="flex items-baseline justify-between gap-2 mb-2 lg:mb-1.5">
                    <span className="text-xs text-ink-700 truncate">
                      {formatDateRange(bd.bill.period_start, bd.bill.period_end)}
                      {bd.bill.shared_pct ? ` · ${bd.bill.shared_pct}% shared` : ""}
                      {bd.bill.notes ? ` · ${bd.bill.notes}` : ""}
                    </span>
                    <span className="text-xs font-medium text-ink-900 flex-shrink-0 tnum">
                      {formatPHP(bd.bill.total_amount)}
                    </span>
                  </div>
                  <div className="space-y-1.5 lg:space-y-1">
                    {bd.lines.map((l) => (
                      <div key={l.name} className="flex items-center gap-2">
                        <span className="flex-1 min-w-0 truncate text-xs text-ink-800">
                          {l.name}
                        </span>
                        <span className="text-[11px] text-ink-500 flex-shrink-0 tnum w-20 text-right">
                          {l.days}d · {l.pct.toFixed(0)}%
                        </span>
                        <span className={`text-xs font-medium flex-shrink-0 tnum w-20 text-right ${ink}`}>
                          {formatPHP(l.amount)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Per-person totals for this type (hidden when a single type is shown,
          since the top per-person section already covers it). */}
      {showPerPerson && (
        <div className={`mt-4 lg:mt-2 rounded-xl ${tint} p-3 lg:p-2`}>
          <div className="text-[11px] uppercase tracking-wider text-ink-700 font-semibold mb-2 lg:mb-1.5">
            {title} · per person
          </div>
          <div className="space-y-1.5 lg:space-y-1">
            {perPersonSorted.map(([name, amt]) => (
              <div key={name} className="flex items-center gap-2">
                <span className="flex-1 min-w-0 truncate text-xs text-ink-800">{name}</span>
                <span className={`text-xs font-semibold flex-shrink-0 tnum ${ink}`}>
                  {formatPHP(amt)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
