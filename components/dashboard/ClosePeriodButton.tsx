"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { ConfirmModal } from "@/components/ui/ConfirmModal";

export function ClosePeriodButton({
  periodId,
  adminId,
  minimal = false,
}: {
  periodId: string;
  adminId: string;
  minimal?: boolean;
}) {
  const router = useRouter();
  const supabase = createClient();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleClose() {
    setLoading(true);
    setError(null);
    // Panggil function Postgres close_period() -> atomic, aman dari dobel klik / race condition
    const { error } = await supabase.rpc("close_period", {
      p_period_id: periodId,
      p_admin_id: adminId,
    });

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
      {minimal ? (
        <button
          onClick={() => setOpen(true)}
          className="text-xs text-gray-400 dark:text-gray-500 underline"
        >
          Tutup manual sekarang (kalau auto-tutup gagal)
        </button>
      ) : (
        <button
          onClick={() => setOpen(true)}
          className="w-full py-2.5 rounded-lg bg-red-600 text-white font-medium"
        >
          Tutup Periode Ini
        </button>
      )}
      {error && <p className="text-sm text-red-600 dark:text-red-400 mt-2">{error}</p>}
      <ConfirmModal
        open={open}
        title="Tutup Periode?"
        loading={loading}
        onCancel={() => setOpen(false)}
        onConfirm={handleClose}
      >
        <p>
          Ini akan menutup bulan berjalan dan membuka periode baru dengan saldo awal = saldo akhir
          bulan ini. Tindakan ini tidak bisa dibatalkan. Sistem sudah otomatis menutup periode
          setiap tanggal 1, jadi ini cuma perlu dipakai kalau auto-tutup gagal.
        </p>
      </ConfirmModal>
    </>
  );
}
