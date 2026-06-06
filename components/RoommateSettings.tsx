"use client";

import { useState } from "react";
import { Users, Plus, Trash2, Check, X, Pencil } from "lucide-react";
import type { Roommate } from "@/lib/types";
import { deleteRoommate, upsertRoommate } from "@/lib/supabase";

interface Props {
  roommates: Roommate[];
  unitId: string;
  onChange: () => void;
}

export default function RoommateSettings({ roommates, unitId, onChange }: Props) {
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");

  async function handleAdd() {
    if (!newName.trim()) return;
    try {
      await upsertRoommate(null, newName.trim(), unitId);
      setNewName("");
      setAdding(false);
      onChange();
    } catch (e) {
      alert("Could not add roommate.");
    }
  }

  async function handleSaveEdit(id: string) {
    if (!editName.trim()) return;
    try {
      await upsertRoommate(id, editName.trim(), unitId);
      setEditingId(null);
      onChange();
    } catch (e) {
      alert("Could not update roommate.");
    }
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Remove ${name}? Their past bill entries will stay.`)) return;
    try {
      await deleteRoommate(id);
      onChange();
    } catch (e) {
      alert("Could not delete. They may still be referenced by a bill.");
    }
  }

  return (
    <div className="group/card relative bg-white rounded-2xl shadow-card hover:shadow-elevated border border-cream-200 p-6 transition-shadow duration-300 overflow-hidden">
      <span className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-forest-600/40 to-transparent" />
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5 text-ink-900">
          <span className="w-8 h-8 rounded-lg bg-forest-grad text-cream-50 flex items-center justify-center shadow-inner-light">
            <Users className="w-4 h-4" />
          </span>
          <h2 className="font-serif text-xl">Roommates</h2>
          <span className="text-xs text-ink-500 ml-0.5 tnum">({roommates.length})</span>
        </div>
        {!adding && (
          <button
            onClick={() => setAdding(true)}
            className="text-xs font-semibold text-forest-600 hover:text-forest-800 flex items-center gap-1 px-2.5 py-1.5 rounded-lg hover:bg-forest-600/5 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" /> Add
          </button>
        )}
      </div>

      <div className="space-y-2">
        {roommates.map((r) => (
          <div
            key={r.id}
            className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-cream-50 group"
          >
            {editingId === r.id ? (
              <>
                <input
                  className="flex-1 bg-transparent border-b border-forest-600 outline-none text-sm"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleSaveEdit(r.id);
                    if (e.key === "Escape") setEditingId(null);
                  }}
                />
                <button
                  onClick={() => handleSaveEdit(r.id)}
                  className="text-forest-600 hover:text-forest-800"
                  aria-label="Save"
                >
                  <Check className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setEditingId(null)}
                  className="text-ink-500 hover:text-ink-900"
                  aria-label="Cancel"
                >
                  <X className="w-4 h-4" />
                </button>
              </>
            ) : (
              <>
                <span className="w-7 h-7 rounded-full bg-cream-100 border border-cream-200 text-ink-700 text-xs font-semibold flex items-center justify-center flex-shrink-0">
                  {r.name.trim().charAt(0).toUpperCase()}
                </span>
                <span className="flex-1 text-sm text-ink-800">{r.name}</span>
                <button
                  onClick={() => {
                    setEditingId(r.id);
                    setEditName(r.name);
                  }}
                  className="opacity-0 group-hover:opacity-100 text-ink-500 hover:text-forest-600 transition-opacity"
                  aria-label="Edit"
                >
                  <Pencil className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => handleDelete(r.id, r.name)}
                  className="opacity-0 group-hover:opacity-100 text-ink-500 hover:text-red-600 transition-opacity"
                  aria-label="Delete"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </>
            )}
          </div>
        ))}

        {adding && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-cream-50">
            <input
              className="flex-1 bg-transparent border-b border-forest-600 outline-none text-sm"
              placeholder="Name"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter") handleAdd();
                if (e.key === "Escape") {
                  setAdding(false);
                  setNewName("");
                }
              }}
            />
            <button
              onClick={handleAdd}
              className="text-forest-600 hover:text-forest-800"
              aria-label="Save"
            >
              <Check className="w-4 h-4" />
            </button>
            <button
              onClick={() => {
                setAdding(false);
                setNewName("");
              }}
              className="text-ink-500 hover:text-ink-900"
              aria-label="Cancel"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {roommates.length === 0 && !adding && (
          <p className="text-sm text-ink-500 px-3 py-2">
            Add your roommates to start splitting bills.
          </p>
        )}
      </div>
    </div>
  );
}
