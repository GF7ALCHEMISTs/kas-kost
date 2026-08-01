-- =========================================================
-- KAS KOST - DATABASE SCHEMA (Supabase Postgres)
-- =========================================================

create extension if not exists "uuid-ossp";

-- ---------- ENUMS ----------
create type user_role as enum ('admin', 'member', 'parent');
create type period_status as enum ('open', 'closed');
create type due_status as enum ('unpaid', 'pending_confirmation', 'confirmed');
create type expense_status as enum ('active', 'void');
create type audit_action as enum ('insert', 'update', 'void', 'confirm', 'edit');

-- ---------- PROFILES ----------
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  phone text,
  role user_role not null default 'member',
  is_active boolean not null default true,
  joined_at date not null default current_date,
  left_at date,
  created_at timestamptz not null default now()
);

-- ---------- PERIODS ----------
create table periods (
  id uuid primary key default uuid_generate_v4(),
  year int not null,
  month int not null check (month between 1 and 12),
  default_due_amount numeric(12,2) not null default 1000000,
  due_date date, -- e.g. tanggal 5 tiap bulan
  status period_status not null default 'open',
  closed_at timestamptz,
  closed_by uuid references profiles(id),
  created_at timestamptz not null default now(),
  unique (year, month)
);

-- ---------- PERIOD DUES (tagihan per penghuni per bulan) ----------
create table period_dues (
  id uuid primary key default uuid_generate_v4(),
  period_id uuid not null references periods(id) on delete cascade,
  user_id uuid not null references profiles(id),
  amount_due numeric(12,2) not null,
  status due_status not null default 'unpaid',
  proof_path text, -- path in Supabase Storage (private bucket), not public URL
  paid_at timestamptz,
  confirmed_by uuid references profiles(id),
  confirmed_at timestamptz,
  note text,
  created_at timestamptz not null default now(),
  unique (period_id, user_id),
  constraint no_self_confirm check (confirmed_by is null or confirmed_by <> user_id)
);

-- ---------- EXPENSE CATEGORIES ----------
create table expense_categories (
  id uuid primary key default uuid_generate_v4(),
  name text not null unique,
  icon text
);

insert into expense_categories (name, icon) values
  ('Listrik', 'zap'),
  ('Wifi', 'wifi'),
  ('Air', 'droplet'),
  ('Perbaikan Rumah', 'wrench'),
  ('Kebutuhan Lainnya', 'shopping-bag');

-- ---------- EXPENSES ----------
create table expenses (
  id uuid primary key default uuid_generate_v4(),
  period_id uuid not null references periods(id) on delete cascade,
  category_id uuid not null references expense_categories(id),
  amount numeric(12,2) not null check (amount > 0),
  expense_date date not null default current_date,
  paid_by uuid references profiles(id),
  description text not null,
  proof_path text,
  status expense_status not null default 'active',
  void_reason text,
  created_by uuid not null references profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------- AUDIT LOGS ----------
create table audit_logs (
  id uuid primary key default uuid_generate_v4(),
  table_name text not null,
  record_id uuid not null,
  action audit_action not null,
  old_data jsonb,
  new_data jsonb,
  edit_reason text,
  performed_by uuid not null references profiles(id),
  performed_at timestamptz not null default now()
);

-- ---------- REMINDERS LOG ----------
create table reminders_log (
  id uuid primary key default uuid_generate_v4(),
  period_due_id uuid not null references period_dues(id) on delete cascade,
  reminder_tier text not null check (reminder_tier in ('h-2','h0','h+3','h+7')),
  sent_at timestamptz not null default now(),
  unique (period_due_id, reminder_tier)
);

-- ---------- MANUAL BALANCE ADJUSTMENTS ----------
-- Admin bisa tambah/kurangin saldo kas manual (koreksi, sumbangan, dsb)
-- di luar tagihan & pengeluaran biasa.
create table manual_adjustments (
  id uuid primary key default uuid_generate_v4(),
  period_id uuid not null references periods(id) on delete cascade,
  type text not null check (type in ('tambah', 'kurang')),
  amount numeric(12, 2) not null check (amount > 0),
  note text not null,
  created_by uuid not null references profiles(id),
  created_at timestamptz not null default now()
);

-- =========================================================
-- VIEW: saldo dihitung (computed), bukan disimpan manual
-- =========================================================
create view period_balances as
select
  p.id as period_id,
  p.year,
  p.month,
  coalesce(pd_agg.total_masuk, 0) as total_masuk,
  coalesce(e_agg.total_keluar, 0) as total_keluar,
  coalesce(adj_agg.total_penyesuaian, 0) as total_penyesuaian,
  sum(
    coalesce(pd_agg.total_masuk, 0)
    - coalesce(e_agg.total_keluar, 0)
    + coalesce(adj_agg.total_penyesuaian, 0)
  ) over (order by p.year, p.month) as saldo_akhir
from periods p
left join (
  select period_id, sum(amount_due) as total_masuk
  from period_dues
  where status = 'confirmed'
  group by period_id
) pd_agg on pd_agg.period_id = p.id
left join (
  select period_id, sum(amount) as total_keluar
  from expenses
  where status = 'active'
  group by period_id
) e_agg on e_agg.period_id = p.id
left join (
  select
    period_id,
    sum(case when type = 'tambah' then amount else -amount end) as total_penyesuaian
  from manual_adjustments
  group by period_id
) adj_agg on adj_agg.period_id = p.id
order by p.year, p.month;

-- =========================================================
-- FUNCTION: tutup periode (atomic, hindari race condition)
-- =========================================================
create or replace function close_period(p_period_id uuid, p_admin_id uuid)
returns uuid
language plpgsql
security definer
as $$
declare
  v_year int;
  v_month int;
  v_next_year int;
  v_next_month int;
  v_new_period_id uuid;
  v_default_amount numeric(12,2);
begin
  select year, month, default_due_amount into v_year, v_month, v_default_amount
  from periods where id = p_period_id and status = 'open'
  for update;

  if not found then
    raise exception 'Periode tidak ditemukan atau sudah ditutup';
  end if;

  update periods
  set status = 'closed', closed_at = now(), closed_by = p_admin_id
  where id = p_period_id;

  if v_month = 12 then
    v_next_year := v_year + 1;
    v_next_month := 1;
  else
    v_next_year := v_year;
    v_next_month := v_month + 1;
  end if;

  insert into periods (year, month, default_due_amount, status)
  values (v_next_year, v_next_month, v_default_amount, 'open')
  on conflict (year, month) do nothing
  returning id into v_new_period_id;

  if v_new_period_id is null then
    select id into v_new_period_id from periods where year = v_next_year and month = v_next_month;
  end if;

  insert into period_dues (period_id, user_id, amount_due)
  select v_new_period_id, id, v_default_amount
  from profiles
  where is_active = true and role in ('admin','member')
  on conflict (period_id, user_id) do nothing;

  insert into audit_logs (table_name, record_id, action, new_data, performed_by)
  values ('periods', p_period_id, 'update', jsonb_build_object('status','closed'), p_admin_id);

  return v_new_period_id;
end;
$$;

-- =========================================================
-- ROW LEVEL SECURITY
-- =========================================================
alter table profiles enable row level security;
alter table periods enable row level security;
alter table period_dues enable row level security;
alter table expenses enable row level security;
alter table expense_categories enable row level security;
alter table audit_logs enable row level security;
alter table reminders_log enable row level security;
alter table manual_adjustments enable row level security;

create policy "read_all_authenticated_profiles" on profiles for select using (auth.role() = 'authenticated');
create policy "read_all_authenticated_periods" on periods for select using (auth.role() = 'authenticated');
create policy "read_all_authenticated_dues" on period_dues for select using (auth.role() = 'authenticated');
create policy "read_all_authenticated_expenses" on expenses for select using (auth.role() = 'authenticated');
create policy "read_all_authenticated_categories" on expense_categories for select using (auth.role() = 'authenticated');
create policy "read_all_authenticated_audit" on audit_logs for select using (auth.role() = 'authenticated');

create policy "read_all_authenticated_adjustments" on manual_adjustments
  for select using (auth.role() = 'authenticated');

create policy "admin_insert_adjustment" on manual_adjustments
  for insert
  with check (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
    and created_by = auth.uid()
  );

create policy "admin_delete_adjustment" on manual_adjustments
  for delete
  using (exists (select 1 from profiles where id = auth.uid() and role = 'admin'));

-- Parent TIDAK diberi policy write apa pun -> otomatis read-only

create policy "member_upload_own_due" on period_dues for update
  using (
    auth.uid() = user_id
    and exists (select 1 from profiles where id = auth.uid() and role in ('admin','member'))
  )
  with check (auth.uid() = user_id);

create policy "admin_confirm_others_due" on period_dues for update
  using (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
    and user_id <> auth.uid()
  );

create policy "member_insert_expense" on expenses for insert
  with check (
    exists (select 1 from profiles where id = auth.uid() and role in ('admin','member'))
    and created_by = auth.uid()
  );

create policy "creator_or_admin_update_expense" on expenses for update
  using (
    created_by = auth.uid()
    or exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );

create policy "authenticated_insert_audit" on audit_logs for insert
  with check (auth.role() = 'authenticated');

create policy "admin_update_profiles" on profiles for update
  using (exists (select 1 from profiles where id = auth.uid() and role = 'admin'));

-- CATATAN: Buat bucket Storage "proofs" sebagai PRIVATE.
-- Contoh storage policy (jalankan terpisah di Supabase Storage policies):
-- create policy "authenticated_read_proofs" on storage.objects for select
--   using (bucket_id = 'proofs' and auth.role() = 'authenticated');
-- create policy "authenticated_upload_proofs" on storage.objects for insert
--   with check (bucket_id = 'proofs' and auth.role() = 'authenticated');
