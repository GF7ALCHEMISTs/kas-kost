"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import imageCompression from "browser-image-compression";
import { createClient } from "@/lib/supabase/client";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { formatRupiah } from "@/lib/utils/currency";
import type { PeriodDue } from "@/types/database.types";

/**
 * Begitu bukti transfer diupload, status LANGSUNG jadi 'confirmed' -> tidak ada
 * tahap "menunggu konfirmasi admin". Transparansi penuh: bukti langsung terlihat
 * semua penghuni. Konsisten dengan model "Di Luar Kas".
 */
export function PayDueForm({ due }: { due: PeriodDue }) {
  const router = useRouter();
  const supabase = createClient();
  const [file, setFile] = useState<File | null>(null);
  const [showRecap, setShowRecap] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleUpload() {
    if (!file) return;
    setLoading(true);
    setError(null);
    try {
      const compressed = await imageCompression(file, {
        maxSizeMB: 0.7,
        maxWidthOrHeight: 1600,
        useWebWorker: true,
      });
      const fileName = `dues/${due.period_id}/${due.user_id}-${crypto.randomUUID()}.jpg`;

      const { error: uploadError } = await supabase.storage
        .from("proofs")
        .upload(fileName, compressed, { contentType: "image/jpeg" });
      if (uploadError) throw uploadError;

      const { error: updateError } = await supabase
        .from("period_dues")
        .update({
          proof_path: fileName,
          status: "confirmed",
          paid_at: new Date().toISOString(),
        })
        .eq("id", due.id);
      if (updateError) throw updateError;

      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal upload, coba lagi.");
    } finally {
      setLoading(false);
      setShowRecap(false);
    }
  }

  if (due.status === "confirmed") {
    return <p className="text-sm text-green-600 dark:text-green-400 font-medium">Kamu sudah bayar ✓</p>;
  }

  return (
    <div className="space-y-3">
      <input
        type="file"
        accept="image/*"
        capture="environment"
        onChange={(e) => setFile(e.target.files?.[0] ?? null)}
        className="w-full text-sm text-gray-700 dark:text-gray-300"
      />
      {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
      <button
        disabled={!file}
        onClick={() => setShowRecap(true)}
        className="w-full py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-medium disabled:opacity-50"
      >
        Upload Bukti Transfer
      </button>

      <ConfirmModal
        open={showRecap}
        title="Konfirmasi Pembayaran"
        loading={loading}
        onCancel={() => setShowRecap(false)}
        onConfirm={handleUpload}
      >
        <p>
          Kamu akan mengirim bukti transfer untuk tagihan sebesar{" "}
          <span className="font-semibold">{formatRupiah(due.amount_due)}</span>. Ini langsung
          terlihat semua orang, tanpa perlu konfirmasi admin. Sudah benar?
        </p>
      </ConfirmModal>
    </div>
  );
}
