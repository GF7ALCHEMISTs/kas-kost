import { getCurrentOpenPeriod, getPeriodBalance, getPreviousBalance } from "@/lib/queries/periods";
import { getDuesForPeriod } from "@/lib/queries/dues";
import { getExpensesForPeriod } from "@/lib/queries/expenses";
import { BalanceCard } from "@/components/dashboard/BalanceCard";
import { DuesStatusList } from "@/components/dashboard/DuesStatusList";
import { formatRupiah } from "@/lib/utils/currency";

export default async function ParentDashboardPage() {
  const period = await getCurrentOpenPeriod();
  if (!period) return <p className="text-sm text-gray-500 dark:text-gray-400">Belum ada periode aktif.</p>;

  const [balance, saldoAwal, dues, expenses] = await Promise.all([
    getPeriodBalance(period.id),
    getPreviousBalance(period.year, period.month),
    getDuesForPeriod(period.id),
    getExpensesForPeriod(period.id),
  ]);

  return (
    <div className="space-y-4">
      <BalanceCard
        saldoAwal={saldoAwal}
        saldoAkhir={balance?.saldo_akhir ?? saldoAwal}
        totalMasuk={balance?.total_masuk ?? 0}
        totalKeluar={balance?.total_keluar ?? 0}
      />
      <DuesStatusList dues={dues ?? []} />

      <div>
        <h3 className="font-semibold mb-2">Pengeluaran Bulan Ini</h3>
        <div className="space-y-2">
          {(expenses ?? []).map((exp) => (
            <div key={exp.id} className="rounded-xl border dark:border-gray-800 p-3 flex justify-between">
              <div>
                <p className="text-sm font-medium">{exp.description}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {exp.expense_categories?.name} · {exp.expense_date}
                </p>
                {/* Sengaja tidak menampilkan foto bukti transfer kas antar anak-anak,
                    hanya nominal & kategori pengeluaran yang relevan untuk orang tua. */}
              </div>
              <p className="text-sm font-semibold">{formatRupiah(exp.amount)}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
