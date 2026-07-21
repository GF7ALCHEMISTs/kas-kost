-- =========================================================
-- REDESAIN PENUTUPAN SESI "DI LUAR KAS":
-- - Peserta patungan sekarang nama BEBAS (tidak harus penghuni
--   terdaftar/punya akun), diinput manual oleh admin.
-- - Total dibagi rata: total pengeluaran : jumlah orang yang dipilih.
-- - Ada status transisi baru 'awaiting_payment' di antara 'open' dan
--   'closed': begitu admin selesai input nama & pencet "Hitung & Buka
--   Tagihan", sesi TIDAK langsung closed. Admin masih bisa menambah
--   peserta lagi & upload bukti bayar tiap orang secara manual, sampai
--   admin sendiri pencet tombol "Sudah Bayar Semua".
-- - Bukti bayar diupload ADMIN untuk tiap peserta (bukan self-service),
--   karena peserta bisa jadi tidak punya akun di app ini.
-- =========================================================

-- Function lama otomatis bagi ke SEMUA penghuni terdaftar -> tidak dipakai lagi
drop function if exists close_shared_session(uuid, uuid);

-- ---------- status sesi: tambah state 'awaiting_payment' ----------
alter table shared_sessions drop constraint if exists shared_sessions_status_check;
alter table shared_sessions add constraint shared_sessions_status_check
  check (status in ('open', 'awaiting_payment', 'closed'));

-- ---------- session_dues: peserta sekarang nama bebas ----------
alter table session_dues add column if not exists participant_name text;
alter table session_dues alter column user_id drop not null;
alter table session_dues drop constraint if exists session_dues_session_id_user_id_key;

-- Isi participant_name dari nama profil untuk data lama (kalau ada sesi yang sudah
-- pernah ditutup dengan cara lama), supaya tidak ada baris lama yang jadi null.
update session_dues sd
set participant_name = p.full_name
from profiles p
where sd.user_id = p.id and sd.participant_name is null;

alter table session_dues alter column participant_name set not null;

-- Policy lama berbasis kepemilikan user_id sudah tidak relevan -> dihapus,
-- karena sekarang admin yang input & upload untuk semua peserta.
drop policy if exists "member_pay_own_session_due" on session_dues;

create policy "admin_insert_session_dues" on session_dues
  for insert with check (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );

create policy "admin_update_session_dues" on session_dues
  for update using (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );

create policy "admin_delete_session_dues" on session_dues
  for delete using (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );

-- =========================================================
-- FUNCTION: buka tahap pembayaran. Dipanggil SEKALI saat admin
-- input daftar nama peserta lalu pencet "Hitung & Buka Tagihan".
-- Menghitung pembagian rata (rounding-safe, sama seperti logika lama),
-- membuat baris session_dues per nama, dan mengunci sesi dari
-- penambahan barang baru (status -> awaiting_payment).
-- =========================================================
create or replace function open_session_payment(p_session_id uuid, p_closer_id uuid, p_names text[])
returns void
language plpgsql
security definer
as $$
declare
  v_total numeric(12,2);
  v_n int;
  v_base numeric(12,2);
  v_remainder int;
  v_name text;
  v_idx int := 0;
begin
  if not exists (select 1 from profiles where id = p_closer_id and role = 'admin') then
    raise exception 'Hanya admin yang bisa menutup sesi';
  end if;

  perform 1 from shared_sessions where id = p_session_id and status = 'open' for update;
  if not found then
    raise exception 'Sesi tidak ditemukan atau bukan status open';
  end if;

  v_n := coalesce(array_length(p_names, 1), 0);
  if v_n = 0 then
    raise exception 'Minimal 1 nama peserta';
  end if;

  select coalesce(sum(amount), 0) into v_total
  from shared_expenses
  where session_id = p_session_id and status = 'active';

  update shared_sessions
  set status = 'awaiting_payment'
  where id = p_session_id;

  v_base := floor(v_total / v_n);
  v_remainder := round(v_total - v_base * v_n); -- sisa rupiah, dibagi 1-1 ke beberapa orang duluan

  foreach v_name in array p_names loop
    v_idx := v_idx + 1;
    insert into session_dues (session_id, participant_name, amount_due)
    values (
      p_session_id,
      v_name,
      v_base + case when v_idx <= v_remainder then 1 else 0 end
    );
  end loop;
end;
$$;

-- =========================================================
-- FUNCTION: tambah 1 peserta lagi SAAT status 'awaiting_payment'
-- (sebelum admin pencet "Sudah Bayar Semua"). Pembagian dihitung
-- ULANG rata ke semua peserta (lama + baru). Status 'paid' peserta
-- lama tidak direset, tapi kalau nominal jadi beda, cek ulang manual.
-- =========================================================
create or replace function add_session_participant(p_session_id uuid, p_admin_id uuid, p_name text)
returns void
language plpgsql
security definer
as $$
declare
  v_total numeric(12,2);
  v_n int;
  v_base numeric(12,2);
  v_remainder int;
  v_id uuid;
  v_idx int := 0;
begin
  if not exists (select 1 from profiles where id = p_admin_id and role = 'admin') then
    raise exception 'Hanya admin yang bisa menambah peserta';
  end if;

  perform 1 from shared_sessions where id = p_session_id and status = 'awaiting_payment' for update;
  if not found then
    raise exception 'Sesi tidak dalam status menunggu pembayaran';
  end if;

  select coalesce(sum(amount), 0) into v_total
  from shared_expenses
  where session_id = p_session_id and status = 'active';

  insert into session_dues (session_id, participant_name, amount_due)
  values (p_session_id, p_name, 0);

  select count(*) into v_n from session_dues where session_id = p_session_id;
  v_base := floor(v_total / v_n);
  v_remainder := round(v_total - v_base * v_n);

  for v_id in select id from session_dues where session_id = p_session_id order by created_at loop
    v_idx := v_idx + 1;
    update session_dues
    set amount_due = v_base + case when v_idx <= v_remainder then 1 else 0 end
    where id = v_id;
  end loop;
end;
$$;
