"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import type { SessionDue } from "@/types/database.types";

export function MemberDueStatus({ due }: { due: SessionDue }) {
  const [open, setOpen] = useState(false);
  const canExpand = due.status === "paid";

  return (
    <div className="space-y-1.5">
      <button
        type="button"
        disabled={!canExpand}
        onClick={() => setOpen((v) => !v)}
        className={`flex items-center gap-1 text-xs disabled:cursor-default ${
          due.status === "paid" ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
        }`}
      >
        {due.status === "paid" ? "Sudah bayar ✓" : "Belum bayar"}
        {canExpand && (
          <ChevronDown size={12} className={`transition-transform ${open ? "rotate-180" : ""}`} />
        )}
      </button>
      {open && canExpand && (
        due.signedProofUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={due.signedProofUrl}
            alt={`Bukti transfer ${due.participant_name}`}
            className="max-w-full rounded-xl border border-gray-200 dark:border-gray-700"
          />
        ) : (
          <p className="text-xs text-gray-400 dark:text-gray-500">Bukti tidak tersedia.</p>
        )
      )}
    </div>
  );
}
