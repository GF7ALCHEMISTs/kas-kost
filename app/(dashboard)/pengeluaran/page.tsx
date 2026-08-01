import Link from "next/link";
import { notFound } from "next/navigation";
import { getCurrentOpenPeriod, getAllPeriods } from "@/lib/queries/periods";
import { getExpensesForPeriod } from "@/lib/queries/expenses";
import { createClient } from "@/lib/supabase/server";
import { ExpenseList } from "@/components/expenses/ExpenseList";
import { PeriodSelector } from "@/components/dashboard/PeriodSelector";

const BULAN = [
  "", "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember",
];

export default async function PengeluaranPage({
  searchParams,
}: {
  searchParams: { period?: string };
}) {
  const [currentPeriod, allPeriods] = await Promise.all([getCurrentOpenPeriod(), getAllPeriods()]);
  if (!currentPeriod && allPeriods.length === 0) {
    return <p className="text-sm text-gray-500 dark:text-gray-400">Tidak ada periode aktif.</p>;
  }

  const selectedPeriod = searchParams.period
    ? allPeriods.find((p) => p.id === searchParams.period)
    : currentPeriod ?? allPeriods[0];
  if (!selectedPeriod) notFound();

  const isCurrentPeriod = selectedPeriod.id === currentPeriod?.id;

  const expenses = (await getExpensesForPeriod(selectedPeriod.id, { withProof: true })) ?? [];

  // Cek expense mana saja yang pernah diedit, untuk label "✏️ Diedit"
  const supabase = createClient();
  const { data: edits } = await supabase
    .from("audit_logs")
    .select("record_id")
    .eq("table_name", "expenses")
    .eq("action", "edit");
  const editedIds = new Set((edits ?? []).map((e) => e.record_id));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <h2 className="font-semibold">
          Pengeluaran {BULAN[selectedPeriod.month]} {selectedPeriod.year}
        </h2>
        <PeriodSelector periods={allPeriods} selectedPeriodId={selectedPeriod.id} basePath="/pengeluaran" />
      </div>
      {isCurrentPeriod && (
        <div className="flex justify-end">
          <Link href="/pengeluaran/tambah" className="text-sm text-indigo-600 dark:text-indigo-400 font-medium">
            + Tambah
          </Link>
        </div>
      )}
      <ExpenseList expenses={expenses} editedIds={editedIds} />
    </div>
  );
}
