import { formatRupiah } from "@/lib/utils/currency";
import type { SessionDue } from "@/types/database.types";

export function SessionDuesList({ dues }: { dues: SessionDue[] }) {
  return (
    <div className="rounded-2xl border dark:border-gray-800 p-4 space-y-3">
      <h3 className="font-semibold">Tagihan Per Orang</h3>
      {dues.map((due) => (
        <div key={due.id} className="flex items-center justify-between text-sm">
          <div>
            <p className="font-medium">{due.participant_name}</p>
            <p className="text-gray-500 dark:text-gray-400 text-xs">{formatRupiah(due.amount_due)}</p>
          </div>
          <span
            className={`px-2 py-1 rounded-full text-xs font-medium ${
              due.status === "paid"
                ? "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300"
                : "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300"
            }`}
          >
            {due.status === "paid" ? "Sudah Transfer" : "Belum Transfer"}
          </span>
        </div>
      ))}
      <p className="text-xs text-gray-400 dark:text-gray-500 pt-1">
        Bukti bayar diupload admin. Begitu ditandai, langsung terlihat semua orang.
      </p>
    </div>
  );
}
