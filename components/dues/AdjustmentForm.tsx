"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { formatRupiah } from "@/lib/utils/currency";

export function AdjustmentForm({ periodId }: { periodId: string }) {
  const router = useRouter();
  const supabase = createClient();
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<"tambah" | "kurang">("tambah");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const parsedAmount = Number(amount);
  const isValid = parsedAmount > 0 && note.trim().length > 0;

  function resetAndClose() {
    setOpen(false);
    setShowConfirm(false);
    setAmount("");
    setNote("");
    setType("tambah");
    setError(null);
  }

  async function handleConfirm() {
    setLoading(true);
    setError(null);
    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();
      if (userError) throw userError;
      if (!user) throw new Error("User belum login.");

      const { error: insertError } = await supabase.from("manual_adjustments").insert({
        period_id: periodId,
        type,
        amount: parsedAmount,
        note: note.trim(),
        created_by: user.id,
      });
      if (insertError) throw insertError;

      resetAndClose();
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menyimpan, coba lagi.");
    } finally {
      setLoading(false);
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="w-full py-2 rounded-lg border border-violet-400 dark:border-violet-700 text-violet-600 dark:text-violet-400 text-sm font-medium"
      >
        + Penyesuaian Saldo Manual
      </button>
    );
  }

  return (
    <div className="rounded-2xl border dark:border-gray-800 p-4 space-y-3">
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setType("tambah")}
          className={`flex-1 py-2 rounded-lg text-sm font-medium border ${
            type === "tambah"
              ? "bg-green-600 text-white border-green-600"
              : "border-gray-300 dark:border-gray-700 text-gray-600 dark:text-gray-300"
          }`}
        >
          + Tambah Uang
        </button>
        <button
          type="button"
          onClick={() => setType("kurang")}
          className={`flex-1 py-2 rounded-lg text-sm font-medium border ${
            type === "kurang"
              ? "bg-red-600 text-white border-red-600"
              : "border-gray-300 dark:border-gray-700 text-gray-600 dark:text-gray-300"
          }`}
        >
          − Kurangi Uang
        </button>
      </div>

      <input
        type="number"
        inputMode="numeric"
        placeholder="Jumlah (Rp)"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        className="w-full rounded-lg border dark:border-gray-800 bg-transparent px-3 py-2 text-sm"
      />
      <input
        type="text"
        placeholder="Alasan / keterangan (wajib diisi)"
        value={note}
        onChange={(e) => setNote(e.target.value)}
        className="w-full rounded-lg border dark:border-gray-800 bg-transparent px-3 py-2 text-sm"
      />

      {error && <p className="text-xs text-red-600 dark:text-red-400">{error}</p>}

      <div className="flex gap-2">
        <button
          onClick={resetAndClose}
          disabled={loading}
          className="flex-1 py-2 rounded-lg border dark:border-gray-800 text-sm font-medium"
        >
          Batal
        </button>
        <button
          disabled={!isValid}
          onClick={() => setShowConfirm(true)}
          className="flex-1 py-2 rounded-lg bg-gradient-to-r from-violet-600 to-indigo-600 text-white text-sm font-medium disabled:opacity-50"
        >
          Simpan
        </button>
      </div>

      <ConfirmModal
        open={showConfirm}
        title="Konfirmasi Penyesuaian Saldo"
        loading={loading}
        onCancel={() => setShowConfirm(false)}
        onConfirm={handleConfirm}
      >
        <p>
          {type === "tambah" ? "Menambah" : "Mengurangi"} saldo kas sebesar{" "}
          <span className="font-semibold">{formatRupiah(parsedAmount || 0)}</span> dengan
          keterangan &quot;{note}&quot;? Perubahan ini langsung terlihat semua orang dan langsung
          memengaruhi Saldo Kas.
        </p>
      </ConfirmModal>
    </div>
  );
}
