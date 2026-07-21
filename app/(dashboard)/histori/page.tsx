import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { formatRupiah } from "@/lib/utils/currency";

const BULAN = [
  "", "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember",
];

export default async function HistoriPage() {
  const supabase = createClient();
  const { data: balances } = await supabase
    .from("period_balances")
    .select("*")
    .order("year", { ascending: false })
    .order("month", { ascending: false });

  return (
    <div className="space-y-3">
      <h2 className="font-semibold">Histori Bulanan</h2>
      {(balances ?? []).map((b) => (
        <Link
          key={b.period_id}
          href={`/histori/${b.period_id}`}
          className="flex justify-between items-center rounded-xl border dark:border-gray-800 p-3"
        >
          <span className="text-sm font-medium">
            {BULAN[b.month]} {b.year}
          </span>
          <span className="text-sm font-semibold">{formatRupiah(b.saldo_akhir)}</span>
        </Link>
      ))}
    </div>
  );
}
