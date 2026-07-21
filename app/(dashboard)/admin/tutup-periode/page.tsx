import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentOpenPeriod, getPeriodBalance } from "@/lib/queries/periods";
import { formatRupiah } from "@/lib/utils/currency";
import { ClosePeriodButton } from "@/components/dashboard/ClosePeriodButton";
import { EditDueAmountForm } from "@/components/dashboard/EditDueAmountForm";

export default async function TutupPeriodePage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const period = await getCurrentOpenPeriod();
  if (!period) return <p className="text-sm text-gray-500 dark:text-gray-400">Tidak ada periode aktif.</p>;

  const balance = await getPeriodBalance(period.id);

  return (
    <div className="space-y-4">
      <h2 className="font-semibold">Tutup Periode {period.month}/{period.year}</h2>
      <div className="grid grid-cols-2 gap-2 rounded-xl bg-gray-100 p-1 text-center text-sm dark:bg-gray-800">
        <Link href="/admin/tutup-periode" className="rounded-lg bg-white py-2 font-medium text-indigo-600 shadow-sm dark:bg-gray-900 dark:text-indigo-400">
          Tutup Periode
        </Link>
        <Link href="/admin/penghuni" className="rounded-lg py-2 font-medium text-gray-600 dark:text-gray-300">
          Kelola Penghuni
        </Link>
      </div>
      <div className="rounded-2xl border dark:border-gray-800 p-4">
        <p className="text-sm text-gray-500 dark:text-gray-400">Saldo Akhir</p>
        <p className="text-2xl font-bold">{formatRupiah(balance?.saldo_akhir ?? 0)}</p>
      </div>
      <EditDueAmountForm periodId={period.id} currentAmount={period.default_due_amount} />
      <ClosePeriodButton periodId={period.id} adminId={user.id} />
    </div>
  );
}
