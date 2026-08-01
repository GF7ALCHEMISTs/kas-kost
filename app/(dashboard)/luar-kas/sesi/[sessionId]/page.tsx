import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getSessionById } from "@/lib/queries/sharedSessions";
import { getSharedExpenses, getSessionDues } from "@/lib/queries/sharedExpenses";
import { SharedExpenseList } from "@/components/expenses/SharedExpenseList";
import { SessionDuesList } from "@/components/dashboard/SessionDuesList";
import { SplitSetupForm } from "@/components/dashboard/SplitSetupForm";
import { AddParticipantForm } from "@/components/dashboard/AddParticipantForm";
import { FinalizeSessionButton } from "@/components/dashboard/FinalizeSessionButton";
import { ShareLinkBox } from "@/components/dashboard/ShareLinkBox";
import { AdminSessionDueForm } from "@/components/dues/AdminSessionDueForm";
import { MemberDueStatus } from "@/components/dues/MemberDueStatus";
import { formatRupiah } from "@/lib/utils/currency";

export default async function SesiDetailPage({ params }: { params: { sessionId: string } }) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single();
  const isAdmin = profile?.role === "admin";

  const session = await getSessionById(params.sessionId);
  if (!session) notFound();

  const items = await getSharedExpenses(session.id, { withProof: true });
  const totalAmount = items
    .filter((i) => i.status === "active")
    .reduce((sum, i) => sum + Number(i.amount), 0);

  const isOpen = session.status === "open";
  const isAwaitingPayment = session.status === "awaiting_payment";
  const isClosed = session.status === "closed";

  const dues = !isOpen ? await getSessionDues(session.id, { withProof: true }) : [];
  const unpaidCount = dues.filter((d) => d.status === "unpaid").length;

  const statusLabel = isOpen ? "Sesi masih berjalan" : isAwaitingPayment ? "Menunggu pembayaran" : "Sesi sudah ditutup";

  return (
    <div className="space-y-4">
      <div>
        <h2 className="font-semibold">{session.title}</h2>
        <p className="text-xs text-gray-500 dark:text-gray-400">{statusLabel}</p>
      </div>

      <ShareLinkBox shareToken={session.share_token} />

      <div className="rounded-2xl border dark:border-gray-800 p-4 text-center">
        <p className="text-sm text-gray-500 dark:text-gray-400">Total Pengeluaran</p>
        <p className="text-2xl font-bold">{formatRupiah(totalAmount)}</p>
      </div>

      {isOpen && (
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-sm">Daftar Barang</h3>
          <Link href={`/luar-kas/sesi/${session.id}/tambah`} className="text-sm text-indigo-600 dark:text-indigo-400 font-medium">
            + Tambah
          </Link>
        </div>
      )}
      {!isOpen && <h3 className="font-semibold text-sm">Daftar Barang</h3>}

      <SharedExpenseList items={items} />

      {isOpen && isAdmin && (
        <SplitSetupForm sessionId={session.id} closerId={user.id} totalAmount={totalAmount} />
      )}
      {isOpen && !isAdmin && (
        <p className="text-xs text-gray-400 dark:text-gray-500 text-center">
          Menunggu admin menutup sesi ini dan membagi rata.
        </p>
      )}

      {isAwaitingPayment && (
        <>
          {session.target_account_info && (
            <div className="rounded-xl bg-indigo-50 dark:bg-indigo-900/30 text-indigo-800 dark:text-indigo-300 text-sm p-3">
              Transfer ke: <span className="font-semibold">{session.target_account_info}</span>
            </div>
          )}
          <div className="rounded-2xl border dark:border-gray-800 p-4 space-y-4">
            <h3 className="font-semibold text-sm">Tagihan Per Orang</h3>
            {dues.map((due) => (
              <div key={due.id} className="space-y-1.5 border-b last:border-b-0 dark:border-gray-800 pb-3 last:pb-0">
                <div className="flex justify-between text-sm">
                  <span className="font-medium">{due.participant_name}</span>
                  <span>{formatRupiah(due.amount_due)}</span>
                </div>
                {isAdmin ? (
                  <AdminSessionDueForm due={due} />
                ) : (
                  <MemberDueStatus due={due} />
                )}
              </div>
            ))}
          </div>

          {isAdmin && (
            <>
              <AddParticipantForm sessionId={session.id} adminId={user.id} />
              <FinalizeSessionButton sessionId={session.id} adminId={user.id} unpaidCount={unpaidCount} />
            </>
          )}
        </>
      )}

      {isClosed && (
        <>
          {session.target_account_info && (
            <div className="rounded-xl bg-indigo-50 dark:bg-indigo-900/30 text-indigo-800 dark:text-indigo-300 text-sm p-3">
              Transfer ke: <span className="font-semibold">{session.target_account_info}</span>
            </div>
          )}
          <SessionDuesList dues={dues} />
        </>
      )}
    </div>
  );
}
