"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { formatRupiah } from "@/lib/utils/currency";
import type { ManualAdjustment } from "@/types/database.types";

export function AdjustmentList({
  adjustments,
  isAdmin,
}: {
  adjustments: ManualAdjustment[];
  isAdmin: boolean;
}) {
  const router = useRouter();
  const supabase = createClient();
  const [target, setTarget] = useState<ManualAdjustment | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (adjustments.length === 0) return null;

  async function handleDelete() {
    if (!target) return;
    setLoading(true);
    setError(null);
    const { error } = await supabase.from("manual_adjustments").delete().eq("id", target.id);
    setLoading(false);
    if (error) {
      setError(error.message);
      return;
    }
    setTarget(null);
    router.refresh();
  }

  return (
    <div className="rounded-2xl border dark:border-gray-800 p-4 space-y-2">
      <h3 className="font-semibold text-sm">Riwayat Penyesuaian Saldo</h3>
      {adjustments.map((adj) => (
        <div key={adj.id} className="flex items-center justify-between border-b last:border-0 dark:border-gray-800 pb-2 last:pb-0 text-sm">
          <div className="min-w-0">
            <p className="truncate">{adj.note}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {adj.profiles?.full_name} · {new Date(adj.created_at).toLocaleDateString("id-ID")}
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className={adj.type === "tambah" ? "text-green-600 dark:text-green-400 font-medium" : "text-red-600 dark:text-red-400 font-medium"}>
              {adj.type === "tambah" ? "+" : "-"}
              {formatRupiah(adj.amount)}
            </span>
            {isAdmin && (
              <button
                type="button"
                onClick={() => setTarget(adj)}
                aria-label="Hapus penyesuaian"
                className="inline-flex h-7 w-7 items-center justify-center rounded-md text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40"
              >
                <Trash2 className="h-4 w-4" aria-hidden="true" />
              </button>
            )}
          </div>
        </div>
      ))}

      <ConfirmModal
        open={target !== null}
        title="Hapus penyesuaian?"
        confirmLabel="Ya, Hapus"
        loading={loading}
        onCancel={() => setTarget(null)}
        onConfirm={handleDelete}
      >
        {target && (
          <p>
            Penyesuaian &quot;{target.note}&quot; sebesar{" "}
            <span className="font-semibold">{formatRupiah(target.amount)}</span> akan dihapus
            permanen dan saldo kas akan langsung kembali seperti sebelumnya.
          </p>
        )}
        {error && <p className="mt-2 text-red-600 dark:text-red-400">{error}</p>}
      </ConfirmModal>
    </div>
  );
}
