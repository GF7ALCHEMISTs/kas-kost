# Kas Kost

Aplikasi kas rumah/kost untuk 3 penghuni. Next.js (App Router) + Supabase (Postgres, Auth, Storage) + Vercel.

## 1. Setup Supabase

1. Buat project baru di https://supabase.com.
2. Buka **SQL Editor** → jalankan seluruh isi `supabase/schema.sql`. Ini akan membuat semua tabel, view `period_balances`, function `close_period()`, dan RLS policies.
3. Jalankan juga `supabase/migrations/002_shared_expenses.sql`, lalu `003_shared_sessions.sql`, lalu `004_session_dues_pooled_kas.sql`, lalu `005_remove_kas_bulanan_confirmation.sql` setelah `schema.sql` — urutan ini penting karena tiap migration membangun di atas yang sebelumnya. Migration 004 & 005 membuat **seluruh aplikasi** (kas bulanan maupun "Di Luar Kas") pakai model yang sama: begitu bukti transfer diupload, langsung terhitung/`confirmed`, langsung terlihat semua orang — tidak ada lagi proses approval admin di mana pun.
4. Buka **Storage** → buat bucket baru bernama `proofs`, set **Private** (bukan public).
4. Di **Storage → Policies**, tambahkan policy select & insert untuk `authenticated` (contoh query ada di komentar paling bawah `schema.sql`).
5. Buka **Authentication → Users** → buat 3 (atau lebih) user manual (email + password) untuk tiap penghuni + orang tua. Tidak ada self-register di aplikasi ini, sengaja dibuatkan manual oleh kamu.
6. Untuk tiap user yang dibuat, insert baris di tabel `profiles` (id harus sama dengan `auth.users.id`):

```sql
insert into profiles (id, full_name, phone, role, is_active)
values
  ('uuid-user-1', 'Nama Kamu', '628xxxxxxxxx', 'admin', true),
  ('uuid-user-2', 'Nama Penghuni 2', '628xxxxxxxxx', 'member', true),
  ('uuid-user-3', 'Nama Penghuni 3', '628xxxxxxxxx', 'member', true),
  ('uuid-orangtua', 'Orang Tua', null, 'parent', true);
```

7. Buat periode pertama secara manual:

```sql
insert into periods (year, month, default_due_amount, due_date, status)
values (2026, 8, 1000000, '2026-08-05', 'open');

insert into period_dues (period_id, user_id, amount_due)
select id, p.id, 1000000
from periods, profiles p
where periods.year = 2026 and periods.month = 8 and p.role in ('admin','member');
```

Setelah periode pertama ini, admin cukup pakai tombol **"Tutup Periode Ini"** di aplikasi — periode berikutnya dibuat otomatis (saldo awal = saldo akhir bulan ini).

## 2. Environment Variables

Copy `.env.example` ke `.env.local`, isi sesuai project Supabase kamu (Settings → API).

## 3. Jalankan Lokal

```bash
npm install
npm run dev
```

Buka `http://localhost:3000`, login pakai salah satu akun yang sudah dibuat di Supabase.

## 4. Setup Reminder WhatsApp (WAHA)

WAHA (scan QR) butuh proses **always-on**, tidak bisa jalan di Vercel. Kalau kamu sudah punya instance WAHA dari project IG-to-WhatsApp kamu, tinggal reuse:

1. Set `WAHA_BASE_URL` ke alamat instance WAHA kamu.
2. Pastikan session WAHA sudah ter-scan QR dan aktif.
3. `app/api/wa/send/route.ts` akan memanggil `POST {WAHA_BASE_URL}/api/sendText` — sesuaikan endpoint ini kalau versi WAHA kamu beda.
4. `app/api/reminders/route.ts` adalah endpoint yang dipanggil scheduler harian (lihat `vercel.json` untuk contoh Vercel Cron, jadwal jam 08:00 WIB / 01:00 UTC). Alternatif: pakai https://cron-job.org kalau mau di luar Vercel Cron.
5. Amankan endpoint reminder dengan `REMINDER_CRON_SECRET` — scheduler harus kirim header `Authorization: Bearer <secret>`.

## 5. Deploy ke Vercel

1. Push repo ini ke GitHub.
2. Import project di Vercel, isi semua environment variables yang sama dengan `.env.local`.
3. Deploy.

## Keputusan Desain Penting (jangan diubah tanpa alasan kuat)

- **Saldo dihitung dari view `period_balances`, tidak pernah disimpan manual** — mencegah saldo drift. Kalau butuh koreksi transaksi lama, edit transaksinya, jangan pernah mengetik ulang angka saldo.
- **Piutang (belum bayar) tidak dihitung sebagai saldo kas** — hanya `status = confirmed` yang masuk hitungan.
- **Admin tidak bisa konfirmasi pembayarannya sendiri** (dijamin di DB lewat constraint `no_self_confirm` + RLS policy).
- **Pengeluaran auto-acc** (langsung `active`) tapi setiap edit wajib alasan dan tercatat di `audit_logs` — tidak ada hard delete di aplikasi ini.
- **Role `parent` hanya bisa SELECT** — dijamin di level RLS Supabase, bukan cuma disembunyikan di UI.
- **Tutup periode lewat function `close_period()`** (bukan multi-step di kode aplikasi) supaya atomic dan aman dari race condition / dobel klik.
- **Tidak ada lagi approval admin di mana pun dalam aplikasi ini** — baik kas bulanan (`period_dues`) maupun "Di Luar Kas" (`session_dues`) sekarang sama-sama transparan penuh: begitu bukti transfer diupload, langsung `confirmed`/`paid` dan langsung terlihat semua orang. Ini keputusan sadar untuk rumah isi 3 orang: birokrasi approval dianggap lebih mahal (waktu + gesekan sosial) daripada manfaatnya, dan transparansi penuh sudah cukup jadi mekanisme akuntabilitas.
- **Dark mode** pakai Tailwind `darkMode: "class"` + toggle manual (disimpan di `localStorage`, default ikut preferensi sistem kalau belum pernah diatur). Warna aksen utama pakai gradient violet→indigo untuk kesan modern tapi tetap simpel; kartu saldo tetap solid gradient (tidak perlu varian dark karena teksnya putih di kedua mode).
- **Link publik per sesi (`/public/sesi/[token]`) sengaja tanpa login** — keamanannya murni dari `share_token` (UUID acak) di URL, bukan dari autentikasi. Ini trade-off yang disadari: gampang dibagikan ke orang tua lewat WA, tapi siapa pun yang memegang link bisa lihat isi sesi (termasuk foto bukti) tanpa perlu akun. Jangan sebar token di tempat publik selain lewat link yang memang sengaja dibagikan.
