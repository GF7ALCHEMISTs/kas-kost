import { createClient } from "@/lib/supabase/server";
import type { ManualAdjustment } from "@/types/database.types";

export async function getAdjustmentsForPeriod(periodId: string): Promise<ManualAdjustment[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("manual_adjustments")
    .select("*, profiles!manual_adjustments_created_by_fkey(*)")
    .eq("period_id", periodId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data as ManualAdjustment[]) ?? [];
}
