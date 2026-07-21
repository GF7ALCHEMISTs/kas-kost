-- =========================================================
-- REDESAIN "DI LUAR KAS": dari model splitwise (siapa bayar
-- duluan, orang lain hutang balik ke dia) menjadi model KAS
-- TERPUSAT: total dibagi rata, semua transfer ke SATU rekening
-- yang sama, tanpa approval admin (transparan, trust-based).
-- =========================================================

-- Hapus mekanisme lama yang tidak dipakai lagi (splitwise-style)
drop policy if exists "member_insert_splits" on shared_expense_splits;
drop table if exists shared_expense_splits;

drop policy if exists "read_all_authenticated_settlements" on settlements;
drop policy if exists "member_insert_settlement" on settlements;
drop table if exists settlements;

-- Info rekening tujuan (opsional), ditampilkan supaya semua orang transfer ke tempat yang sama
alter table shared_sessions add column target_account_info text;

-- ---------- SESSION DUES (tagihan rata per orang, dihitung SAAT sesi ditutup) ----------
create table session_dues (
  id uuid primary key default uuid_generate_v4(),
  session_id uuid not null references shared_sessions(id) on delete cascade,
  user_id uuid not null references profiles(id),
  amount_due numeric(12,2) not null,
  status text not null default 'unpaid' check (status in ('unpaid','paid')),
  proof_path text,
  paid_at timestamptz,
  note text,
  created_at timestamptz not null default now(),
  unique (session_id, user_id)
);

alter table session_dues enable row level security;

-- Transparan penuh: begitu bukti diupload, semua langsung bisa lihat, TIDAK ada status
-- "menunggu konfirmasi admin" -> begitu di-upload, status langsung 'paid'.
create policy "read_all_authenticated_session_dues" on session_dues
  for select using (auth.role() = 'authenticated');

-- Orang hanya boleh upload bukti untuk tagihannya SENDIRI, langsung jadi 'paid' tanpa approval.
create policy "member_pay_own_session_due" on session_dues
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Tidak ada policy INSERT untuk user biasa -> baris session_dues HANYA bisa dibuat
-- lewat function close_shared_session() di bawah (security definer), supaya tidak ada
-- yang bisa bikin tagihan palsu.

-- =========================================================
-- FUNCTION: tutup sesi + hitung split rata (rounding-safe) sekaligus, atomic
-- =========================================================
create or replace function close_shared_session(p_session_id uuid, p_closer_id uuid)
returns void
language plpgsql
security definer
as $$
declare
  v_total numeric(12,2);
  v_n int;
  v_base numeric(12,2);
  v_remainder int;
begin
  -- Lock baris sesi supaya aman dari dobel klik / race condition
  perform 1 from shared_sessions where id = p_session_id and status = 'open' for update;
  if not found then
    raise exception 'Sesi tidak ditemukan atau sudah ditutup';
  end if;

  select coalesce(sum(amount), 0) into v_total
  from shared_expenses
  where session_id = p_session_id and status = 'active';

  select count(*) into v_n
  from profiles
  where is_active = true and role in ('admin','member');

  if v_n = 0 then
    raise exception 'Tidak ada penghuni aktif untuk membagi patungan';
  end if;

  update shared_sessions
  set status = 'closed', closed_at = now(), closed_by = p_closer_id
  where id = p_session_id;

  v_base := floor(v_total / v_n);
  v_remainder := round(v_total - v_base * v_n); -- sisa rupiah, dibagi 1-1 ke beberapa orang duluan

  insert into session_dues (session_id, user_id, amount_due)
  select
    p_session_id,
    p.id,
    v_base + case when row_number() over (order by p.id) <= v_remainder then 1 else 0 end
  from profiles p
  where p.is_active = true and p.role in ('admin','member')
  on conflict (session_id, user_id) do nothing;
end;
$$;
