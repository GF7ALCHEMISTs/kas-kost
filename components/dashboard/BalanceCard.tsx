import { formatRupiah } from "@/lib/utils/currency";

interface BalanceCardProps {
  saldoAwal: number;
  saldoAkhir: number;
  totalMasuk: number;
  totalKeluar: number;
  totalPenyesuaian?: number;
}

export function BalanceCard({
  saldoAwal,
  saldoAkhir,
  totalMasuk,
  totalKeluar,
  totalPenyesuaian = 0,
}: BalanceCardProps) {
  const isMinus = saldoAkhir < 0;

  return (
    <div
      className={`rounded-2xl text-white p-5 space-y-1 ${
        isMinus
          ? "bg-gradient-to-br from-red-600 to-red-700"
          : "bg-gradient-to-br from-violet-600 to-indigo-700"
      }`}
    >
      <p className="text-sm opacity-80">{isMinus ? "Kas Minus" : "Saldo Kas Saat Ini"}</p>
      <p className="text-3xl font-bold">{formatRupiah(saldoAkhir)}</p>

      {isMinus && (
        <p className="text-xs bg-white/15 rounded-lg px-2 py-1.5 mt-1">
          Pengeluaran lebih besar dari kas yang sudah dikonfirmasi. Kemungkinan ada tagihan yang
          belum dikonfirmasi, atau pengeluaran dicatat mendahului pemasukan. Selisih ini akan
          terbawa (carry) ke bulan depan sebagai kekurangan yang perlu ditutup.
        </p>
      )}

      <div className="flex justify-between text-xs opacity-90 pt-3">
        <span>Carry bulan lalu: {formatRupiah(saldoAwal)}</span>
      </div>
      <div className={`grid gap-2 pt-3 text-sm ${totalPenyesuaian !== 0 ? "grid-cols-3" : "grid-cols-2"}`}>
        <div className="bg-white/10 rounded-lg p-2">
          <p className="opacity-80 text-xs">Masuk bulan ini</p>
          <p className="font-semibold">{formatRupiah(totalMasuk)}</p>
        </div>
        <div className="bg-white/10 rounded-lg p-2">
          <p className="opacity-80 text-xs">Keluar bulan ini</p>
          <p className="font-semibold">{formatRupiah(totalKeluar)}</p>
        </div>
        {totalPenyesuaian !== 0 && (
          <div className="bg-white/10 rounded-lg p-2">
            <p className="opacity-80 text-xs">Penyesuaian</p>
            <p className="font-semibold">
              {totalPenyesuaian > 0 ? "+" : ""}
              {formatRupiah(totalPenyesuaian)}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

