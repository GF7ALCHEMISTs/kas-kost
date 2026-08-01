"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { formatRupiah } from "@/lib/utils/currency";
import type { SessionDue } from "@/types/database.types";

export function SessionDuesList({ dues }: { dues: SessionDue[] }) {
  const [openId, setOpenId] = useState<string | null>(null);

  return (
    <div className="rounded-2xl border dark:border-gray-800 p-4 space-y-3">
      <h3 className="font-semibold">Tagihan Per Orang</h3>
      {dues.map((due) => {
        const isOpen = openId === due.id;
        const canExpand = due.status === "paid";

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
                  <p className="font-medium">{due.participant_name}</p>
                  <p className="text-gray-500 dark:text-gray-400 text-xs">{formatRupiah(due.amount_due)}</p>
                </div>
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
            </button>

            {isOpen && canExpand && (
              <div className="mt-3 pl-6">
                {due.signedProofUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={due.signedProofUrl}
                    alt={`Bukti transfer ${due.participant_name}`}
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
        Bukti bayar diupload admin. Begitu ditandai, langsung terlihat semua orang.
      </p>
    </div>
  );
}
