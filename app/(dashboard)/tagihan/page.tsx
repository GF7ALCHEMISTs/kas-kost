import { createClient } from "@/lib/supabase/server";
import { getCurrentOpenPeriod } from "@/lib/queries/periods";
import { getMyDue } from "@/lib/queries/dues";
import { formatRupiah } from "@/lib/utils/currency";
import { PayDueForm } from "@/components/dues/PayDueForm";

export default async function TagihanPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const period = await getCurrentOpenPeriod();

  if (!user || !period) {
    return <p className="text-sm text-gray-500 dark:text-gray-400">Tidak ada periode aktif.</p>;
  }

  const due = await getMyDue(period.id, user.id);

  if (!due) {
    return <p className="text-sm text-gray-500 dark:text-gray-400">Tidak ada tagihan untuk kamu bulan ini.</p>;
  }

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border dark:border-gray-800 p-4">
        <p className="text-sm text-gray-500 dark:text-gray-400">Tagihan bulan {period.month}/{period.year}</p>
        <p className="text-2xl font-bold">{formatRupiah(due.amount_due)}</p>
      </div>
      <PayDueForm due={due} />
    </div>
  );
}
