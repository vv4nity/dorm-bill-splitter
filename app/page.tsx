"use client";

import { useCallback, useEffect, useState } from "react";
import { Receipt, Loader2, Copy, Check, LogOut, CalendarRange } from "lucide-react";
import type { Bill, Roommate, Unit } from "@/lib/types";
import { getBills, getRoommates } from "@/lib/supabase";
import { getStoredUnit, clearStoredUnit } from "@/lib/unit";
import RoommateSettings from "@/components/RoommateSettings";
import NewBillForm from "@/components/NewBillForm";
import BillHistory from "@/components/BillHistory";
import BillDetailModal from "@/components/BillDetailModal";
import SummaryReport from "@/components/SummaryReport";
import UnitGate from "@/components/UnitGate";

export default function HomePage() {
  const [unit, setUnit] = useState<Unit | null>(null);
  const [unitLoaded, setUnitLoaded] = useState(false);
  const [roommates, setRoommates] = useState<Roommate[]>([]);
  const [bills, setBills] = useState<Bill[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBill, setSelectedBill] = useState<Bill | null>(null);
  const [showSummary, setShowSummary] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const load = useCallback(async () => {
    if (!unit) return;
    setLoading(true);
    try {
      const [r, b] = await Promise.all([getRoommates(unit.id), getBills(unit.id)]);
      setRoommates(r);
      setBills(b);
      setError(null);
    } catch (e: any) {
      setError(
        "Could not connect to the database. Check that NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are set and that you ran the schema in Supabase."
      );
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [unit]);

  // Restore the saved unit on first load (client-only).
  useEffect(() => {
    setUnit(getStoredUnit());
    setUnitLoaded(true);
  }, []);

  useEffect(() => {
    if (unit) load();
  }, [unit, load]);

  async function copyCode() {
    if (!unit) return;
    try {
      await navigator.clipboard.writeText(unit.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      /* ignore */
    }
  }

  function switchUnit() {
    if (!confirm("Switch to a different unit? You can rejoin with the code.")) return;
    clearStoredUnit();
    setUnit(null);
    setRoommates([]);
    setBills([]);
  }

  // Avoid a flash of the gate before we've read localStorage.
  if (!unitLoaded) {
    return (
      <main className="relative min-h-screen flex items-center justify-center">
        <Loader2 className="w-5 h-5 animate-spin text-forest-600" />
      </main>
    );
  }

  if (!unit) {
    return <UnitGate onReady={setUnit} />;
  }

  return (
    <main className="relative min-h-screen">
      {/* Header */}
      <header className="relative px-6 lg:px-10 pt-12 lg:pt-16 pb-8 max-w-6xl mx-auto animate-fade-up">
        <div className="flex items-center justify-between gap-2 sm:gap-3 mb-5">
          <div className="inline-flex min-w-0 items-center gap-2.5 pl-1.5 pr-3.5 py-1.5 rounded-full bg-white/70 border border-cream-200 shadow-soft backdrop-blur-sm">
            <span className="w-7 h-7 flex-shrink-0 rounded-full bg-ink-grad text-cream-50 flex items-center justify-center shadow-inner-light">
              <Receipt className="w-3.5 h-3.5" />
            </span>
            <span className="text-[13px] font-semibold text-ink-800 truncate">
              {unit.name}
            </span>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={copyCode}
              title="Copy unit code to share"
              className="inline-flex items-center gap-2 pl-3 pr-2.5 py-2 rounded-full bg-white/70 border border-cream-200 shadow-soft backdrop-blur-sm hover:border-forest-600/40 transition-colors"
            >
              <span className="font-serif tracking-[0.18em] text-sm text-ink-900">
                {unit.code}
              </span>
              {copied ? (
                <Check className="w-3.5 h-3.5 text-forest-600" />
              ) : (
                <Copy className="w-3.5 h-3.5 text-ink-500" />
              )}
            </button>
            <button
              onClick={switchUnit}
              title="Switch unit"
              className="w-9 h-9 rounded-full bg-white/70 border border-cream-200 shadow-soft backdrop-blur-sm text-ink-500 hover:text-ink-900 flex items-center justify-center transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
        <h1 className="font-serif text-[2.6rem] leading-[1.05] lg:text-6xl lg:leading-[1.02] text-ink-900 tracking-[-0.02em]">
          Split fair.{" "}
          <span className="italic text-gradient-forest">By the day.</span>
        </h1>
        <p className="text-ink-500 mt-4 max-w-xl text-[15px] leading-relaxed">
          Track electricity &amp; water bills. Splits are calculated by
          person-days — whoever stayed more, pays more.
        </p>
      </header>

      {error && (
        <div className="relative max-w-6xl mx-auto px-6 lg:px-10 mb-6 animate-fade-up">
          <div className="bg-amber-tint/40 border border-amber-mid/30 rounded-2xl p-4 text-sm text-ink-800 shadow-soft">
            {error}
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="w-5 h-5 animate-spin text-forest-600" />
        </div>
      ) : (
        <div className="relative max-w-6xl mx-auto px-6 lg:px-10 pb-24 grid lg:grid-cols-[1fr_1.1fr] gap-6">
          {/* Left: settings + form */}
          <div className="min-w-0 space-y-6 animate-fade-up" style={{ animationDelay: "80ms" }}>
            <RoommateSettings roommates={roommates} unitId={unit.id} onChange={load} />
            <NewBillForm roommates={roommates} unitId={unit.id} onCreated={load} />
          </div>

          {/* Right: history */}
          <div className="min-w-0 animate-fade-up" style={{ animationDelay: "160ms" }}>
            <div className="flex items-center justify-between gap-3 mb-4">
              <div className="flex items-baseline gap-2 min-w-0">
                <h2 className="font-serif text-2xl text-ink-900">History</h2>
                {bills.length > 0 && (
                  <span className="text-xs text-ink-500 tnum">
                    {bills.length} {bills.length === 1 ? "bill" : "bills"}
                  </span>
                )}
              </div>
              {bills.length > 0 && (
                <button
                  onClick={() => setShowSummary(true)}
                  className="flex-shrink-0 inline-flex items-center gap-1.5 text-xs font-semibold text-forest-700 bg-white border border-cream-200 shadow-soft hover:border-forest-600/40 hover:shadow-card px-3 py-2 rounded-full transition-all"
                >
                  <CalendarRange className="w-3.5 h-3.5" /> Summary
                </button>
              )}
            </div>
            <BillHistory bills={bills} onSelect={setSelectedBill} />
          </div>
        </div>
      )}

      {selectedBill && (
        <BillDetailModal
          bill={selectedBill}
          onClose={() => setSelectedBill(null)}
          onDeleted={() => {
            setSelectedBill(null);
            load();
          }}
        />
      )}

      {showSummary && (
        <SummaryReport bills={bills} onClose={() => setShowSummary(false)} />
      )}

      <footer className="relative text-center py-10 text-xs text-ink-400">
        <span className="inline-flex items-center gap-2">
          <span className="h-px w-8 bg-cream-200" />
          Made for roommates · by{" "}
          <span className="font-serif italic text-ink-700">Eman</span>
          <span className="h-px w-8 bg-cream-200" />
        </span>
      </footer>
    </main>
  );
}
