"use client";

import { Zap, Droplets, ChevronRight, Receipt } from "lucide-react";
import type { Bill } from "@/lib/types";
import { formatPHP, formatDateRange } from "@/lib/format";

interface Props {
  bills: Bill[];
  onSelect: (bill: Bill) => void;
}

export default function BillHistory({ bills, onSelect }: Props) {
  if (bills.length === 0) {
    return (
      <div className="relative bg-white rounded-2xl shadow-card border border-cream-200 p-12 text-center overflow-hidden">
        <span className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cream-200 to-transparent" />
        <div className="w-12 h-12 rounded-2xl bg-cream-100 flex items-center justify-center mx-auto mb-4">
          <Receipt className="w-5 h-5 text-ink-400" />
        </div>
        <p className="text-ink-700 text-sm font-medium">No bills yet</p>
        <p className="text-ink-500 text-sm mt-1">
          Create your first split on the left.
        </p>
      </div>
    );
  }

  // Group by period_end month/year for nicer browsing
  const grouped = bills.reduce<Record<string, Bill[]>>((acc, b) => {
    const d = new Date(b.period_end);
    const key = new Intl.DateTimeFormat("en-PH", {
      month: "long",
      year: "numeric",
    }).format(d);
    (acc[key] = acc[key] || []).push(b);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      {Object.entries(grouped).map(([month, monthBills]) => (
        <div key={month}>
          <h3 className="text-xs uppercase tracking-widest text-ink-500 mb-3 font-medium">
            {month}
          </h3>
          <div className="space-y-2">
            {monthBills.map((bill) => (
              <BillCard key={bill.id} bill={bill} onClick={() => onSelect(bill)} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function BillCard({ bill, onClick }: { bill: Bill; onClick: () => void }) {
  const isElec = bill.type === "electricity";
  const Icon = isElec ? Zap : Droplets;

  return (
    <button
      onClick={onClick}
      className="w-full text-left bg-white rounded-2xl shadow-soft hover:shadow-elevated border border-cream-200 hover:border-cream-200/60 transition-all duration-300 p-4 group hover:-translate-y-0.5"
    >
      <div className="flex items-center gap-4">
        <div
          className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 shadow-inner-light transition-transform duration-300 group-hover:scale-105 ${
            isElec ? "bg-amber-grad text-amber-mid" : "bg-ocean-grad text-ocean-mid"
          }`}
        >
          <Icon className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-2 mb-0.5">
            <span className="font-semibold text-ink-900 capitalize">{bill.type}</span>
            <span className="text-xs text-ink-500 truncate">
              {formatDateRange(bill.period_start, bill.period_end)}
            </span>
          </div>
          {bill.notes && (
            <p className="text-xs text-ink-500 truncate">{bill.notes}</p>
          )}
        </div>
        <div className="text-right">
          <div className="font-serif text-lg text-ink-900 tnum">
            {formatPHP(bill.total_amount)}
          </div>
          <div className="text-xs text-ink-500">
            {bill.entries?.length ?? 0} {bill.entries?.length === 1 ? "person" : "people"}
          </div>
        </div>
        <ChevronRight className="w-4 h-4 text-ink-400 group-hover:text-forest-600 group-hover:translate-x-0.5 transition-all" />
      </div>
    </button>
  );
}
