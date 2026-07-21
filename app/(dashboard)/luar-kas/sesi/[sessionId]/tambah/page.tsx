import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getSessionById } from "@/lib/queries/sharedSessions";
import { getActiveProfiles } from "@/lib/queries/expenses";
import { SharedExpenseForm } from "@/components/expenses/SharedExpenseForm";

export default async function TambahBarangPage({ params }: { params: { sessionId: string } }) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const session = await getSessionById(params.sessionId);
  if (!session) notFound();

  if (session.status !== "open") {
    redirect(`/luar-kas/sesi/${session.id}`);
  }

  const profiles = await getActiveProfiles();

  return (
    <div className="space-y-4">
      <h2 className="font-semibold">Tambah Barang — {session.title}</h2>
      <SharedExpenseForm sessionId={session.id} currentUserId={user.id} profiles={profiles} />
    </div>
  );
}
