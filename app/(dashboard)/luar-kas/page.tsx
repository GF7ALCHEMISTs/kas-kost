import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getSessions } from "@/lib/queries/sharedSessions";
import { SessionList } from "@/components/dashboard/SessionList";
import { NewSessionForm } from "@/components/dashboard/NewSessionForm";

export default async function LuarKasPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const sessions = await getSessions();

  return (
    <div className="space-y-4">
      <div className="rounded-xl bg-amber-50 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300 text-xs p-3">
        Sesi patungan di luar kas bulanan (misal beli-beli perlengkapan rumah). Tidak memengaruhi
        saldo kas bulanan, dan hutang antar sesi tidak saling terbawa.
      </div>

      <NewSessionForm currentUserId={user.id} />

      <h2 className="font-semibold pt-2">Semua Sesi</h2>
      <SessionList sessions={sessions} />
    </div>
  );
}
