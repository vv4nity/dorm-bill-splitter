"use client";

import { useState } from "react";
import { Receipt, Loader2, ArrowRight, KeyRound, Sparkles } from "lucide-react";
import type { Unit } from "@/lib/types";
import { createUnit, getUnitByCode } from "@/lib/supabase";
import { storeUnit } from "@/lib/unit";

interface Props {
  onReady: (unit: Unit) => void;
}

export default function UnitGate({ onReady }: Props) {
  const [mode, setMode] = useState<"join" | "create">("join");
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function finish(unit: Unit) {
    storeUnit(unit);
    onReady(unit);
  }

  async function handleJoin() {
    const c = code.trim().toUpperCase();
    if (c.length < 4) {
      setError("Enter your full unit code.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const unit = await getUnitByCode(c);
      if (!unit) {
        setError("No unit found with that code. Check the spelling.");
        return;
      }
      finish(unit);
    } catch (e) {
      console.error(e);
      setError("Could not connect. Check your Supabase setup.");
    } finally {
      setBusy(false);
    }
  }

  async function handleCreate() {
    const n = name.trim();
    if (!n) {
      setError("Give your unit a name.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const unit = await createUnit(n);
      finish(unit);
    } catch (e) {
      console.error(e);
      setError("Could not create the unit. Check your Supabase setup.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="relative min-h-screen flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-md animate-scale-in">
        {/* Brand */}
        <div className="text-center mb-8">
          <span className="inline-flex w-12 h-12 rounded-2xl bg-ink-grad text-cream-50 items-center justify-center shadow-glow shadow-inner-light mb-4">
            <Receipt className="w-5 h-5" />
          </span>
          <h1 className="font-serif text-3xl text-ink-900 tracking-[-0.02em]">
            Your dorm unit
          </h1>
          <p className="text-ink-500 text-sm mt-2 max-w-xs mx-auto leading-relaxed">
            Join your unit with its code, or create a new one and share the code
            with your roommates.
          </p>
        </div>

        {/* Card */}
        <div className="relative bg-white rounded-3xl shadow-elevated border border-cream-200 p-6 overflow-hidden">
          <span className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-forest-600/40 to-transparent" />

          {/* Mode toggle */}
          <div className="grid grid-cols-2 gap-1.5 p-1.5 bg-cream-100 rounded-2xl mb-6 ring-1 ring-inset ring-cream-200">
            <button
              onClick={() => {
                setMode("join");
                setError(null);
              }}
              className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-sm font-semibold transition-all duration-200 ${
                mode === "join"
                  ? "bg-white text-forest-700 shadow-card"
                  : "text-ink-500 hover:text-ink-800"
              }`}
            >
              <KeyRound className="w-4 h-4" /> Join
            </button>
            <button
              onClick={() => {
                setMode("create");
                setError(null);
              }}
              className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-sm font-semibold transition-all duration-200 ${
                mode === "create"
                  ? "bg-white text-forest-700 shadow-card"
                  : "text-ink-500 hover:text-ink-800"
              }`}
            >
              <Sparkles className="w-4 h-4" /> Create
            </button>
          </div>

          {mode === "join" ? (
            <div>
              <label className="block">
                <span className="text-xs uppercase tracking-wider text-ink-500 font-medium">
                  Unit code
                </span>
                <input
                  autoFocus
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  onKeyDown={(e) => e.key === "Enter" && handleJoin()}
                  placeholder="e.g. K7P2QX"
                  maxLength={8}
                  className="mt-1.5 w-full text-center font-serif text-2xl tracking-[0.3em] uppercase border-b-2 border-ink-900 pb-2 bg-transparent outline-none placeholder:text-ink-400 placeholder:tracking-normal placeholder:text-lg focus:border-forest-600 transition-colors"
                />
              </label>
            </div>
          ) : (
            <div>
              <label className="block">
                <span className="text-xs uppercase tracking-wider text-ink-500 font-medium">
                  Unit name
                </span>
                <input
                  autoFocus
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleCreate()}
                  placeholder="e.g. Unit 4B · Katipunan"
                  maxLength={60}
                  className="mt-1.5 w-full text-sm border border-cream-200 rounded-xl px-3 py-2.5 bg-cream-50 focus:bg-white focus:border-forest-600/40 outline-none transition-colors"
                />
              </label>
              <p className="text-xs text-ink-500 mt-2 leading-relaxed">
                You&apos;ll get a short code to share with your roommates so you
                all see the same bills.
              </p>
            </div>
          )}

          {error && (
            <div className="mt-4 bg-amber-tint/40 border border-amber-mid/30 rounded-xl px-3 py-2.5 text-xs text-ink-800">
              {error}
            </div>
          )}

          <button
            onClick={mode === "join" ? handleJoin : handleCreate}
            disabled={busy}
            className="sheen-on-hover mt-5 w-full flex items-center justify-center gap-2 bg-ink-grad hover:shadow-glow disabled:opacity-40 disabled:cursor-not-allowed text-cream-50 font-semibold py-3.5 rounded-2xl transition-all duration-300 active:scale-[0.99] shadow-card"
          >
            {busy ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                {mode === "join" ? "Joining…" : "Creating…"}
              </>
            ) : (
              <>
                {mode === "join" ? "Enter unit" : "Create unit"}
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>

        <p className="text-center text-xs text-ink-400 mt-6">
          Made for roommates · by{" "}
          <span className="font-serif italic text-ink-700">Eman</span>
        </p>
      </div>
    </main>
  );
}
