import { createClient } from "@/lib/supabase/server";
import type { Expense, ExpenseCategory, Profile } from "@/types/database.types";

export async function getExpensesForPeriod(periodId: string): Promise<Expense[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("expenses")
    .select("*, expense_categories(*), paid_by_profile:profiles!expenses_paid_by_fkey(*)")
    .eq("period_id", periodId)
    .order("expense_date", { ascending: false });

  if (error) throw error;
  return (data as Expense[]) ?? [];
}

export async function getExpenseCategories(): Promise<ExpenseCategory[]> {
  const supabase = createClient();
  const { data, error } = await supabase.from("expense_categories").select("*").order("name");
  if (error) throw error;
  return (data as ExpenseCategory[]) ?? [];
}

export async function getActiveProfiles(): Promise<Profile[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("is_active", true)
    .in("role", ["admin", "member"])
    .order("full_name");

  if (error) throw error;
  return (data as Profile[]) ?? [];
}

interface ExpenseEditHistoryRow {
  id: string;
  performed_at: string;
  edit_reason: string | null;
  profiles: { full_name: string } | null;
}

export async function getExpenseEditHistory(expenseId: string): Promise<ExpenseEditHistoryRow[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("audit_logs")
    .select("*, profiles!audit_logs_performed_by_fkey(full_name)")
    .eq("table_name", "expenses")
    .eq("record_id", expenseId)
    .order("performed_at", { ascending: false });

  if (error) throw error;
  return (data as ExpenseEditHistoryRow[]) ?? [];
}

