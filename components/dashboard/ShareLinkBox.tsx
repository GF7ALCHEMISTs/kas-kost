"use client";

import { useState } from "react";

export function ShareLinkBox({ shareToken }: { shareToken: string }) {
  const [copied, setCopied] = useState(false);
  const url =
    typeof window !== "undefined"
      ? `${window.location.origin}/public/sesi/${shareToken}`
      : `/sesi/${shareToken}`;

  return (
    <div className="rounded-xl border dark:border-gray-800 p-3 space-y-2">
      <p className="text-sm font-medium">Link untuk Orang Tua</p>
      <p className="text-xs text-gray-500 dark:text-gray-400">
        Siapa pun yang punya link ini bisa lihat isi sesi (termasuk foto bukti) tanpa perlu login.
        Kirim hanya ke orang yang memang boleh lihat.
      </p>
      <div className="flex gap-2">
        <input
          readOnly
          value={url}
          className="flex-1 border dark:border-gray-700 rounded-lg px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-xs text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-950"
        />
        <button
          onClick={() => {
            navigator.clipboard.writeText(url);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
          }}
          className="px-3 py-2 rounded-lg bg-gradient-to-r from-violet-600 to-indigo-600 text-white text-xs font-medium"
        >
          {copied ? "Tersalin!" : "Salin"}
        </button>
      </div>
    </div>
  );
}
