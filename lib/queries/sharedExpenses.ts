import { createClient } from "@/lib/supabase/server";
import type { SharedExpense, SessionDue } from "@/types/database.types";

export async function getSharedExpenses(sessionId: string): Promise<SharedExpense[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("shared_expenses")
    .select("*, paid_by_profile:profiles!shared_expenses_paid_by_fkey(*)")
    .eq("session_id", sessionId)
    .order("expense_date", { ascending: false });

  if (error) throw error;
  return (data as SharedExpense[]) ?? [];
}

/** Tagihan rata per peserta, hanya ada setelah sesi masuk tahap pembayaran/ditutup */
export async function getSessionDues(sessionId: string): Promise<SessionDue[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("session_dues")
    .select("*")
    .eq("session_id", sessionId)
    .order("created_at", { ascending: true });

  if (error) throw error;
  return (data as SessionDue[]) ?? [];
}
