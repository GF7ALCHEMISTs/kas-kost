import { createClient } from "@/lib/supabase/server";
import { getCurrentOpenPeriod, getPeriodBalance, getPreviousBalance } from "@/lib/queries/periods";
import { getDuesForPeriod } from "@/lib/queries/dues";
import { BalanceCard } from "@/components/dashboard/BalanceCard";
import { DuesStatusList } from "@/components/dashboard/DuesStatusList";
import { MarkAllPaidButton } from "@/components/dues/MarkAllPaidButton";

export default async function DashboardPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: profile } = user
    ? await supabase.from("profiles").select("*").eq("id", user.id).single()
    : { data: null };
  const isAdmin = profile?.role === "admin";

  const period = await getCurrentOpenPeriod();

  if (!period) {
    return <p className="text-sm text-gray-500 dark:text-gray-400">Belum ada periode aktif. Hubungi admin.</p>;
  }

  const [balance, saldoAwal, dues] = await Promise.all([
    getPeriodBalance(period.id),
    getPreviousBalance(period.year, period.month),
    getDuesForPeriod(period.id, { withProof: true }),
  ]);

  return (
    <div className="space-y-4">
      <BalanceCard
        saldoAwal={saldoAwal}
        saldoAkhir={balance?.saldo_akhir ?? saldoAwal}
        totalMasuk={balance?.total_masuk ?? 0}
        totalKeluar={balance?.total_keluar ?? 0}
      />
      {isAdmin && <MarkAllPaidButton periodId={period.id} dues={dues ?? []} />}
      <DuesStatusList dues={dues ?? []} />
      <p className="text-xs text-gray-400 dark:text-gray-500 text-center">
        Periode: {period.month}/{period.year} · Semua transaksi terlihat oleh semua penghuni.
      </p>
    </div>
  );
}
