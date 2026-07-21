import { createClient } from "@/lib/supabase/server";
import type { PeriodDue } from "@/types/database.types";

export async function getDuesForPeriod(periodId: string): Promise<PeriodDue[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("period_dues")
    .select("*, profiles!period_dues_user_id_fkey(*)")
    .eq("period_id", periodId)
    .order("created_at", { ascending: true });

  if (error) throw error;
  return (data as PeriodDue[]) ?? [];
}

export async function getMyDue(periodId: string, userId: string): Promise<PeriodDue | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("period_dues")
    .select("*")
    .eq("period_id", periodId)
    .eq("user_id", userId)
    .maybeSingle();

  if (error) throw error;
  return data as PeriodDue | null;
}
