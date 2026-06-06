-- Dorm Bill Splitter — Supabase schema
-- Run this entire file in: Supabase Dashboard → SQL Editor → New query → Run
-- Safe to re-run: every statement is idempotent.

-- 1. Tables -------------------------------------------------------------

create table if not exists units (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  code text not null unique,
  created_at timestamptz not null default now()
);

create table if not exists roommates (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now()
);

create table if not exists bills (
  id uuid primary key default gen_random_uuid(),
  type text not null check (type in ('electricity', 'water')),
  total_amount numeric(12, 2) not null,
  period_start date not null,
  period_end date not null,
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists bill_entries (
  id uuid primary key default gen_random_uuid(),
  bill_id uuid not null references bills(id) on delete cascade,
  roommate_id uuid references roommates(id) on delete set null,
  roommate_name text not null,
  days_stayed integer not null check (days_stayed >= 0),
  amount_owed numeric(12, 2) not null,
  created_at timestamptz not null default now()
);

-- Scope roommates & bills to a unit (added here so existing installs upgrade cleanly)
alter table roommates add column if not exists unit_id uuid references units(id) on delete cascade;
alter table bills add column if not exists unit_id uuid references units(id) on delete cascade;

-- Fairness: percentage of a bill treated as an equally-shared base (e.g. fridge,
-- wifi, standby load). Split equally among everyone; the rest goes by person-days.
alter table bills add column if not exists shared_pct numeric(5, 2) not null default 0;

-- Fairness: peso fee per absent day, charged to whoever was away (electricity).
-- Redistributes cost onto absentees; the bill total is unchanged.
alter table bills add column if not exists per_absent_day numeric(10, 2) not null default 0;

create index if not exists bill_entries_bill_id_idx on bill_entries(bill_id);
create index if not exists bills_period_end_idx on bills(period_end desc);
create index if not exists roommates_unit_id_idx on roommates(unit_id);
create index if not exists bills_unit_id_idx on bills(unit_id);

-- 2. Row Level Security -------------------------------------------------
-- This app has no login. RLS is enabled with permissive policies so the
-- anon key can read/write. Per-unit isolation is enforced in the app by
-- filtering on unit_id. If you ever add real auth, replace these policies.

alter table units enable row level security;
alter table roommates enable row level security;
alter table bills enable row level security;
alter table bill_entries enable row level security;

drop policy if exists "anon all" on units;
drop policy if exists "anon all" on roommates;
drop policy if exists "anon all" on bills;
drop policy if exists "anon all" on bill_entries;

create policy "anon all" on units for all using (true) with check (true);
create policy "anon all" on roommates for all using (true) with check (true);
create policy "anon all" on bills for all using (true) with check (true);
create policy "anon all" on bill_entries for all using (true) with check (true);
