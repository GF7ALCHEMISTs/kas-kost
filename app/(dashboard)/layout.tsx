import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { TabSwitcher } from "@/components/dashboard/TabSwitcher";
import { BottomNav } from "@/components/dashboard/BottomNav";
import { ThemeToggle } from "@/components/ui/ThemeToggle";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  const isAdmin = profile?.role === "admin";

  return (
    <div className="max-w-md mx-auto min-h-screen pb-20">
      <header className="p-4 border-b dark:border-gray-800 bg-white dark:bg-gray-900 sticky top-0 z-10 flex items-center justify-between">
        <span className="font-bold bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent">
          Kas Kost
        </span>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500 dark:text-gray-400">{profile?.full_name}</span>
          <ThemeToggle />
        </div>
      </header>

      <TabSwitcher />

      <main className="p-4">{children}</main>

      <BottomNav isAdmin={isAdmin} />
    </div>
  );
}

