import Link from "next/link";
import { getCurrentOpenPeriod } from "@/lib/queries/periods";
import { getExpensesForPeriod } from "@/lib/queries/expenses";
import { createClient } from "@/lib/supabase/server";
import { ExpenseList } from "@/components/expenses/ExpenseList";

export default async function PengeluaranPage() {
  const period = await getCurrentOpenPeriod();
  if (!period) return <p className="text-sm text-gray-500 dark:text-gray-400">Tidak ada periode aktif.</p>;

  const expenses = (await getExpensesForPeriod(period.id, { withProof: true })) ?? [];

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
      <div className="flex items-center justify-between">
        <h2 className="font-semibold">Pengeluaran Bulan Ini</h2>
        <Link href="/pengeluaran/tambah" className="text-sm text-indigo-600 dark:text-indigo-400 font-medium">
          + Tambah
        </Link>
      </div>
      <ExpenseList expenses={expenses} editedIds={editedIds} />
    </div>
  );
}
