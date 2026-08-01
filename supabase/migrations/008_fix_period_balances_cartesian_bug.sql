-- Fix bug: view period_balances lama JOIN period_dues dan expenses langsung
-- ke periods tanpa agregasi dulu -> Cartesian product antara baris tagihan
-- dan baris pengeluaran, bikin total_masuk & total_keluar dikali-kali
-- (contoh nyata: 2 tagihan confirmed x 2 baris pengeluaran = tagihan
-- ke-hitung 2x jadi dobel, begitu juga sebaliknya).
--
-- Fix: agregasi period_dues dan expenses masing-masing per period_id DULU
-- (subquery), baru di-join ke periods. Dengan begitu masing-masing subquery
-- cuma punya 1 baris per periode, jadi tidak ada perkalian silang.

drop view if exists period_balances;

create view period_balances as
select
  p.id as period_id,
  p.year,
  p.month,
  coalesce(pd_agg.total_masuk, 0) as total_masuk,
  coalesce(e_agg.total_keluar, 0) as total_keluar,
  sum(
    coalesce(pd_agg.total_masuk, 0) - coalesce(e_agg.total_keluar, 0)
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
order by p.year, p.month;
