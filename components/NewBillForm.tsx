"use client";

import { useMemo, useState } from "react";
import { Zap, Droplets, Calendar, Save, Loader2, Refrigerator } from "lucide-react";
import type { BillType, Roommate } from "@/lib/types";
import { createBill } from "@/lib/supabase";
import { formatPHP, daysBetween, splitAmounts } from "@/lib/format";

interface Props {
  roommates: Roommate[];
  unitId: string;
  onCreated: () => void;
}

export default function NewBillForm({ roommates, unitId, onCreated }: Props) {
  const [type, setType] = useState<BillType>("electricity");
  const [amount, setAmount] = useState("");
  const today = new Date().toISOString().slice(0, 10);
  const firstOfMonth = today.slice(0, 8) + "01";
  const [periodStart, setPeriodStart] = useState(firstOfMonth);
  const [periodEnd, setPeriodEnd] = useState(today);
  const [notes, setNotes] = useState("");
  const [days, setDays] = useState<Record<string, string>>({});
  const [sharedPctStr, setSharedPctStr] = useState("25");
  const [perAbsentDayStr, setPerAbsentDayStr] = useState("5");
  const [saving, setSaving] = useState(false);

  // Shared base & absent-day fee only apply to electricity.
  const isElectricity = type === "electricity";
  const sharedPct = isElectricity
    ? Math.min(Math.max(parseFloat(sharedPctStr) || 0, 0), 100)
    : 0;
  const perAbsentDay = isElectricity ? Math.max(parseFloat(perAbsentDayStr) || 0, 0) : 0;

  const totalDays = useMemo(
    () =>
      Object.values(days).reduce((s, v) => {
        const n = parseInt(v || "0", 10);
        return s + (isNaN(n) ? 0 : n);
      }, 0),
    [days]
  );

  const amountNum = parseFloat(amount) || 0;
  const periodDays = periodStart && periodEnd ? daysBetween(periodStart, periodEnd) : 0;

  const breakdown = useMemo(() => {
    const dayList = roommates.map((r) => parseInt(days[r.id] || "0", 10) || 0);
    const owedList = splitAmounts(amountNum, sharedPct, dayList, {
      periodDays,
      perAbsentDay,
    });
    return roommates.map((r, i) => ({
      roommate: r,
      days: dayList[i],
      owed: owedList[i] ?? 0,
    }));
  }, [roommates, days, amountNum, sharedPct, periodDays, perAbsentDay]);

  const baseAmount = amountNum * (sharedPct / 100);
  const basePerPerson = roommates.length > 0 ? baseAmount / roommates.length : 0;

  async function handleSave() {
    if (!amountNum) {
      alert("Enter a bill amount.");
      return;
    }
    if (roommates.length === 0) {
      alert("Add at least one roommate first.");
      return;
    }
    if (totalDays === 0) {
      alert("Enter days stayed for at least one roommate.");
      return;
    }

    setSaving(true);
    try {
      await createBill({
        type,
        total_amount: amountNum,
        period_start: periodStart,
        period_end: periodEnd,
        notes,
        shared_pct: sharedPct,
        per_absent_day: perAbsentDay,
        entries: roommates.map((r) => ({
          roommate_id: r.id,
          roommate_name: r.name,
          days_stayed: parseInt(days[r.id] || "0", 10) || 0,
        })),
      }, unitId);
      // Reset
      setAmount("");
      setNotes("");
      setDays({});
      onCreated();
    } catch (e) {
      console.error(e);
      alert("Could not save the bill. Check the console for details.");
    } finally {
      setSaving(false);
    }
  }

  const palette =
    type === "electricity"
      ? {
          tint: "bg-amber-tint",
          ink: "text-amber-mid",
          border: "border-amber-mid/30",
          icon: Zap,
        }
      : {
          tint: "bg-ocean-tint",
          ink: "text-ocean-mid",
          border: "border-ocean-mid/30",
          icon: Droplets,
        };
  const Icon = palette.icon;

  return (
    <div className="relative bg-white rounded-2xl shadow-card hover:shadow-elevated border border-cream-200 p-6 lg:p-7 transition-shadow duration-300 overflow-hidden">
      <span className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-ink-900/30 to-transparent" />
      <h2 className="font-serif text-2xl mb-5 text-ink-900">New bill</h2>

      {/* Type toggle */}
      <div className="grid grid-cols-2 gap-1.5 p-1.5 bg-cream-100 rounded-2xl mb-6 ring-1 ring-inset ring-cream-200">
        <button
          onClick={() => setType("electricity")}
          className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-sm font-semibold transition-all duration-200 ${
            type === "electricity"
              ? "bg-white text-amber-mid shadow-card scale-[1.01]"
              : "text-ink-500 hover:text-ink-800"
          }`}
        >
          <Zap className="w-4 h-4" /> Electricity
        </button>
        <button
          onClick={() => setType("water")}
          className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-sm font-semibold transition-all duration-200 ${
            type === "water"
              ? "bg-white text-ocean-mid shadow-card scale-[1.01]"
              : "text-ink-500 hover:text-ink-800"
          }`}
        >
          <Droplets className="w-4 h-4" /> Water
        </button>
      </div>

      {/* Amount */}
      <label className="block mb-5">
        <span className="text-xs uppercase tracking-wider text-ink-500 font-medium">
          Total amount
        </span>
        <div className="mt-1.5 flex items-center gap-1 border-b-2 border-ink-900 pb-1.5 transition-colors focus-within:border-forest-600">
          <span className="font-serif text-3xl text-ink-500">₱</span>
          <input
            type="number"
            inputMode="decimal"
            step="0.01"
            min="0"
            placeholder="0.00"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="flex-1 min-w-0 font-serif text-3xl bg-transparent outline-none placeholder:text-ink-400 tnum"
          />
        </div>
      </label>

      {/* Period */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5">
        <label className="block min-w-0">
          <span className="text-xs uppercase tracking-wider text-ink-500 font-medium flex items-center gap-1">
            <Calendar className="w-3 h-3" /> Period start
          </span>
          <input
            type="date"
            value={periodStart}
            onChange={(e) => setPeriodStart(e.target.value)}
            className="mt-1.5 w-full min-w-0 text-sm border border-cream-200 rounded-xl px-3 py-2.5 bg-cream-50 focus:bg-white focus:border-forest-600/40 transition-colors"
          />
        </label>
        <label className="block min-w-0">
          <span className="text-xs uppercase tracking-wider text-ink-500 font-medium flex items-center gap-1">
            <Calendar className="w-3 h-3" /> Period end
          </span>
          <input
            type="date"
            value={periodEnd}
            onChange={(e) => setPeriodEnd(e.target.value)}
            className="mt-1.5 w-full min-w-0 text-sm border border-cream-200 rounded-xl px-3 py-2.5 bg-cream-50 focus:bg-white focus:border-forest-600/40 transition-colors"
          />
        </label>
      </div>
      {periodDays > 0 && (
        <p className="text-xs text-ink-500 mb-5 -mt-3">
          Billing period: <span className="text-ink-800 font-medium">{periodDays} days</span>
        </p>
      )}

      {/* Electricity fairness — shared base + absent-day fee */}
      {isElectricity && (
        <div className="mb-5 rounded-2xl border border-cream-200 bg-cream-50 p-4 space-y-3">
          <div className="flex items-center gap-2">
            <Refrigerator className="w-4 h-4 text-forest-600 flex-shrink-0" />
            <h3 className="text-sm font-semibold text-ink-900">Electricity fairness</h3>
          </div>

          {/* Shared base % */}
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-sm text-ink-800">Shared base</p>
              <p className="text-xs text-ink-500">
                Fridge, wifi &amp; standby — split equally.
              </p>
            </div>
            <div className="flex items-center gap-1 flex-shrink-0">
              <input
                type="number"
                inputMode="numeric"
                min="0"
                max="100"
                value={sharedPctStr}
                onChange={(e) => setSharedPctStr(e.target.value)}
                className="w-16 text-right text-lg font-serif tnum bg-white rounded-lg px-2 py-1 border border-cream-200 focus:border-forest-600/40 outline-none"
              />
              <span className="text-ink-500 text-sm">%</span>
            </div>
          </div>

          {/* Absent-day fee */}
          <div className="flex items-center justify-between gap-3 pt-3 border-t border-cream-200">
            <div className="min-w-0">
              <p className="text-sm text-ink-800">Absent-day fee</p>
              <p className="text-xs text-ink-500">
                Charged to whoever was away that day.
              </p>
            </div>
            <div className="flex items-center gap-1 flex-shrink-0">
              <span className="text-ink-500 text-sm">₱</span>
              <input
                type="number"
                inputMode="decimal"
                min="0"
                step="0.5"
                value={perAbsentDayStr}
                onChange={(e) => setPerAbsentDayStr(e.target.value)}
                className="w-16 text-right text-lg font-serif tnum bg-white rounded-lg px-2 py-1 border border-cream-200 focus:border-forest-600/40 outline-none"
              />
              <span className="text-ink-500 text-xs">/day</span>
            </div>
          </div>

          {amountNum > 0 &&
            roommates.length > 0 &&
            (sharedPct > 0 || perAbsentDay > 0) && (
              <p className="text-xs text-ink-500 pt-3 border-t border-cream-200">
                {sharedPct > 0 && (
                  <>
                    {formatPHP(baseAmount)} base ÷ {roommates.length} ={" "}
                    <span className="text-ink-800 font-medium">
                      {formatPHP(basePerPerson)} each
                    </span>
                    .{" "}
                  </>
                )}
                {perAbsentDay > 0 && periodDays > 0 && (
                  <>
                    {formatPHP(perAbsentDay)}/absent day (of {periodDays}) shifts
                    cost to absentees.{" "}
                  </>
                )}
                Rest by days · total stays {formatPHP(amountNum)}.
              </p>
            )}
        </div>
      )}

      {/* Days per roommate */}
      <div className={`rounded-2xl ${palette.tint} ${palette.border} border p-4 mb-5 shadow-inner-light transition-colors duration-300`}>
        <div className="flex items-center gap-2 mb-3">
          <Icon className={`w-4 h-4 ${palette.ink}`} />
          <h3 className="text-sm font-semibold text-ink-900">Days stayed in dorm</h3>
        </div>

        {roommates.length === 0 ? (
          <p className="text-sm text-ink-700">Add roommates first.</p>
        ) : (
          <div className="space-y-2">
            {breakdown.map(({ roommate, days: d, owed }) => (
              <div
                key={roommate.id}
                className="flex items-center gap-2 sm:gap-3 bg-white/70 rounded-xl px-3 py-2 ring-1 ring-inset ring-white/50"
              >
                <span className="flex-1 min-w-0 truncate text-sm text-ink-900">
                  {roommate.name}
                </span>
                <input
                  type="number"
                  inputMode="numeric"
                  min="0"
                  max={periodDays || undefined}
                  placeholder="0"
                  value={days[roommate.id] || ""}
                  onChange={(e) =>
                    setDays((prev) => ({ ...prev, [roommate.id]: e.target.value }))
                  }
                  className="w-14 flex-shrink-0 text-sm text-right bg-cream-50 rounded px-2 py-1 border border-cream-200 focus:bg-white"
                />
                <span className="text-xs text-ink-500 flex-shrink-0">days</span>
                <span className={`w-[4.5rem] sm:w-24 flex-shrink-0 text-right text-sm font-semibold tnum ${palette.ink}`}>
                  {amountNum > 0 && totalDays > 0 ? formatPHP(owed) : "—"}
                </span>
              </div>
            ))}
          </div>
        )}

        {totalDays > 0 && (
          <div className="mt-3 pt-3 border-t border-cream-200 flex justify-between text-xs text-ink-700">
            <span>{totalDays} person-days total</span>
            <span>Total: {formatPHP(amountNum)}</span>
          </div>
        )}
      </div>

      {/* Notes */}
      <label className="block mb-5">
        <span className="text-xs uppercase tracking-wider text-ink-500 font-medium">
          Notes (optional)
        </span>
        <input
          type="text"
          placeholder="e.g. Meralco bill, kWh: 245"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="mt-1.5 w-full text-sm border border-cream-200 rounded-xl px-3 py-2.5 bg-cream-50 focus:bg-white focus:border-forest-600/40 transition-colors"
        />
      </label>

      <button
        onClick={handleSave}
        disabled={saving || !amountNum || totalDays === 0}
        className="sheen-on-hover w-full flex items-center justify-center gap-2 bg-ink-grad hover:shadow-glow disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:shadow-none text-cream-50 font-semibold py-3.5 rounded-2xl transition-all duration-300 active:scale-[0.99] shadow-card"
      >
        {saving ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" /> Saving…
          </>
        ) : (
          <>
            <Save className="w-4 h-4" /> Save bill
          </>
        )}
      </button>
    </div>
  );
}
