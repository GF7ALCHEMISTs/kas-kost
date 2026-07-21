import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentOpenPeriod, getPeriodBalance } from "@/lib/queries/periods";
import { getExpenseCategories, getActiveProfiles } from "@/lib/queries/expenses";
import { ExpenseForm } from "@/components/expenses/ExpenseForm";

export default async function TambahPengeluaranPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const period = await getCurrentOpenPeriod();
  if (!period) return <p className="text-sm text-gray-500 dark:text-gray-400">Tidak ada periode aktif.</p>;

  const [categories, profiles, balance] = await Promise.all([
    getExpenseCategories(),
    getActiveProfiles(),
    getPeriodBalance(period.id),
  ]);

  return (
    <div className="space-y-4">
      <h2 className="font-semibold">Tambah Pengeluaran</h2>
      <ExpenseForm
        periodId={period.id}
        currentUserId={user.id}
        categories={categories ?? []}
        profiles={profiles ?? []}
        currentBalance={balance?.saldo_akhir ?? 0}
      />
    </div>
  );
}

