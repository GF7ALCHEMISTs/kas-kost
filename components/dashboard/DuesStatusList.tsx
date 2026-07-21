import { formatRupiah } from "@/lib/utils/currency";
import type { PeriodDue } from "@/types/database.types";

const STATUS_LABEL: Record<string, { text: string; color: string }> = {
  unpaid: { text: "Belum Bayar", color: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300" },
  confirmed: { text: "Sudah Bayar", color: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300" },
};
// Fallback jika ada status lama/tak dikenal di data (misal 'pending_confirmation'
// dari sebelum migration 005 dijalankan) -> tidak crash, tampil sebagai netral.
const FALLBACK_STATUS = { text: "Belum Bayar", color: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300" };

export function DuesStatusList({ dues }: { dues: PeriodDue[] }) {
  return (
    <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 space-y-3">
      <h3 className="font-semibold text-gray-900 dark:text-gray-100">Status Bayar Bulan Ini</h3>
      {dues.map((due) => {
        const status = STATUS_LABEL[due.status] ?? FALLBACK_STATUS;
        return (
          <div key={due.id} className="flex items-center justify-between text-sm">
            <div>
              <p className="font-medium text-gray-900 dark:text-gray-100">{due.profiles?.full_name}</p>
              <p className="text-gray-500 dark:text-gray-400 text-xs">{formatRupiah(due.amount_due)}</p>
            </div>
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${status.color}`}>
              {status.text}
            </span>
          </div>
        );
      })}
      <p className="text-xs text-gray-400 dark:text-gray-500 pt-1">
        Begitu bukti diupload, langsung terlihat semua orang — tidak ada konfirmasi admin.
      </p>
    </div>
  );
}
