import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getExpenseCategories, getActiveProfiles, getExpenseEditHistory } from "@/lib/queries/expenses";
import { ExpenseForm } from "@/components/expenses/ExpenseForm";

export default async function EditPengeluaranPage({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: expense } = await supabase
    .from("expenses")
    .select("*")
    .eq("id", params.id)
    .maybeSingle();

  if (!expense) notFound();

  const [categories, profiles, history] = await Promise.all([
    getExpenseCategories(),
    getActiveProfiles(),
    getExpenseEditHistory(expense.id),
  ]);

  let existingProofUrl: string | null = null;
  if (expense.proof_path) {
    const { data } = await supabase.storage.from("proofs").createSignedUrl(expense.proof_path, 3600);
    existingProofUrl = data?.signedUrl ?? null;
  }

  return (
    <div className="space-y-4">
      <h2 className="font-semibold">Edit Pengeluaran</h2>
      <ExpenseForm
        periodId={expense.period_id}
        currentUserId={user.id}
        categories={categories ?? []}
        profiles={profiles ?? []}
        existingExpense={expense}
        existingProofUrl={existingProofUrl}
      />

      {history && history.length > 0 && (
        <div className="rounded-xl border dark:border-gray-800 p-3 space-y-2">
          <p className="text-sm font-medium">Riwayat Edit</p>
          {history.map((h) => (
            <div key={h.id} className="text-xs text-gray-500 dark:text-gray-400 border-t dark:border-gray-800 pt-2">
              <p>{new Date(h.performed_at).toLocaleString("id-ID")}</p>
              <p>Alasan: {h.edit_reason}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
