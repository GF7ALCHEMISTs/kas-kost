"use client";

import { useState, useEffect } from "react";
import { formatThousands, parseDigits } from "@/lib/utils/currency";

interface CurrencyInputProps {
  value: number;
  onChange: (rawValue: number) => void;
  placeholder?: string;
  id?: string;
  required?: boolean;
}

/**
 * Input nominal yang menampilkan format ribuan SECARA REAL-TIME saat mengetik.
 * Ini pencegahan utama untuk kasus typo "450.000 -> ketik jadi 4.500.000"
 * karena user langsung lihat hasil formatnya sebelum submit,
 * bukan menunggu sampai tersimpan baru sadar salah.
 */
export function CurrencyInput({
  value,
  onChange,
  placeholder = "0",
  id,
  required,
}: CurrencyInputProps) {
  const [display, setDisplay] = useState(value ? formatThousands(value) : "");

  useEffect(() => {
    setDisplay(value ? formatThousands(value) : "");
  }, [value]);

  return (
    <div className="relative">
      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400 text-sm">
        Rp
      </span>
      <input
        id={id}
        required={required}
        type="text"
        inputMode="numeric"
        value={display}
        placeholder={placeholder}
        onChange={(e) => {
          const raw = parseDigits(e.target.value);
          setDisplay(raw ? formatThousands(raw) : "");
          onChange(raw);
        }}
        className="w-full pl-9 pr-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 text-lg font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
    </div>
  );
}
