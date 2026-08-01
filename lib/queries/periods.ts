import { createClient } from "@/lib/supabase/server";
import type { Period, PeriodBalance } from "@/types/database.types";

export async function getCurrentOpenPeriod(): Promise<Period | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("periods")
    .select("*")
    .eq("status", "open")
    .order("year", { ascending: false })
    .order("month", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return data as Period | null;
}

/** Semua periode (aktif & histori), buat dropdown pemilih bulan. */
export async function getAllPeriods(): Promise<Period[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("periods")
    .select("*")
    .order("year", { ascending: false })
    .order("month", { ascending: false });

  if (error) throw error;
  return (data as Period[]) ?? [];
}

export async function getPeriodBalance(periodId: string): Promise<PeriodBalance | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("period_balances")
    .select("*")
    .eq("period_id", periodId)
    .maybeSingle();

  if (error) throw error;
  return data as PeriodBalance | null;
}

/** Saldo awal bulan ini = saldo_akhir bulan sebelumnya (0 kalau ini periode pertama) */
export async function getPreviousBalance(year: number, month: number): Promise<number> {
  const supabase = createClient();
  // Dataset ini kecil (per bulan), jadi lebih aman ambil semua lalu filter di JS
  // daripada bikin filter kompleks (year/month) yang gampang salah di query builder.
  const { data, error } = await supabase
    .from("period_balances")
    .select("*")
    .order("year", { ascending: false })
    .order("month", { ascending: false });

  if (error) throw error;
  const rows = (data as PeriodBalance[] | null) ?? [];

  const previous = rows.find((row) => row.year < year || (row.year === year && row.month < month));
  return previous?.saldo_akhir ?? 0;
}

