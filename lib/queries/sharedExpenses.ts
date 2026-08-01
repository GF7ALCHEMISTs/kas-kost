import { createClient } from "@/lib/supabase/server";
import type { SharedExpense, SessionDue } from "@/types/database.types";

export async function getSharedExpenses(
  sessionId: string,
  options: { withProof?: boolean } = {}
): Promise<SharedExpense[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("shared_expenses")
    .select("*, paid_by_profile:profiles!shared_expenses_paid_by_fkey(*)")
    .eq("session_id", sessionId)
    .order("expense_date", { ascending: false });

  if (error) throw error;
  const items = (data as SharedExpense[]) ?? [];

  if (!options.withProof) return items;

  return Promise.all(
    items.map(async (item) => {
      if (!item.proof_path) return { ...item, signedProofUrl: null };
      const { data: signed } = await supabase.storage.from("proofs").createSignedUrl(item.proof_path, 3600);
      return { ...item, signedProofUrl: signed?.signedUrl ?? null };
    })
  );
}

/** Tagihan rata per peserta, hanya ada setelah sesi masuk tahap pembayaran/ditutup */
export async function getSessionDues(
  sessionId: string,
  options: { withProof?: boolean } = {}
): Promise<SessionDue[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("session_dues")
    .select("*")
    .eq("session_id", sessionId)
    .order("created_at", { ascending: true });

  if (error) throw error;
  const dues = (data as SessionDue[]) ?? [];

  if (!options.withProof) return dues;

  return Promise.all(
    dues.map(async (due) => {
      if (!due.proof_path) return { ...due, signedProofUrl: null };
      const { data: signed } = await supabase.storage.from("proofs").createSignedUrl(due.proof_path, 3600);
      return { ...due, signedProofUrl: signed?.signedUrl ?? null };
    })
  );
}
