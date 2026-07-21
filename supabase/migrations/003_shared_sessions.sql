-- =========================================================
-- FITUR: SESI untuk "Di Luar Kas"
-- Mengubah model dari ledger terbuka menjadi per-sesi:
-- buka sesi -> tambah barang -> tutup sesi -> saldo dihitung final,
-- saran pelunasan otomatis, dan bisa dibagikan lewat link publik (token).
-- =========================================================

create table shared_sessions (
  id uuid primary key default uuid_generate_v4(),
  title text not null,                          -- misal "Isi Rumah Agustus 2026"
  status text not null default 'open' check (status in ('open','closed')),
  share_token uuid not null default uuid_generate_v4(),
  opened_by uuid not null references profiles(id),
  opened_at timestamptz not null default now(),
  closed_at timestamptz,
  closed_by uuid references profiles(id),
  unique (share_token)
);

-- Setiap barang sekarang wajib terhubung ke satu sesi.
alter table shared_expenses add column session_id uuid references shared_sessions(id) on delete cascade;

-- Pelunasan juga di-scope per sesi -> saat sesi baru dibuka, hutang sesi lama
-- TIDAK ikut terbawa (beda dengan kas bulanan yang carry over). Sesuai konsep:
-- sesi adalah kejadian yang selesai/tuntas, bukan siklus berulang.
alter table settlements add column session_id uuid references shared_sessions(id) on delete cascade;

alter table shared_sessions enable row level security;

create policy "read_all_authenticated_sessions" on shared_sessions
  for select using (auth.role() = 'authenticated');

create policy "member_insert_session" on shared_sessions
  for insert with check (
    exists (select 1 from profiles where id = auth.uid() and role in ('admin','member'))
    and opened_by = auth.uid()
  );

-- Sesi bisa ditutup oleh pembukanya sendiri atau admin
create policy "opener_or_admin_close_session" on shared_sessions
  for update using (
    opened_by = auth.uid()
    or exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );

-- CATATAN KEAMANAN link publik:
-- Halaman publik (/public/sesi/[token]) TIDAK memakai RLS/anon policy sama sekali.
-- Ia memakai service-role client di server (bypass RLS) dan memvalidasi token secara manual.
-- share_token adalah UUID acak yang sulit ditebak -> itu satu-satunya lapisan keamanan,
-- jadi JANGAN pernah menampilkan share_token di tempat publik selain lewat link yang sengaja dibagikan.
-- Siapa pun yang memegang link bisa melihat isi sesi tsb (termasuk foto bukti), tanpa perlu login.
