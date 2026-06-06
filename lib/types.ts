export type BillType = "electricity" | "water";

export interface Unit {
  id: string;
  name: string;
  code: string;
  created_at?: string;
}

export interface Roommate {
  id: string;
  name: string;
  unit_id?: string;
  created_at?: string;
}

export interface Bill {
  id: string;
  type: BillType;
  total_amount: number;
  period_start: string;
  period_end: string;
  notes: string | null;
  shared_pct?: number;
  per_absent_day?: number;
  unit_id?: string;
  created_at: string;
  entries?: BillEntry[];
}

export interface BillEntry {
  id: string;
  bill_id: string;
  roommate_id: string;
  roommate_name: string;
  days_stayed: number;
  amount_owed: number;
}

export interface NewBillInput {
  type: BillType;
  total_amount: number;
  period_start: string;
  period_end: string;
  notes: string;
  shared_pct: number;
  per_absent_day: number;
  entries: {
    roommate_id: string;
    roommate_name: string;
    days_stayed: number;
  }[];
}
