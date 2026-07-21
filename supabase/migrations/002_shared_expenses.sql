-- =========================================================
-- FITUR: "DI LUAR KAS" - patungan pengeluaran non-rutin
-- (misal: isi-isi rumah sebelum mulai kos)
-- Sengaja terpisah total dari periods/period_dues/expenses,
-- supaya tidak mengotori perhitungan saldo kas bulanan.
-- =========================================================

-- ---------- SHARED EXPENSES (barang/pengeluaran patungan) ----------
create table shared_expenses (
  id uuid primary key default uuid_generate_v4(),
  title text not null,               -- misal "Kulkas 2 pintu"
  amount numeric(12,2) not null check (amount > 0),
  paid_by uuid not null references profiles(id),
  expense_date date not null default current_date,
  proof_path text,
  notes text,
  status expense_status not null default 'active', -- reuse enum active/void, soft-delete only
  void_reason text,
  created_by uuid not null references profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------- SPLITS (porsi tiap orang, disimpan eksplisit saat dibuat) ----------
-- Disimpan eksplisit (bukan dihitung ulang dari jumlah penghuni saat ini),
-- supaya kalau nanti ada penghuni baru/keluar, catatan lama tidak berubah retroaktif.
create table shared_expense_splits (
  id uuid primary key default uuid_generate_v4(),
  item_id uuid not null references shared_expenses(id) on delete cascade,
  user_id uuid not null references profiles(id),
  share_amount numeric(12,2) not null,
  unique (item_id, user_id)
);

-- ---------- SETTLEMENTS (pelunasan antar penghuni, transfer langsung) ----------
create table settlements (
  id uuid primary key default uuid_generate_v4(),
  from_user uuid not null references profiles(id), -- yang melunasi/transfer
  to_user uuid not null references profiles(id),   -- yang menerima
  amount numeric(12,2) not null check (amount > 0),
  note text,
  proof_path text,
  created_by uuid not null references profiles(id),
  created_at timestamptz not null default now(),
  constraint no_self_settlement check (from_user <> to_user)
);

alter table shared_expenses enable row level security;
alter table shared_expense_splits enable row level security;
alter table settlements enable row level security;

-- Transparan ke semua penghuni yang login, sama seperti kas bulanan
create policy "read_all_authenticated_shared_expenses" on shared_expenses
  for select using (auth.role() = 'authenticated');
create policy "read_all_authenticated_splits" on shared_expense_splits
  for select using (auth.role() = 'authenticated');
create policy "read_all_authenticated_settlements" on settlements
  for select using (auth.role() = 'authenticated');

-- Parent tidak diberi policy write -> otomatis read-only, konsisten dengan kas bulanan

create policy "member_insert_shared_expense" on shared_expenses
  for insert with check (
    exists (select 1 from profiles where id = auth.uid() and role in ('admin','member'))
    and created_by = auth.uid()
  );

create policy "creator_or_admin_update_shared_expense" on shared_expenses
  for update using (
    created_by = auth.uid()
    or exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );

create policy "member_insert_splits" on shared_expense_splits
  for insert with check (auth.role() = 'authenticated');

create policy "member_insert_settlement" on settlements
  for insert with check (
    exists (select 1 from profiles where id = auth.uid() and role in ('admin','member'))
    and created_by = auth.uid()
  );

-- CATATAN: Perhitungan "siapa hutang ke siapa" (net balance) dihitung di sisi
-- aplikasi (TypeScript), bukan SQL view, karena datasetnya kecil (3 penghuni)
-- dan lebih mudah dibaca/diverifikasi sebagai kode biasa daripada SQL kompleks.
