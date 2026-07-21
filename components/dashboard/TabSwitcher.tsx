"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function TabSwitcher() {
  const pathname = usePathname();
  const isLuarKas = pathname.startsWith("/luar-kas");

  return (
    <div className="grid grid-cols-2 gap-1 bg-gray-100 dark:bg-gray-800 rounded-xl p-1 mx-4 mt-3">
      <Link
        href="/dashboard"
        className={`text-center text-sm font-medium py-1.5 rounded-lg ${
          !isLuarKas ? "bg-white dark:bg-gray-900 shadow text-indigo-600 dark:text-indigo-400" : "text-gray-500 dark:text-gray-400"
        }`}
      >
        Kas
      </Link>
      <Link
        href="/luar-kas"
        className={`text-center text-sm font-medium py-1.5 rounded-lg ${
          isLuarKas ? "bg-white dark:bg-gray-900 shadow text-indigo-600 dark:text-indigo-400" : "text-gray-500 dark:text-gray-400"
        }`}
      >
        Di Luar Kas
      </Link>
    </div>
  );
}
