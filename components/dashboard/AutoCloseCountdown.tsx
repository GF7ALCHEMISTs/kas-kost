"use client";

import { useEffect, useState } from "react";

function getNextFirstOfMonth(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth() + 1, 1, 0, 0, 0);
}

function getTimeParts(targetMs: number) {
  const diff = Math.max(0, targetMs - Date.now());
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((diff / (1000 * 60)) % 60);
  return { days, hours, minutes };
}

export function AutoCloseCountdown() {
  const [target] = useState(() => getNextFirstOfMonth().getTime());
  const [parts, setParts] = useState(() => getTimeParts(target));

  useEffect(() => {
    const interval = setInterval(() => setParts(getTimeParts(target)), 60_000);
    return () => clearInterval(interval);
  }, [target]);

  return (
    <div className="rounded-2xl border dark:border-gray-800 p-4 space-y-1">
      <p className="text-sm text-gray-500 dark:text-gray-400">Periode ini ditutup otomatis dalam</p>
      <p className="text-2xl font-bold">
        {parts.days} hari {parts.hours} jam {parts.minutes} menit
      </p>
      <p className="text-xs text-gray-400 dark:text-gray-500">
        Sistem otomatis menutup periode & membuka bulan baru setiap tanggal 1, tanpa perlu ditutup
        manual.
      </p>
    </div>
  );
}
