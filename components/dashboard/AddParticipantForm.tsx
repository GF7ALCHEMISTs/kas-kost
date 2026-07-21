"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function AddParticipantForm({ sessionId, adminId }: { sessionId: string; adminId: string }) {
  const router = useRouter();
  const supabase = createClient();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleAdd() {
    if (!name.trim()) {
      setError("Nama wajib diisi.");
      return;
    }
    setLoading(true);
    setError(null);
    const { error } = await supabase.rpc("add_session_participant", {
      p_session_id: sessionId,
      p_admin_id: adminId,
      p_name: name.trim(),
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    setLoading(false);
    setName("");
    setOpen(false);
    router.refresh();
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="text-xs font-medium text-indigo-600 dark:text-indigo-400"
      >
        + Tambah Peserta Lagi
      </button>
    );
  }

  return (
    <div className="rounded-xl border dark:border-gray-800 p-3 space-y-2">
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Nama peserta baru"
        className="w-full border dark:border-gray-700 rounded-lg px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm"
        autoFocus
      />
      <p className="text-xs text-gray-400 dark:text-gray-500">
        Pembagian akan dihitung ulang rata ke semua peserta (termasuk yang baru). Kalau ada yang
        sudah bayar dengan nominal lama, cek ulang manual ya.
      </p>
      {error && <p className="text-xs text-red-600 dark:text-red-400">{error}</p>}
      <div className="flex gap-2">
        <button
          onClick={() => {
            setOpen(false);
            setName("");
            setError(null);
          }}
          disabled={loading}
          className="flex-1 py-2 rounded-lg text-sm font-medium bg-gray-100 dark:bg-gray-800"
        >
          Batal
        </button>
        <button
          onClick={handleAdd}
          disabled={loading}
          className="flex-1 py-2 rounded-lg text-sm font-medium bg-indigo-600 text-white"
        >
          {loading ? "Menambah..." : "Tambah"}
        </button>
      </div>
    </div>
  );
}
