"use client";

import { useRouter } from "next/navigation";
import type { Period } from "@/types/database.types";

const BULAN = [
  "", "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember",
];

export function PeriodSelector({
  periods,
  selectedPeriodId,
  basePath,
}: {
  periods: Period[];
  selectedPeriodId: string;
  basePath: string;
}) {
  const router = useRouter();

  return (
    <select
      value={selectedPeriodId}
      onChange={(e) => router.push(`${basePath}?period=${e.target.value}`)}
      className="rounded-lg border dark:border-gray-800 bg-transparent px-3 py-1.5 text-sm"
    >
      {periods.map((p) => (
        <option key={p.id} value={p.id} className="text-black">
          {BULAN[p.month]} {p.year}
          {p.status === "open" ? " (Aktif)" : ""}
        </option>
      ))}
    </select>
  );
}
