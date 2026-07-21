import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;

  // Halaman publik pakai token di URL sebagai satu-satunya lapisan keamanan,
  // sengaja tidak butuh login sama sekali -> lewati semua pengecekan auth di bawah.
  if (path.startsWith("/public")) {
    return NextResponse.next();
  }

  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isAuthRoute = path.startsWith("/login");

  // Belum login -> paksa ke halaman login
  if (!user && !isAuthRoute) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Sudah login tapi buka /login -> lempar ke dashboard
  if (user && isAuthRoute) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // Proteksi role: parent hanya boleh akses /parent/*, tidak boleh /admin/* atau menu tulis
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    const role = profile?.role;

    if (role === "parent" && !path.startsWith("/parent") && !isAuthRoute) {
      return NextResponse.redirect(new URL("/parent/dashboard", request.url));
    }

    if (role !== "admin" && path.startsWith("/admin")) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }

    if (role !== "parent" && path.startsWith("/parent")) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api).*)"],
};
