import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getActiveProfiles } from "@/lib/queries/expenses";
import { SharedExpenseForm } from "@/components/expenses/SharedExpenseForm";

export default async function EditLuarKasPage({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: item } = await supabase
    .from("shared_expenses")
    .select("*")
    .eq("id", params.id)
    .maybeSingle();

  if (!item) notFound();

  const profiles = await getActiveProfiles();

  let existingProofUrl: string | null = null;
  if (item.proof_path) {
    const { data } = await supabase.storage.from("proofs").createSignedUrl(item.proof_path, 3600);
    existingProofUrl = data?.signedUrl ?? null;
  }

  return (
    <div className="space-y-4">
      <h2 className="font-semibold">Edit Barang / Patungan</h2>
      <SharedExpenseForm
        sessionId={item.session_id}
        currentUserId={user.id}
        profiles={profiles}
        existingExpense={item}
        existingProofUrl={existingProofUrl}
      />
    </div>
  );
}
