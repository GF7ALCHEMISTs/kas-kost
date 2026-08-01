import { createClient } from "@/lib/supabase/server";
import type { PeriodDue } from "@/types/database.types";

/** Bucket "proofs" bersifat private -> perlu signed URL (berlaku 1 jam) buat nampilin buktinya. */
async function getSignedProofUrl(
  supabase: ReturnType<typeof createClient>,
  path: string | null
): Promise<string | null> {
  if (!path) return null;
  const { data } = await supabase.storage.from("proofs").createSignedUrl(path, 3600);
  return data?.signedUrl ?? null;
}

export async function getDuesForPeriod(
  periodId: string,
  options: { withProof?: boolean } = {}
): Promise<PeriodDue[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("period_dues")
    .select("*, profiles!period_dues_user_id_fkey(*)")
    .eq("period_id", periodId)
    .order("created_at", { ascending: true });

  if (error) throw error;
  const dues = (data as PeriodDue[]) ?? [];

  if (!options.withProof) return dues;

  return Promise.all(
    dues.map(async (due) => ({
      ...due,
      signedProofUrl: await getSignedProofUrl(supabase, due.proof_path),
    }))
  );
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
