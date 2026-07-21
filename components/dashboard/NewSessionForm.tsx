"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function NewSessionForm({ currentUserId }: { currentUserId: string }) {
  const router = useRouter();
  const supabase = createClient();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [targetAccount, setTargetAccount] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleCreate() {
    if (!title.trim()) {
      setError("Judul sesi wajib diisi.");
      return;
    }
    setLoading(true);
    setError(null);
    const { data, error } = await supabase
      .from("shared_sessions")
      .insert({
        title,
        opened_by: currentUserId,
        target_account_info: targetAccount.trim() || null,
      })
      .select()
      .single();
    setLoading(false);
    if (error) {
      setError(error.message);
      return;
    }
    router.push(`/luar-kas/sesi/${data.id}`);
    router.refresh();
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="w-full py-2.5 rounded-lg bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-medium"
      >
        + Buka Sesi Baru
      </button>
    );
  }

  return (
    <div className="rounded-2xl border dark:border-gray-800 p-4 space-y-3">
      <div>
        <label className="block text-sm font-medium mb-1">Judul Sesi</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Contoh: Isi Rumah Agustus 2026"
          className="w-full border dark:border-gray-700 rounded-lg px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Rekening tujuan transfer (opsional)</label>
        <input
          type="text"
          value={targetAccount}
          onChange={(e) => setTargetAccount(e.target.value)}
          placeholder="Contoh: BCA 1234567890 a.n. Nathanael"
          className="w-full border dark:border-gray-700 rounded-lg px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
        />
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
          Ditampilkan ke semua orang saat sesi ditutup, supaya semua transfer ke rekening yang sama.
        </p>
      </div>
      {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
      <div className="flex gap-2">
        <button onClick={() => setOpen(false)} className="flex-1 py-2 rounded-lg border dark:border-gray-800 text-sm font-medium">
          Batal
        </button>
        <button
          onClick={handleCreate}
          disabled={loading}
          className="flex-1 py-2 rounded-lg bg-gradient-to-r from-violet-600 to-indigo-600 text-white text-sm font-medium disabled:opacity-60"
        >
          {loading ? "Membuat..." : "Buka Sesi"}
        </button>
      </div>
    </div>
  );
}
