"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import type { PeriodDue } from "@/types/database.types";

/**
 * Tombol khusus admin buat nandain semua orang yang belum bayar tagihan
 * bulanan (period_dues) jadi "confirmed" sekaligus, tanpa perlu masing-masing
 * orang upload bukti satu-satu. Tidak menyentuh proof_path, jadi kalau nanti
 * mereka tetap upload bukti manual itu tidak akan tertimpa/hilang.
 */
export function MarkAllPaidButton({ periodId, dues }: { periodId: string; dues: PeriodDue[] }) {
  const router = useRouter();
  const supabase = createClient();
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const unpaid = dues.filter((d) => d.status !== "confirmed");

  if (unpaid.length === 0) return null;

  async function handleConfirm() {
    setLoading(true);
    setError(null);
    const { error } = await supabase
      .from("period_dues")
      .update({ status: "confirmed", paid_at: new Date().toISOString() })
      .eq("period_id", periodId)
      .neq("status", "confirmed");

    setLoading(false);
    setShowConfirm(false);
    if (error) {
      setError(error.message);
      return;
    }
    router.refresh();
  }

  return (
    <div className="space-y-2">
      <button
        onClick={() => setShowConfirm(true)}
        className="w-full py-2 rounded-lg border border-violet-400 dark:border-violet-700 text-violet-600 dark:text-violet-400 text-sm font-medium"
      >
        Tandai Semua Sudah Bayar ({unpaid.length} orang)
      </button>
      {error && <p className="text-xs text-red-600 dark:text-red-400">{error}</p>}

      <ConfirmModal
        open={showConfirm}
        title="Konfirmasi Tandai Semua"
        loading={loading}
        onCancel={() => setShowConfirm(false)}
        onConfirm={handleConfirm}
      >
        <p>
          Tandai <span className="font-semibold">{unpaid.length} orang</span> yang belum bayar (
          {unpaid.map((d) => d.profiles?.full_name).filter(Boolean).join(", ")}) jadi{" "}
          <span className="font-semibold">Sudah Bayar</span> tanpa bukti transfer? Status langsung
          terlihat semua orang.
        </p>
      </ConfirmModal>
    </div>
  );
}
