import Link from "next/link";
import { DeleteExpenseButton } from "@/components/expenses/DeleteExpenseButton";
import { formatRupiah } from "@/lib/utils/currency";
import type { SharedExpense } from "@/types/database.types";

export function SharedExpenseList({ items }: { items: SharedExpense[] }) {
  if (items.length === 0) {
    return <p className="text-sm text-gray-500 dark:text-gray-400">Belum ada barang yang dicatat.</p>;
  }

  return (
    <div className="space-y-2">
      {items.map((item) => (
        <div
          key={item.id}
          className={`rounded-xl border dark:border-gray-800 p-3 ${item.status === "void" ? "opacity-50" : ""}`}
        >
          <div className="flex justify-between items-start gap-3">
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
        </div>
      ))}
    </div>
  );
}
