"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function ToggleActiveButton({
  profileId,
  isActive,
}: {
  profileId: string;
  isActive: boolean;
}) {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(false);

  async function handleToggle() {
    setLoading(true);
    await supabase
      .from("profiles")
      .update({
        is_active: !isActive,
        left_at: !isActive ? null : new Date().toISOString().slice(0, 10),
      })
      .eq("id", profileId);
    setLoading(false);
    router.refresh();
  }

  return (
    <button
      onClick={handleToggle}
      disabled={loading}
      className={`px-3 py-1.5 rounded-lg text-xs font-medium ${
        isActive
          ? "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300"
          : "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300"
      }`}
    >
      {isActive ? "Nonaktifkan (Pindah)" : "Aktifkan Kembali"}
    </button>
  );
}
