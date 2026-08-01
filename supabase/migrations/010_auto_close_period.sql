-- Fitur: tutup periode otomatis tiap bulan baru (via Vercel Cron), tanpa
-- perlu admin klik manual. close_period() sebelumnya mewajibkan p_admin_id
-- (dipakai buat kolom audit_logs.performed_by yang NOT NULL) -> kalau
-- dipanggil otomatis oleh sistem, tidak ada admin_id yang relevan.
--
-- Fix: p_admin_id sekarang boleh NULL (default). Kalau NULL berarti
-- ditutup otomatis oleh sistem -> audit_logs tetap dicatat tapi baris
-- audit-nya dilewati (bukan di-insert dengan performed_by kosong, karena
-- kolom itu NOT NULL). Kalau admin yang tutup manual, tetap tercatat
-- seperti biasa.

create or replace function close_period(p_period_id uuid, p_admin_id uuid default null)
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

  if p_admin_id is not null then
    insert into audit_logs (table_name, record_id, action, new_data, performed_by)
    values ('periods', p_period_id, 'update', jsonb_build_object('status','closed'), p_admin_id);
  end if;

  return v_new_period_id;
end;
$$;
