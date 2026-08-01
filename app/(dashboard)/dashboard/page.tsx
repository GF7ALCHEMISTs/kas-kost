import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentOpenPeriod, getAllPeriods, getPeriodBalance, getPreviousBalance } from "@/lib/queries/periods";
import { getDuesForPeriod } from "@/lib/queries/dues";
import { getAdjustmentsForPeriod } from "@/lib/queries/adjustments";
import { BalanceCard } from "@/components/dashboard/BalanceCard";
import { DuesStatusList } from "@/components/dashboard/DuesStatusList";
import { MarkAllPaidButton } from "@/components/dues/MarkAllPaidButton";
import { AdjustmentForm } from "@/components/dues/AdjustmentForm";
import { AdjustmentList } from "@/components/dues/AdjustmentList";
import { PeriodSelector } from "@/components/dashboard/PeriodSelector";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: { period?: string };
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: profile } = user
    ? await supabase.from("profiles").select("*").eq("id", user.id).single()
    : { data: null };
  const isAdmin = profile?.role === "admin";

  const [currentPeriod, allPeriods] = await Promise.all([getCurrentOpenPeriod(), getAllPeriods()]);

  if (!currentPeriod && allPeriods.length === 0) {
    return <p className="text-sm text-gray-500 dark:text-gray-400">Belum ada periode aktif. Hubungi admin.</p>;
  }

  const period = searchParams.period
    ? allPeriods.find((p) => p.id === searchParams.period)
    : currentPeriod ?? allPeriods[0];
  if (!period) notFound();

  const isCurrentPeriod = period.id === currentPeriod?.id;

  const [balance, saldoAwal, dues, adjustments] = await Promise.all([
    getPeriodBalance(period.id),
    getPreviousBalance(period.year, period.month),
    getDuesForPeriod(period.id, { withProof: true }),
    getAdjustmentsForPeriod(period.id),
  ]);

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <PeriodSelector periods={allPeriods} selectedPeriodId={period.id} basePath="/dashboard" />
      </div>
      <BalanceCard
        saldoAwal={saldoAwal}
        saldoAkhir={balance?.saldo_akhir ?? saldoAwal}
        totalMasuk={balance?.total_masuk ?? 0}
        totalKeluar={balance?.total_keluar ?? 0}
        totalPenyesuaian={balance?.total_penyesuaian ?? 0}
      />
      {isAdmin && isCurrentPeriod && <MarkAllPaidButton periodId={period.id} dues={dues ?? []} />}
      {isAdmin && isCurrentPeriod && <AdjustmentForm periodId={period.id} />}
      <AdjustmentList adjustments={adjustments ?? []} isAdmin={isAdmin && isCurrentPeriod} />
      <DuesStatusList dues={dues ?? []} />
      <p className="text-xs text-gray-400 dark:text-gray-500 text-center">
        Periode: {period.month}/{period.year} · Semua transaksi terlihat oleh semua penghuni.
      </p>
    </div>
  );
}
