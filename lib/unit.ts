import type { Unit } from "./types";

const KEY = "billsplitter.unit";

export function getStoredUnit(): Unit | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Unit) : null;
  } catch {
    return null;
  }
}

export function storeUnit(unit: Unit): void {
  localStorage.setItem(KEY, JSON.stringify(unit));
}

export function clearStoredUnit(): void {
  localStorage.removeItem(KEY);
}

// Readable code: no ambiguous characters (no 0/O, 1/I/L)
const ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

export function generateCode(len = 6): string {
  const arr = new Uint32Array(len);
  crypto.getRandomValues(arr);
  let out = "";
  for (let i = 0; i < len; i++) out += ALPHABET[arr[i] % ALPHABET.length];
  return out;
}
