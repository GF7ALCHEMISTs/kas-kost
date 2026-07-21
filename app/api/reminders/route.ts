import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";

/**
 * Endpoint ini dipanggil oleh scheduler harian (Vercel Cron / cron-job.org),
 * bukan oleh user. Amankan dengan header secret.
 *
 * Contoh setup Vercel Cron (vercel.json):
 * {
 *   "crons": [{ "path": "/api/reminders", "schedule": "0 8 * * *" }]
 * }
 * lalu set header Authorization di request cron sesuai REMINDER_CRON_SECRET.
 *
 * Logika (disederhanakan, tidak ada lagi status "menunggu konfirmasi admin"
 * karena kas bulanan sekarang langsung 'confirmed' begitu bukti diupload):
 * - Cuma dues dengan status 'unpaid' yang diingatkan.
 * - Tier reminder: h-2, h0, h+3, h+7.
 * - reminders_log.unique(period_due_id, tier) mencegah kirim dobel walau job jalan tiap hari.
 */
export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.REMINDER_CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createServiceRoleClient();
  const today = new Date();

  const { data: period } = await supabase
    .from("periods")
    .select("*")
    .eq("status", "open")
    .order("year", { ascending: false })
    .order("month", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!period || !period.due_date) {
    return NextResponse.json({ message: "Tidak ada periode aktif dengan due_date." });
  }

  const dueDate = new Date(period.due_date);
  const diffDays = Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));

  let tier: "h-2" | "h0" | "h+3" | "h+7" | null = null;
  if (diffDays === -2) tier = "h-2";
  else if (diffDays === 0) tier = "h0";
  else if (diffDays === 3) tier = "h+3";
  else if (diffDays === 7) tier = "h+7";

  if (!tier) {
    return NextResponse.json({ message: "Bukan hari reminder untuk periode ini.", diffDays });
  }

  const { data: dues } = await supabase
    .from("period_dues")
    .select("*, profiles!period_dues_user_id_fkey(*)")
    .eq("period_id", period.id)
    .eq("status", "unpaid");

  const results: string[] = [];

  for (const due of dues ?? []) {
    const { data: existingLog } = await supabase
      .from("reminders_log")
      .select("id")
      .eq("period_due_id", due.id)
      .eq("reminder_tier", tier)
      .maybeSingle();

    if (existingLog) continue;
    if (!due.profiles?.phone) continue;

    const message = `Reminder: tagihan kas bulan ${period.month}/${period.year} sebesar Rp${due.amount_due.toLocaleString("id-ID")} belum dibayar. Yuk segera dibayar & upload buktinya 🙏`;

    try {
      await fetch(`${process.env.NEXT_PUBLIC_APP_URL ?? ""}/api/wa/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to: `${due.profiles.phone}@c.us`, text: message }),
      });
      results.push(`${tier} -> ${due.profiles.full_name}`);
    } catch {
      // gagal kirim tidak menghentikan proses reminder lain
    }

    await supabase.from("reminders_log").insert({ period_due_id: due.id, reminder_tier: tier });
  }

  return NextResponse.json({ tier, sent: results });
}
