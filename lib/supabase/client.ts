import { createBrowserClient } from "@supabase/ssr";

// Catatan: generic <Database> sengaja tidak dipakai di sini.
// Versi terbaru @supabase/postgrest-js punya parser tipe (select-query-parser)
// yang sangat ketat terhadap bentuk skema — tipe manual sederhana kita
// tidak selalu cocok dengan parser tersebut dan bikin hasil query jadi `never`.
// Tipe hasil query tetap dijaga lewat interface di types/database.types.ts
// yang dipakai di lib/queries/* dan komponen.
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
