import Link from "next/link";
import type { SharedSession } from "@/types/database.types";

export function SessionList({ sessions }: { sessions: SharedSession[] }) {
  if (sessions.length === 0) {
    return <p className="text-sm text-gray-500 dark:text-gray-400">Belum ada sesi. Buka sesi baru untuk mulai catat patungan.</p>;
  }

  return (
    <div className="space-y-2">
      {sessions.map((s) => (
        <Link
          key={s.id}
          href={`/luar-kas/sesi/${s.id}`}
          className="flex items-center justify-between rounded-xl border dark:border-gray-800 p-3"
        >
          <div>
            <p className="font-medium text-sm">{s.title}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Dibuka oleh {s.opened_by_profile?.full_name} ·{" "}
              {new Date(s.opened_at).toLocaleDateString("id-ID")}
            </p>
          </div>
          <span
            className={`text-xs px-2 py-1 rounded-full font-medium ${
              s.status === "open"
                ? "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300"
                : s.status === "awaiting_payment"
                ? "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300"
                : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400"
            }`}
          >
            {s.status === "open" ? "Berjalan" : s.status === "awaiting_payment" ? "Menunggu Bayar" : "Ditutup"}
          </span>
        </Link>
      ))}
    </div>
  );
}
