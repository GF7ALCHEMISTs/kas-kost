-- Fitur: admin bisa tambah/kurangin saldo kas secara manual (koreksi,
-- sumbangan, dana ketinggalan, dsb) di luar mekanisme tagihan & pengeluaran
-- biasa.

create table manual_adjustments (
  id uuid primary key default uuid_generate_v4(),
  period_id uuid not null references periods(id) on delete cascade,
  type text not null check (type in ('tambah', 'kurang')),
  amount numeric(12, 2) not null check (amount > 0),
  note text not null,
  created_by uuid not null references profiles(id),
  created_at timestamptz not null default now()
);

alter table manual_adjustments enable row level security;

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

-- Update view: tambah agregat manual_adjustments SEBAGAI SUBQUERY TERPISAH
-- (bukan langsung di-JOIN ke periods), supaya tidak mengulang bug Cartesian
-- product yang pernah terjadi di migration 008.
drop view if exists period_balances;

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
