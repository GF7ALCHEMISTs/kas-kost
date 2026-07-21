import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getDuesForPeriod } from "@/lib/queries/dues";
import { getExpensesForPeriod } from "@/lib/queries/expenses";
import { getPeriodBalance } from "@/lib/queries/periods";
import { DuesStatusList } from "@/components/dashboard/DuesStatusList";
import { ExpenseList } from "@/components/expenses/ExpenseList";
import { formatRupiah } from "@/lib/utils/currency";

export default async function HistoriDetailPage({ params }: { params: { periodId: string } }) {
  const supabase = createClient();
  const { data: period } = await supabase
    .from("periods")
    .select("*")
    .eq("id", params.periodId)
    .maybeSingle();

  if (!period) notFound();

  const [balance, dues, expenses] = await Promise.all([
    getPeriodBalance(period.id),
    getDuesForPeriod(period.id),
    getExpensesForPeriod(period.id),
  ]);

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border dark:border-gray-800 p-4">
        <p className="text-sm text-gray-500 dark:text-gray-400">Saldo Akhir {period.month}/{period.year}</p>
        <p className="text-2xl font-bold">{formatRupiah(balance?.saldo_akhir ?? 0)}</p>
      </div>
      <DuesStatusList dues={dues ?? []} />
      <div>
        <h3 className="font-semibold mb-2">Semua Pengeluaran</h3>
        <ExpenseList expenses={expenses ?? []} editedIds={new Set()} />
      </div>
    </div>
  );
}
