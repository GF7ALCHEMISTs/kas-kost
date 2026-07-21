"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { formatRupiah } from "@/lib/utils/currency";

export function SplitSetupForm({
  sessionId,
  closerId,
  totalAmount,
}: {
  sessionId: string;
  closerId: string;
  totalAmount: number;
}) {
  const router = useRouter();
  const supabase = createClient();
  const [names, setNames] = useState<string[]>(["", "", ""]);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cleanNames = names.map((n) => n.trim()).filter(Boolean);
  const n = cleanNames.length;
  const perPerson = n > 0 ? Math.floor(totalAmount / n) : 0;

  function updateName(i: number, value: string) {
    setNames((prev) => prev.map((n, idx) => (idx === i ? value : n)));
  }

  function addRow() {
    setNames((prev) => [...prev, ""]);
  }

  function removeRow(i: number) {
    setNames((prev) => prev.filter((_, idx) => idx !== i));
  }

  async function handleConfirm() {
    setLoading(true);
    setError(null);
    const { error } = await supabase.rpc("open_session_payment", {
      p_session_id: sessionId,
      p_closer_id: closerId,
      p_names: cleanNames,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    setLoading(false);
    setShowConfirm(false);
    router.refresh();
  }

  return (
    <div className="rounded-2xl border dark:border-gray-800 p-4 space-y-3">
      <h3 className="font-semibold text-sm">Tutup Sesi & Bagi Rata</h3>
      <p className="text-xs text-gray-500 dark:text-gray-400">
        Pilih siapa saja yang ikut patungan kali ini. Nama bebas diketik, tidak harus penghuni
        terdaftar.
      </p>

      <div className="space-y-2">
        {names.map((name, i) => (
          <div key={i} className="flex gap-2">
            <input
              type="text"
              value={name}
              onChange={(e) => updateName(i, e.target.value)}
              placeholder={`Nama orang ${i + 1}`}
              className="flex-1 border dark:border-gray-700 rounded-lg px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm"
            />
            {names.length > 1 && (
              <button
                onClick={() => removeRow(i)}
                className="px-2 text-gray-400 hover:text-red-500 text-sm"
                aria-label="Hapus"
              >
                ✕
              </button>
            )}
          </div>
        ))}
      </div>

      <button
        onClick={addRow}
        className="text-xs font-medium text-indigo-600 dark:text-indigo-400"
      >
        + Tambah Orang
      </button>

      <div className="rounded-xl bg-gray-50 dark:bg-gray-900 p-3 text-sm">
        Total <span className="font-semibold">{formatRupiah(totalAmount)}</span> : {n || 0} orang ={" "}
        <span className="font-semibold">{formatRupiah(perPerson)}</span>/orang
      </div>

      {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

      <button
        onClick={() => setShowConfirm(true)}
        disabled={n === 0}
        className="w-full py-2.5 rounded-lg bg-red-600 text-white font-medium disabled:opacity-50"
      >
        Hitung & Buka Tagihan
      </button>

      <ConfirmModal
        open={showConfirm}
        title="Buka Tagihan?"
        loading={loading}
        onCancel={() => setShowConfirm(false)}
        onConfirm={handleConfirm}
      >
        <p>
          Sesi akan dikunci dari penambahan barang baru, dan tagihan untuk {n} orang langsung
          muncul (≈{formatRupiah(perPerson)}/orang). Kamu masih bisa menambah peserta & upload
          bukti bayar sebelum pencet &ldquo;Sudah Bayar Semua&rdquo; nanti.
        </p>
      </ConfirmModal>
    </div>
  );
}
