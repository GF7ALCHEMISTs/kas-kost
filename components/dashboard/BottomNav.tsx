"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function BottomNav({ isAdmin }: { isAdmin: boolean }) {
  const pathname = usePathname();
  const isLuarKas = pathname.startsWith("/luar-kas");

  const kasLinks = [
    { href: "/dashboard", label: "Dashboard" },
    { href: "/tagihan", label: "Tagihan" },
    { href: "/pengeluaran", label: "Pengeluaran" },
    isAdmin ? { href: "/admin/tutup-periode", label: "Admin" } : { href: "/histori", label: "Histori" },
  ];

  const luarKasLinks = [{ href: "/luar-kas", label: "Semua Sesi" }];

  const links = isLuarKas ? luarKasLinks : kasLinks;

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t dark:border-gray-800 max-w-md mx-auto">
      <div
        className={`grid text-xs text-center ${
          links.length === 1 ? "grid-cols-1" : links.length === 2 ? "grid-cols-2" : "grid-cols-4"
        }`}
      >
        {links.map((link) => (
          <Link key={link.href} href={link.href} className="py-3">
            {link.label}
          </Link>
        ))}
      </div>
    </nav>
  );
}
