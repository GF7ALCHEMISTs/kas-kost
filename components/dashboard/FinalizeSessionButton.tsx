"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { ConfirmModal } from "@/components/ui/ConfirmModal";

export function FinalizeSessionButton({
  sessionId,
  adminId,
  unpaidCount,
}: {
  sessionId: string;
  adminId: string;
  unpaidCount: number;
}) {
  const router = useRouter();
  const supabase = createClient();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFinalize() {
    setLoading(true);
    setError(null);
    const { error } = await supabase
      .from("shared_sessions")
      .update({ status: "closed", closed_at: new Date().toISOString(), closed_by: adminId })
      .eq("id", sessionId);

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    setLoading(false);
    setOpen(false);
    router.refresh();
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="w-full py-2.5 rounded-lg bg-green-600 text-white font-medium"
      >
        Sudah Bayar Semua
      </button>
      {error && <p className="text-sm text-red-600 dark:text-red-400 mt-2">{error}</p>}
      <ConfirmModal
        open={open}
        title="Tutup Sesi Final?"
        loading={loading}
        onCancel={() => setOpen(false)}
        onConfirm={handleFinalize}
      >
        <p>
          {unpaidCount > 0
            ? `Masih ada ${unpaidCount} orang yang belum ditandai bayar. `
            : "Semua peserta sudah ditandai bayar. "}
          Sesi akan dikunci final dan tidak bisa ditambah peserta lagi. Tindakan ini tidak bisa
          dibatalkan.
        </p>
      </ConfirmModal>
    </>
  );
}
