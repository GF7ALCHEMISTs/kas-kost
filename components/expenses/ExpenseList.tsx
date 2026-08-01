"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronDown } from "lucide-react";
import { DeleteExpenseButton } from "@/components/expenses/DeleteExpenseButton";
import { formatRupiah } from "@/lib/utils/currency";
import type { Expense } from "@/types/database.types";

export function ExpenseList({
  expenses,
  editedIds,
}: {
  expenses: Expense[];
  editedIds: Set<string>;
}) {
  const [openId, setOpenId] = useState<string | null>(null);

  if (expenses.length === 0) {
    return <p className="text-sm text-gray-500 dark:text-gray-400">Belum ada pengeluaran bulan ini.</p>;
  }

  return (
    <div className="space-y-2">
      {expenses.map((exp) => {
        const isOpen = openId === exp.id;
        const canExpand = Boolean(exp.proof_path);

        return (
          <div
            key={exp.id}
            className={`rounded-xl border dark:border-gray-800 p-3 ${exp.status === "void" ? "opacity-50" : ""}`}
          >
            <div className="flex justify-between items-start gap-3">
              <button
                type="button"
                disabled={!canExpand}
                onClick={() => setOpenId(isOpen ? null : exp.id)}
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
                    {exp.description}{" "}
                    {editedIds.has(exp.id) && <span className="text-orange-500 text-xs">Diedit</span>}
                    {exp.status === "void" && <span className="text-red-500 text-xs"> (Dibatalkan)</span>}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {exp.expense_categories?.name} - {exp.expense_date} - Dibayar oleh{" "}
                    {exp.paid_by_profile?.full_name}
                  </p>
                </div>
              </button>
              <div className="flex shrink-0 items-start gap-2">
                <p className="font-semibold text-sm">{formatRupiah(exp.amount)}</p>
                <div className="flex items-center gap-1">
                  <Link
                    href={`/pengeluaran/${exp.id}/edit`}
                    className="rounded-md px-1.5 py-1 text-xs font-medium text-orange-500 hover:bg-orange-50 dark:hover:bg-orange-950/40"
                  >
                    Edit
                  </Link>
                  <DeleteExpenseButton
                    tableName="expenses"
                    target={{
                      id: exp.id,
                      amount: exp.amount,
                      label: exp.description,
                      status: exp.status,
                    }}
                  />
                </div>
              </div>
            </div>

            {isOpen && canExpand && (
              <div className="mt-3 pl-6">
                {exp.signedProofUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={exp.signedProofUrl}
                    alt={`Bukti ${exp.description}`}
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
