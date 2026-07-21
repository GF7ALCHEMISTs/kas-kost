import { createClient } from "@/lib/supabase/server";
import type { SharedSession } from "@/types/database.types";

export async function getSessions(): Promise<SharedSession[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("shared_sessions")
    .select("*, opened_by_profile:profiles!shared_sessions_opened_by_fkey(*)")
    .order("opened_at", { ascending: false });

  if (error) throw error;
  return (data as SharedSession[]) ?? [];
}

export async function getSessionById(sessionId: string): Promise<SharedSession | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("shared_sessions")
    .select("*")
    .eq("id", sessionId)
    .maybeSingle();

  if (error) throw error;
  return data as SharedSession | null;
}
