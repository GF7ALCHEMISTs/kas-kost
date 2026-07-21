"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import imageCompression from "browser-image-compression";
import { createClient } from "@/lib/supabase/client";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { formatRupiah } from "@/lib/utils/currency";
import type { SessionDue } from "@/types/database.types";

export function AdminSessionDueForm({ due }: { due: SessionDue }) {
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
      const fileName = `session-dues/${due.session_id}/${due.id}-${crypto.randomUUID()}.jpg`;

      const { error: uploadError } = await supabase.storage
        .from("proofs")
        .upload(fileName, compressed, { contentType: "image/jpeg" });
      if (uploadError) throw uploadError;

      const { error: updateError } = await supabase
        .from("session_dues")
        .update({
          proof_path: fileName,
          status: "paid",
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

  async function handleUndo() {
    setLoading(true);
    setError(null);
    const { error } = await supabase
      .from("session_dues")
      .update({ status: "unpaid", paid_at: null })
      .eq("id", due.id);
    setLoading(false);
    if (error) {
      setError(error.message);
      return;
    }
    router.refresh();
  }

  if (due.status === "paid") {
    return (
      <div className="flex items-center justify-between">
        <p className="text-sm text-green-600 dark:text-green-400 font-medium">Sudah bayar ✓</p>
        <button onClick={handleUndo} disabled={loading} className="text-xs text-gray-400 underline">
          Batalkan
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <input
        type="file"
        accept="image/*"
        capture="environment"
        onChange={(e) => setFile(e.target.files?.[0] ?? null)}
        className="w-full text-xs"
      />
      {error && <p className="text-xs text-red-600 dark:text-red-400">{error}</p>}
      <button
        disabled={!file}
        onClick={() => setShowRecap(true)}
        className="w-full py-2 rounded-lg bg-gradient-to-r from-violet-600 to-indigo-600 text-white text-sm font-medium disabled:opacity-50"
      >
        Tandai Sudah Bayar
      </button>

      <ConfirmModal
        open={showRecap}
        title="Konfirmasi Pembayaran"
        loading={loading}
        onCancel={() => setShowRecap(false)}
        onConfirm={handleUpload}
      >
        <p>
          Tandai <span className="font-semibold">{due.participant_name}</span> sudah transfer{" "}
          <span className="font-semibold">{formatRupiah(due.amount_due)}</span>? Bukti ini langsung
          terlihat siapa pun yang punya link sesi.
        </p>
      </ConfirmModal>
    </div>
  );
}
