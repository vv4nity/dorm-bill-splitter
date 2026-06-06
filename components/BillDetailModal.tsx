"use client";

import { useRef, useState } from "react";
import { X, Zap, Droplets, Copy, Check, Download, Trash2 } from "lucide-react";
import { toPng } from "html-to-image";
import type { Bill } from "@/lib/types";
import { formatPHP, formatDateRange } from "@/lib/format";
import { deleteBill } from "@/lib/supabase";

interface Props {
  bill: Bill;
  onClose: () => void;
  onDeleted: () => void;
}

export default function BillDetailModal({ bill, onClose, onDeleted }: Props) {
  const [copied, setCopied] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const isElec = bill.type === "electricity";
  const Icon = isElec ? Zap : Droplets;

  const entries = [...(bill.entries ?? [])].sort((a, b) => b.days_stayed - a.days_stayed);
  const totalDays = entries.reduce((s, e) => s + e.days_stayed, 0);

  function buildPlainText(): string {
    const header = `${bill.type.toUpperCase()} BILL — ${formatDateRange(
      bill.period_start,
      bill.period_end
    )}`;
    const total = `Total: ${formatPHP(bill.total_amount)} (${totalDays} person-days)`;
    const lines = entries.map(
      (e) =>
        `• ${e.roommate_name} — ${e.days_stayed} day${
          e.days_stayed === 1 ? "" : "s"
        }: ${formatPHP(e.amount_owed)}`
    );
    const notes = bill.notes ? `\nNotes: ${bill.notes}` : "";
    return [header, total, "", ...lines, notes].filter(Boolean).join("\n");
  }

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(buildPlainText());
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      alert("Could not copy. Try selecting the text manually.");
    }
  }

  async function handleDownload() {
    if (!cardRef.current) return;
    try {
      const dataUrl = await toPng(cardRef.current, {
        backgroundColor: "#FBF8F2",
        pixelRatio: 2,
      });
      const link = document.createElement("a");
      link.download = `${bill.type}-${bill.period_end}.png`;
      link.href = dataUrl;
      link.click();
    } catch (e) {
      console.error(e);
      alert("Could not generate image.");
    }
  }

  async function handleDelete() {
    if (!confirm("Delete this bill? This cannot be undone.")) return;
    try {
      await deleteBill(bill.id);
      onDeleted();
    } catch {
      alert("Could not delete.");
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-ink-900/50 backdrop-blur-md animate-fade-in"
      onClick={onClose}
    >
      <div
        className="bg-cream-50 rounded-t-3xl sm:rounded-3xl shadow-float w-full sm:max-w-md max-h-[92vh] overflow-y-auto animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Toolbar */}
        <div className="sticky top-0 bg-cream-50/95 backdrop-blur px-5 py-3 flex items-center justify-between border-b border-cream-200">
          <span className="text-xs uppercase tracking-widest text-ink-500 font-medium">
            Bill detail
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={handleCopy}
              className="p-2 rounded-lg hover:bg-cream-100 text-ink-700"
              aria-label="Copy summary"
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
              className="p-2 rounded-lg hover:bg-cream-100 text-ink-700"
              aria-label="Download as image"
              title="Download as image"
            >
              <Download className="w-4 h-4" />
            </button>
            <button
              onClick={handleDelete}
              className="p-2 rounded-lg hover:bg-red-50 text-red-600"
              aria-label="Delete bill"
              title="Delete bill"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-cream-100 text-ink-700"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Shareable card */}
        <div ref={cardRef} className="p-6">
          <div className="relative bg-white rounded-2xl shadow-card border border-cream-200 p-6 overflow-hidden">
            <span
              className={`absolute inset-x-0 top-0 h-1 ${
                isElec ? "bg-amber-grad" : "bg-ocean-grad"
              }`}
            />
            <div className="flex items-center gap-3 mb-1">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-inner-light ${
                  isElec ? "bg-amber-grad text-amber-mid" : "bg-ocean-grad text-ocean-mid"
                }`}
              >
                <Icon className="w-5 h-5" />
              </div>
              <div>
                <h2 className="font-serif text-2xl text-ink-900 capitalize leading-tight">
                  {bill.type}
                </h2>
                <p className="text-xs text-ink-500">
                  {formatDateRange(bill.period_start, bill.period_end)}
                </p>
              </div>
            </div>

            <div className="mt-5 pb-5 border-b border-cream-200">
              <div className="text-xs uppercase tracking-widest text-ink-500 mb-1">
                Total bill
              </div>
              <div className="font-serif text-4xl text-ink-900 tnum">
                {formatPHP(bill.total_amount)}
              </div>
              <div className="text-xs text-ink-500 mt-1">
                Split across {totalDays} person-days
                {bill.shared_pct
                  ? ` · ${bill.shared_pct}% shared base (split equally)`
                  : ""}
              </div>
            </div>

            <div className="mt-5 space-y-3">
              {entries.map((e) => {
                // Cost share (with a shared base this differs from day-share).
                const pct =
                  bill.total_amount > 0
                    ? (e.amount_owed / bill.total_amount) * 100
                    : 0;
                return (
                  <div key={e.id}>
                    <div className="flex items-baseline justify-between mb-1">
                      <span className="text-sm font-medium text-ink-900">
                        {e.roommate_name}
                      </span>
                      <span
                        className={`font-serif text-lg tnum ${
                          isElec ? "text-amber-mid" : "text-ocean-mid"
                        }`}
                      >
                        {formatPHP(e.amount_owed)}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-ink-500">
                      <span>
                        {e.days_stayed} {e.days_stayed === 1 ? "day" : "days"}
                      </span>
                      <span className="flex-1 h-1 bg-cream-100 rounded-full overflow-hidden">
                        <span
                          className={`block h-full rounded-full ${
                            isElec ? "bg-amber-mid/60" : "bg-ocean-mid/60"
                          }`}
                          style={{ width: `${pct}%` }}
                        />
                      </span>
                      <span>{pct.toFixed(1)}%</span>
                    </div>
                  </div>
                );
              })}
            </div>

            {bill.notes && (
              <div className="mt-5 pt-4 border-t border-cream-200">
                <div className="text-xs uppercase tracking-widest text-ink-500 mb-1">
                  Notes
                </div>
                <p className="text-sm text-ink-700">{bill.notes}</p>
              </div>
            )}

            <p className="mt-6 text-[10px] text-ink-400 text-center">
              Dorm Bill Splitter · person-days method
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
