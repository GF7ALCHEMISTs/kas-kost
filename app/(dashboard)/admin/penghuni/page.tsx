import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { ToggleActiveButton } from "@/components/dashboard/ToggleActiveButton";
import { EditPhoneButton } from "@/components/dashboard/EditPhoneButton";
import { EditRoleButton } from "@/components/dashboard/EditRoleButton";

export default async function PenghuniPage() {
  const supabase = createClient();
  const { data: profiles } = await supabase
    .from("profiles")
    .select("*")
    .in("role", ["admin", "member", "parent"])
    .order("full_name");

  return (
    <div className="space-y-3">
      <h2 className="font-semibold">Kelola Penghuni</h2>
      <div className="grid grid-cols-2 gap-2 rounded-xl bg-gray-100 p-1 text-center text-sm dark:bg-gray-800">
        <Link href="/admin/tutup-periode" className="rounded-lg py-2 font-medium text-gray-600 dark:text-gray-300">
          Tutup Periode
        </Link>
        <Link href="/admin/penghuni" className="rounded-lg bg-white py-2 font-medium text-indigo-600 shadow-sm dark:bg-gray-900 dark:text-indigo-400">
          Kelola Penghuni
        </Link>
      </div>
      {(profiles ?? []).map((p) => (
        <div key={p.id} className="rounded-xl border dark:border-gray-800 p-3 flex justify-between items-center">
          <div>
            <p className="font-medium text-sm">
              {p.full_name}{" "}
              <span className="text-xs text-indigo-600 dark:text-indigo-400">({p.role})</span>
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">{p.is_active ? "Aktif" : `Pindah sejak ${p.left_at}`}</p>
            <p className="text-xs text-gray-400 dark:text-gray-500">{p.phone ? p.phone : "Belum ada no. HP"}</p>
          </div>
          <div className="flex flex-col gap-2 items-end">
            <ToggleActiveButton profileId={p.id} isActive={p.is_active} />
            <EditPhoneButton profileId={p.id} phone={p.phone} />
            {p.role !== "admin" && <EditRoleButton profileId={p.id} role={p.role} />}
          </div>
        </div>
      ))}
      <p className="text-xs text-gray-400 dark:text-gray-500">
        Catatan: menonaktifkan penghuni tidak menghapus data historis — tagihan & pengeluaran lama tetap tersimpan.
        Tambah penghuni baru dilakukan lewat Supabase Auth (buat user baru + isi baris profiles), belum ada tombol tambah otomatis di MVP ini.
      </p>
    </div>
  );
}
