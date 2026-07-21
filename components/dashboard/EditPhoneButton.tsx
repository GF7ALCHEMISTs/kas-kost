"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function EditPhoneButton({
  profileId,
  phone,
}: {
  profileId: string;
  phone: string | null;
}) {
  const router = useRouter();
  const supabase = createClient();
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState(phone ?? "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    setLoading(true);
    setError(null);

    // Normalisasi: buang spasi/strip, ubah awalan 0 jadi 62 (format WA: 62xxxxxxxxxx)
    let normalized = value.trim().replace(/[\s-]/g, "");
    if (normalized.startsWith("0")) normalized = `62${normalized.slice(1)}`;
    if (normalized.startsWith("+")) normalized = normalized.slice(1);

    const { error } = await supabase
      .from("profiles")
      .update({ phone: normalized || null })
      .eq("id", profileId);

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
        className="px-3 py-1.5 rounded-lg text-xs font-medium bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300"
      >
        {phone ? "Edit No. HP" : "Tambah No. HP"}
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white dark:bg-gray-900 p-4 space-y-3">
            <h3 className="font-semibold text-sm">Edit Nomor Telepon</h3>
            <input
              type="tel"
              inputMode="numeric"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="08xxxxxxxxxx atau 62xxxxxxxxxx"
              className="w-full rounded-lg border dark:border-gray-700 bg-transparent px-3 py-2 text-sm"
              autoFocus
            />
            <p className="text-xs text-gray-400 dark:text-gray-500">
              Nomor ini dipakai untuk kirim reminder tagihan lewat WhatsApp. Format akan otomatis
              disesuaikan (0812... → 62812...).
            </p>
            {error && <p className="text-xs text-red-600 dark:text-red-400">{error}</p>}
            <div className="flex gap-2 pt-1">
              <button
                onClick={() => setOpen(false)}
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
        </div>
      )}
    </>
  );
}
