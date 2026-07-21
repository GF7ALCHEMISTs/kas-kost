-- =========================================================
-- KAS BULANAN: hapus proses konfirmasi admin, samakan dengan
-- model "Di Luar Kas" -> begitu bukti transfer diupload,
-- langsung terhitung sebagai kas masuk. Transparansi penuh,
-- tanpa gerbang approval siapa pun.
-- =========================================================

drop policy if exists "admin_confirm_others_due" on period_dues;

alter table period_dues drop constraint if exists no_self_confirm;

-- Postgres tidak bisa DROP VALUE dari enum -> bikin ulang tipe enum-nya
create type due_status_v2 as enum ('unpaid', 'confirmed');

alter table period_dues alter column status drop default;

alter table period_dues
  alter column status type due_status_v2
  using (
    case
      when status::text in ('pending_confirmation', 'confirmed') then 'confirmed'::due_status_v2
      else 'unpaid'::due_status_v2
    end
  );

alter table period_dues alter column status set default 'unpaid';

drop type due_status;
alter type due_status_v2 rename to due_status;

alter table period_dues drop column if exists confirmed_by;
alter table period_dues drop column if exists confirmed_at;

-- Catatan: view period_balances tidak perlu diubah, karena masih memfilter
-- pada status = 'confirmed' yang tetap valid di enum baru ini.
