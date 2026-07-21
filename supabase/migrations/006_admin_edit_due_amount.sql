-- =========================================================
-- ADMIN: bisa ubah nominal iuran bulanan (default_due_amount)
-- lewat admin panel. Sebelumnya tidak ada policy UPDATE sama
-- sekali untuk tabel periods, jadi RLS otomatis menolak semua
-- update walau dari admin.
-- =========================================================

create policy "admin_update_periods" on periods for update
  using (exists (select 1 from profiles where id = auth.uid() and role = 'admin'));

-- Admin juga perlu bisa mengoreksi nominal tagihan (amount_due) milik
-- penghuni lain di periode berjalan, misal saat nominal iuran diubah
-- di tengah bulan dan mau disamakan ke tagihan yang belum dibayar.
-- (Policy "admin_confirm_others_due" versi lama sudah dihapus di
-- migration 005 karena proses konfirmasinya dihapus, jadi ini policy
-- baru khusus untuk kebutuhan koreksi nominal oleh admin.)
create policy "admin_update_period_dues" on period_dues for update
  using (exists (select 1 from profiles where id = auth.uid() and role = 'admin'));
