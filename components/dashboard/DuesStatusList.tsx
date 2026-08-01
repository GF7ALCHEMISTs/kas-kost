"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { formatRupiah } from "@/lib/utils/currency";
import type { PeriodDue } from "@/types/database.types";

const STATUS_LABEL: Record<string, { text: string; color: string }> = {
  unpaid: { text: "Belum Bayar", color: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300" },
  confirmed: { text: "Sudah Bayar", color: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300" },
};
// Fallback jika ada status lama/tak dikenal di data (misal 'pending_confirmation'
// dari sebelum migration 005 dijalankan) -> tidak crash, tampil sebagai netral.
const FALLBACK_STATUS = { text: "Belum Bayar", color: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300" };

/** showProof: false dipakai di halaman parent, sengaja tidak menampilkan foto
 *  bukti transfer kas antar penghuni ke orang tua. */
export function DuesStatusList({ dues, showProof = true }: { dues: PeriodDue[]; showProof?: boolean }) {
  const [openId, setOpenId] = useState<string | null>(null);

  return (
    <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 space-y-3">
      <h3 className="font-semibold text-gray-900 dark:text-gray-100">Status Bayar Bulan Ini</h3>
      {dues.map((due) => {
        const status = STATUS_LABEL[due.status] ?? FALLBACK_STATUS;
        const isOpen = openId === due.id;
        const canExpand = showProof && due.status === "confirmed";

        return (
          <div key={due.id} className="border-b border-gray-100 dark:border-gray-800 last:border-0 pb-3 last:pb-0">
            <button
              type="button"
              disabled={!canExpand}
              onClick={() => setOpenId(isOpen ? null : due.id)}
              className="w-full flex items-center justify-between text-sm text-left disabled:cursor-default"
            >
              <div className="flex items-center gap-2">
                {canExpand && (
                  <ChevronDown
                    size={16}
                    className={`text-gray-400 transition-transform ${isOpen ? "rotate-180" : ""}`}
                  />
                )}
                <div>
                  <p className="font-medium text-gray-900 dark:text-gray-100">{due.profiles?.full_name}</p>
                  <p className="text-gray-500 dark:text-gray-400 text-xs">{formatRupiah(due.amount_due)}</p>
                </div>
              </div>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${status.color}`}>
                {status.text}
              </span>
            </button>

            {isOpen && canExpand && (
              <div className="mt-3 pl-6">
                {due.signedProofUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={due.signedProofUrl}
                    alt={`Bukti transfer ${due.profiles?.full_name ?? ""}`}
                    className="max-w-full rounded-xl border border-gray-200 dark:border-gray-700"
                  />
                ) : (
                  <p className="text-xs text-gray-400 dark:text-gray-500">Bukti tidak tersedia.</p>
                )}
              </div>
            )}
          </div>
        );
      })}
      <p className="text-xs text-gray-400 dark:text-gray-500 pt-1">
        Begitu bukti diupload, langsung terlihat semua orang — tidak ada konfirmasi admin.
      </p>
    </div>
  );
}
