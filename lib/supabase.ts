import { createClient } from "@supabase/supabase-js";
import type { Bill, BillEntry, NewBillInput, Roommate, Unit } from "./types";
import { generateCode } from "./unit";
import { splitAmounts } from "./format";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// ----- Units -----

export async function createUnit(name: string): Promise<Unit> {
  // Retry a few times in case a generated code collides with an existing one.
  for (let attempt = 0; attempt < 5; attempt++) {
    const code = generateCode();
    const { data, error } = await supabase
      .from("units")
      .insert({ name, code })
      .select()
      .single();
    if (!error) return data as Unit;
    if ((error as { code?: string }).code !== "23505") throw error; // not a unique violation
  }
  throw new Error("Could not generate a unique unit code. Please try again.");
}

export async function getUnitByCode(code: string): Promise<Unit | null> {
  const { data, error } = await supabase
    .from("units")
    .select("*")
    .eq("code", code.trim().toUpperCase())
    .maybeSingle();
  if (error) throw error;
  return (data as Unit) ?? null;
}

// ----- Roommates -----

export async function getRoommates(unitId: string): Promise<Roommate[]> {
  const { data, error } = await supabase
    .from("roommates")
    .select("*")
    .eq("unit_id", unitId)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function upsertRoommate(
  id: string | null,
  name: string,
  unitId: string
): Promise<Roommate> {
  if (id) {
    const { data, error } = await supabase
      .from("roommates")
      .update({ name })
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;
    return data;
  } else {
    const { data, error } = await supabase
      .from("roommates")
      .insert({ name, unit_id: unitId })
      .select()
      .single();
    if (error) throw error;
    return data;
  }
}

export async function deleteRoommate(id: string): Promise<void> {
  const { error } = await supabase.from("roommates").delete().eq("id", id);
  if (error) throw error;
}

// ----- Bills -----

export async function getBills(unitId: string): Promise<Bill[]> {
  const { data, error } = await supabase
    .from("bills")
    .select("*, entries:bill_entries(*)")
    .eq("unit_id", unitId)
    .order("period_end", { ascending: false });
  if (error) throw error;
  return (data ?? []) as Bill[];
}

export async function getBill(id: string): Promise<Bill | null> {
  const { data, error } = await supabase
    .from("bills")
    .select("*, entries:bill_entries(*)")
    .eq("id", id)
    .single();
  if (error) return null;
  return data as Bill;
}

export async function createBill(input: NewBillInput, unitId: string): Promise<Bill> {
  const sharedPct = input.shared_pct ?? 0;

  // Insert bill
  const { data: bill, error: billErr } = await supabase
    .from("bills")
    .insert({
      type: input.type,
      total_amount: input.total_amount,
      period_start: input.period_start,
      period_end: input.period_end,
      notes: input.notes || null,
      shared_pct: sharedPct,
      unit_id: unitId,
    })
    .select()
    .single();
  if (billErr) throw billErr;

  // Calculate and insert entries (shared base split equally + usage by days)
  const owed = splitAmounts(
    input.total_amount,
    sharedPct,
    input.entries.map((e) => e.days_stayed)
  );
  const entries: Omit<BillEntry, "id">[] = input.entries.map((e, i) => ({
    bill_id: bill.id,
    roommate_id: e.roommate_id,
    roommate_name: e.roommate_name,
    days_stayed: e.days_stayed,
    amount_owed: owed[i],
  }));

  const { data: insertedEntries, error: entryErr } = await supabase
    .from("bill_entries")
    .insert(entries)
    .select();
  if (entryErr) throw entryErr;

  return { ...bill, entries: insertedEntries } as Bill;
}

export async function deleteBill(id: string): Promise<void> {
  const { error } = await supabase.from("bills").delete().eq("id", id);
  if (error) throw error;
}
