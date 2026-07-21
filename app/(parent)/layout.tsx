import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ThemeToggle } from "@/components/ui/ThemeToggle";

export default async function ParentLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  return (
    <div className="max-w-md mx-auto min-h-screen">
      <header className="p-4 border-b dark:border-gray-800 bg-white dark:bg-gray-900 sticky top-0 z-10 flex items-center justify-between">
        <div>
          <span className="font-bold bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent">
            Kas Kost — Panel Orang Tua
          </span>
          <p className="text-xs text-gray-400 dark:text-gray-500">Tampilan lihat saja, tidak bisa mengubah data.</p>
        </div>
        <ThemeToggle />
      </header>
      <main className="p-4">{children}</main>
    </div>
  );
}
