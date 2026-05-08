import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Pass pathname to server components via request header (NOT response header
   // — that would leak it to the client). RootLayout reads this to skip the
   // maintenance overlay and chrome on /shasstorebyshahanas pages.
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-invoke-path", pathname);

  const response = NextResponse.next({
    request: { headers: requestHeaders },
  });

  const needsAdminAuth =
    (pathname.startsWith("/shasstorebyshahanas") &&
      !pathname.startsWith("/shasstorebyshahanas/login")) ||
    pathname === "/api/upload-image" ||
    pathname.startsWith("/api/admin/");

  if (needsAdminAuth) {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              request.cookies.set(name, value);
              response.cookies.set(name, value, options);
            });
          },
        },
      }
    );

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      if (pathname.startsWith("/api/")) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      return NextResponse.redirect(
        new URL("/shasstorebyshahanas/login", request.url)
      );
    }

    // Authenticated ≠ admin. The `admins` table has an RLS policy that lets
    // a user check their own row, so the anon-key SSR client works here.
    const { data: adminRow } = await supabase
      .from("admins")
      .select("user_id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (!adminRow) {
      if (pathname.startsWith("/api/")) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
      return NextResponse.redirect(
        new URL("/shasstorebyshahanas/login", request.url)
      );
    }
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
