import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";

/**
 * Endpoint ini dipanggil scheduler harian (Vercel Cron), bukan oleh user.
 * Diamankan dengan header secret yang sama seperti /api/reminders.
 *
 * Logika: kalau periode yang statusnya 'open' saat ini bulan/tahunnya
 * BUKAN bulan/tahun sekarang (artinya sudah masuk bulan baru tapi belum
 * ada yang tutup periode lama), tutup otomatis lewat close_period() ->
 * itu juga otomatis bikin & isi periode bulan berikutnya.
 *
 * p_admin_id dikirim null karena ini aksi sistem, bukan aksi admin manual.
 * Kalau ketinggalan beberapa bulan (server mati dsb), job ini jalan tiap
 * hari jadi otomatis "ngejar" maju sebulan tiap kali dipanggil sampai
 * periode aktif balik sinkron dengan bulan sekarang.
 */
export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.REMINDER_CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createServiceRoleClient();
  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth() + 1;

  const { data: period } = await supabase
    .from("periods")
    .select("*")
    .eq("status", "open")
    .order("year", { ascending: false })
    .order("month", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!period) {
    return NextResponse.json({ message: "Tidak ada periode aktif sama sekali." });
  }

  const isSameMonth = period.year === currentYear && period.month === currentMonth;
  if (isSameMonth) {
    return NextResponse.json({ message: "Masih bulan yang sama, belum perlu tutup periode." });
  }

  const { data: newPeriodId, error } = await supabase.rpc("close_period", {
    p_period_id: period.id,
    p_admin_id: null,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    message: "Periode ditutup otomatis, periode baru dibuka.",
    closed_period_id: period.id,
    new_period_id: newPeriodId,
  });
}
