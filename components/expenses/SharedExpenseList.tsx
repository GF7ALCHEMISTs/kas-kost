"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronDown } from "lucide-react";
import { DeleteExpenseButton } from "@/components/expenses/DeleteExpenseButton";
import { formatRupiah } from "@/lib/utils/currency";
import type { SharedExpense } from "@/types/database.types";

export function SharedExpenseList({ items }: { items: SharedExpense[] }) {
  const [openId, setOpenId] = useState<string | null>(null);

  if (items.length === 0) {
    return <p className="text-sm text-gray-500 dark:text-gray-400">Belum ada barang yang dicatat.</p>;
  }

  return (
    <div className="space-y-2">
      {items.map((item) => {
        const isOpen = openId === item.id;
        const canExpand = Boolean(item.proof_path);

        return (
          <div
            key={item.id}
            className={`rounded-xl border dark:border-gray-800 p-3 ${item.status === "void" ? "opacity-50" : ""}`}
          >
            <div className="flex justify-between items-start gap-3">
              <button
                type="button"
                disabled={!canExpand}
                onClick={() => setOpenId(isOpen ? null : item.id)}
                className="min-w-0 flex items-start gap-1.5 text-left disabled:cursor-default"
              >
                {canExpand && (
                  <ChevronDown
                    size={16}
                    className={`shrink-0 mt-0.5 text-gray-400 transition-transform ${isOpen ? "rotate-180" : ""}`}
                  />
                )}
                <div className="min-w-0">
                  <p className="font-medium text-sm">
                    {item.title}
                    {item.status === "void" && <span className="text-red-500 text-xs"> (Dibatalkan)</span>}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Dibeli oleh {item.paid_by_profile?.full_name} - {item.expense_date}
                  </p>
                  {item.notes && <p className="text-xs text-gray-400 dark:text-gray-500">{item.notes}</p>}
                </div>
              </button>
              <div className="flex shrink-0 items-start gap-2">
                <p className="font-semibold text-sm">{formatRupiah(item.amount)}</p>
                <div className="flex items-center gap-1">
                  <Link
                    href={`/luar-kas/${item.id}/edit`}
                    className="rounded-md px-1.5 py-1 text-xs font-medium text-orange-500 hover:bg-orange-50 dark:hover:bg-orange-950/40"
                  >
                    Edit
                  </Link>
                  <DeleteExpenseButton
                    tableName="shared_expenses"
                    target={{
                      id: item.id,
                      amount: item.amount,
                      label: item.title,
                      status: item.status,
                    }}
                  />
                </div>
              </div>
            </div>

            {isOpen && canExpand && (
              <div className="mt-3 pl-6">
                {item.signedProofUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={item.signedProofUrl}
                    alt={`Bukti ${item.title}`}
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
    </div>
  );
}
