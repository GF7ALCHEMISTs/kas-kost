/** Format angka mentah (450000) -> "Rp 450.000" */
export function formatRupiah(value: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(value);
}

/** Format angka mentah (450000) -> "450.000" (tanpa "Rp", untuk dipakai di input field) */
export function formatThousands(value: number): string {
  if (Number.isNaN(value)) return "";
  return new Intl.NumberFormat("id-ID").format(value);
}

/** Ambil hanya digit dari string input user, misal "450.000" -> 450000 */
export function parseDigits(input: string): number {
  const digitsOnly = input.replace(/\D/g, "");
  return digitsOnly ? parseInt(digitsOnly, 10) : 0;
}
