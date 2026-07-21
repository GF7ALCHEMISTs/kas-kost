"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { CurrencyInput } from "@/components/ui/CurrencyInput";
import { formatRupiah } from "@/lib/utils/currency";

export function EditDueAmountForm({
  periodId,
  currentAmount,
}: {
  periodId: string;
  currentAmount: number;
}) {
  const router = useRouter();
  const supabase = createClient();
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState(currentAmount);
  const [applyToUnpaid, setApplyToUnpaid] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    if (!amount || amount <= 0) {
      setError("Nominal harus lebih dari 0");
      return;
    }
    setLoading(true);
    setError(null);

    // 1) Simpan sebagai nominal default -> otomatis kepakai untuk periode
    //    berikutnya juga, karena close_period() mewarisi default_due_amount
    //    dari periode yang lagi ditutup.
    const { error: periodError } = await supabase
      .from("periods")
      .update({ default_due_amount: amount })
      .eq("id", periodId);

    if (periodError) {
      setError(periodError.message);
      setLoading(false);
      return;
    }

    // 2) Opsional: langsung samakan ke tagihan bulan ini yang masih 'unpaid'
    //    (yang sudah 'confirmed' sengaja tidak diubah, biar histori pembayaran tetap akurat).
    if (applyToUnpaid) {
      const { error: duesError } = await supabase
        .from("period_dues")
        .update({ amount_due: amount })
        .eq("period_id", periodId)
        .eq("status", "unpaid");

      if (duesError) {
        setError(duesError.message);
        setLoading(false);
        return;
      }
    }

    setLoading(false);
    setOpen(false);
    router.refresh();
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="text-xs font-medium text-indigo-600 dark:text-indigo-400 underline"
      >
        Ubah nominal iuran ({formatRupiah(currentAmount)}/orang)
      </button>
    );
  }

  return (
    <div className="rounded-2xl border dark:border-gray-800 p-4 space-y-3">
      <h3 className="font-semibold text-sm">Ubah Nominal Iuran Bulanan</h3>
      <CurrencyInput value={amount} onChange={setAmount} />

      <label className="flex items-start gap-2 text-xs text-gray-500 dark:text-gray-400">
        <input
          type="checkbox"
          checked={applyToUnpaid}
          onChange={(e) => setApplyToUnpaid(e.target.checked)}
          className="mt-0.5"
        />
        <span>
          Terapkan juga ke tagihan bulan ini yang belum dibayar. Kalau tidak dicentang, nominal
          baru cuma berlaku mulai bulan depan.
        </span>
      </label>

      {error && <p className="text-xs text-red-600 dark:text-red-400">{error}</p>}

      <div className="flex gap-2">
        <button
          onClick={() => {
            setOpen(false);
            setAmount(currentAmount);
            setError(null);
          }}
          disabled={loading}
          className="flex-1 py-2 rounded-lg text-sm font-medium bg-gray-100 dark:bg-gray-800"
        >
          Batal
        </button>
        <button
          onClick={handleSave}
          disabled={loading}
          className="flex-1 py-2 rounded-lg text-sm font-medium bg-indigo-600 text-white"
        >
          {loading ? "Menyimpan..." : "Simpan"}
        </button>
      </div>
    </div>
  );
}
