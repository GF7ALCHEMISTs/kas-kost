"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { formatRupiah } from "@/lib/utils/currency";

type DeleteTarget = {
  id: string;
  amount: number;
  label: string;
  status: "active" | "void";
};

interface DeleteExpenseButtonProps {
  tableName: "expenses" | "shared_expenses";
  target: DeleteTarget;
}

export function DeleteExpenseButton({ tableName, target }: DeleteExpenseButtonProps) {
  const router = useRouter();
  const supabase = createClient();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDelete() {
    setLoading(true);
    setError(null);

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) throw userError;
      if (!user) throw new Error("User belum login.");

      const voidReason = "Dihapus dari daftar";
      const { error: updateError } = await supabase
        .from(tableName)
        .update({
          status: "void",
          void_reason: voidReason,
          updated_at: new Date().toISOString(),
        })
        .eq("id", target.id);

      if (updateError) throw updateError;

      await supabase.from("audit_logs").insert({
        table_name: tableName,
        record_id: target.id,
        action: "void",
        old_data: { amount: target.amount, label: target.label, status: target.status },
        new_data: { status: "void", void_reason: voidReason },
        edit_reason: voidReason,
        performed_by: user.id,
      });

      setOpen(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menghapus data.");
    } finally {
      setLoading(false);
    }
  }

  if (target.status === "void") return null;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={`Hapus ${target.label}`}
        className="inline-flex h-7 w-7 items-center justify-center rounded-md text-red-500 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/40"
      >
        <Trash2 className="h-4 w-4" aria-hidden="true" />
      </button>

      <ConfirmModal
        open={open}
        title="Hapus pengeluaran?"
        confirmLabel="Ya, Hapus"
        cancelLabel="Batal"
        loading={loading}
        onCancel={() => {
          if (!loading) setOpen(false);
        }}
        onConfirm={handleDelete}
      >
        <p>
          <span className="font-semibold">{target.label}</span> sebesar{" "}
          <span className="font-semibold">{formatRupiah(target.amount)}</span> akan dibatalkan dan
          tidak dihitung lagi di saldo.
        </p>
        {error && <p className="mt-2 text-red-600 dark:text-red-400">{error}</p>}
      </ConfirmModal>
    </>
  );
}
