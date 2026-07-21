import { notFound } from "next/navigation";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { formatRupiah } from "@/lib/utils/currency";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import type { SharedExpense, SessionDue } from "@/types/database.types";

// Halaman ini bergantung pada data yang bisa berubah kapan saja (sesi baru,
// expense baru, dll), jadi jangan pernah di-cache oleh Next.js -> selalu
// fetch data terbaru dari Supabase setiap request.
export const dynamic = "force-dynamic";
export const revalidate = 0;

async function getSignedUrl(supabase: ReturnType<typeof createServiceRoleClient>, path: string | null) {
  if (!path) return null;
  const { data } = await supabase.storage.from("proofs").createSignedUrl(path, 3600);
  return data?.signedUrl ?? null;
}

export default async function PublicSessionPage({ params }: { params: { token: string } }) {
  const supabase = createServiceRoleClient();

  const { data: session, error: sessionError } = await supabase
    .from("shared_sessions")
    .select("*")
    .eq("share_token", params.token)
    .maybeSingle();

  if (sessionError) {
    // eslint-disable-next-line no-console
    console.error("[public-session] query error:", sessionError.message, sessionError);
  }

  if (!session) notFound();

  const { data: items } = await supabase
    .from("shared_expenses")
    .select("*, paid_by_profile:profiles!shared_expenses_paid_by_fkey(*)")
    .eq("session_id", session.id)
    .eq("status", "active")
    .order("expense_date", { ascending: false });

  const activeItems = (items as SharedExpense[]) ?? [];
  const totalAmount = activeItems.reduce((sum, e) => sum + Number(e.amount), 0);

  let dues: SessionDue[] = [];
  if (session.status !== "open") {
    const { data: duesData } = await supabase
      .from("session_dues")
      .select("*")
      .eq("session_id", session.id);
    dues = (duesData as SessionDue[]) ?? [];
  }

  const itemsWithSignedUrls = await Promise.all(
    activeItems.map(async (item) => ({
      ...item,
      signedProofUrl: await getSignedUrl(supabase, item.proof_path),
    }))
  );

  return (
    <div className="max-w-md mx-auto min-h-screen p-4 space-y-4 bg-gray-50 dark:bg-gray-950">
      <header className="text-center pt-2 relative">
        <div className="absolute top-2 right-0">
          <ThemeToggle />
        </div>
        <p className="text-xs text-gray-400 dark:text-gray-500">Laporan Patungan (tampilan lihat saja)</p>
        <h1 className="text-lg font-bold">{session.title}</h1>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          {session.status === "open" ? "Sesi masih berjalan" : session.status === "awaiting_payment" ? "Menunggu pembayaran" : "Sesi sudah ditutup"}
        </p>
      </header>

      <div className="rounded-2xl bg-white dark:bg-gray-900 border dark:border-gray-800 p-4 text-center">
        <p className="text-sm text-gray-500 dark:text-gray-400">Total Pengeluaran</p>
        <p className="text-2xl font-bold">{formatRupiah(totalAmount)}</p>
      </div>

      {session.status !== "open" && (
        <div className="rounded-2xl bg-white dark:bg-gray-900 border dark:border-gray-800 p-4 space-y-2">
          <h3 className="font-semibold text-sm">Tagihan Per Orang</h3>
          {session.target_account_info && (
            <p className="text-xs text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-900/30 rounded-lg p-2">
              Transfer ke: <span className="font-semibold">{session.target_account_info}</span>
            </p>
          )}
          {dues.map((due) => (
            <div key={due.id} className="flex justify-between text-sm">
              <span>{due.participant_name}</span>
              <span className={due.status === "paid" ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}>
                {formatRupiah(due.amount_due)} · {due.status === "paid" ? "Sudah Transfer" : "Belum"}
              </span>
            </div>
          ))}
        </div>
      )}

      <div className="space-y-2">
        <h3 className="font-semibold text-sm">Rincian Barang</h3>
        {itemsWithSignedUrls.map((item) => (
          <div key={item.id} className="rounded-xl bg-white dark:bg-gray-900 border dark:border-gray-800 p-3">
            <div className="flex justify-between">
              <div>
                <p className="font-medium text-sm">{item.title}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Dibeli oleh {item.paid_by_profile?.full_name} · {item.expense_date}
                </p>
                {item.notes && <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{item.notes}</p>}
              </div>
              <p className="font-semibold text-sm">{formatRupiah(item.amount)}</p>
            </div>
            {item.signedProofUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={item.signedProofUrl}
                alt={`Bukti ${item.title}`}
                className="mt-2 rounded-lg w-full max-h-64 object-cover"
              />
            )}
          </div>
        ))}
      </div>

      <p className="text-center text-[10px] text-gray-400 dark:text-gray-500 pt-2">
        Link ini bisa dilihat siapa saja yang memegangnya, tanpa perlu login.
      </p>
    </div>
  );
}
