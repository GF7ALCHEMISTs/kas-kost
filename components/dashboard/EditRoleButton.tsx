"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { UserRole } from "@/types/database.types";

const editableRoles: { value: UserRole; label: string }[] = [
  { value: "member", label: "Member" },
  { value: "parent", label: "Parent" },
];

export function EditRoleButton({
  profileId,
  role,
}: {
  profileId: string;
  role: UserRole;
}) {
  const router = useRouter();
  const supabase = createClient();
  const [value, setValue] = useState<UserRole>(role === "admin" ? "member" : role);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    setLoading(true);
    setError(null);

    const { error } = await supabase.from("profiles").update({ role: value }).eq("id", profileId);

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    setLoading(false);
    router.refresh();
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <div className="flex gap-2">
        <select
          value={value}
          onChange={(e) => setValue(e.target.value as UserRole)}
          disabled={loading}
          className="rounded-lg border border-gray-300 bg-white px-2 py-1.5 text-xs text-gray-800 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
        >
          {editableRoles.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={handleSave}
          disabled={loading || value === role}
          className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white disabled:opacity-50"
        >
          {loading ? "..." : "Ubah Role"}
        </button>
      </div>
      {error && <p className="max-w-48 text-right text-xs text-red-600 dark:text-red-400">{error}</p>}
    </div>
  );
}
