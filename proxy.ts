import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// Routes accessibles sans authentification
const PUBLIC_PREFIXES = ["/auth/", "/api/"];
const PUBLIC_EXACT = ["/", "/login", "/inscription"];

// Routes réservées aux non-authentifiés (redirection si déjà connecté)
const AUTH_ONLY_EXACT = ["/login", "/inscription"];

function dashboardForRole(role: string): string {
  return role === "entreprise" ? "/portail" : "/direction/dashboard";
}

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    },
  );

  const { data: { user } } = await supabase.auth.getUser();
  const { pathname } = request.nextUrl;

  const isPublic =
    PUBLIC_EXACT.includes(pathname) ||
    PUBLIC_PREFIXES.some((p) => pathname.startsWith(p));

  if (user && AUTH_ONLY_EXACT.includes(pathname)) {
    // Utilisateur connecté sur /login ou /inscription → rediriger vers son dashboard
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    const role = profile?.role ?? (user.user_metadata?.role as string) ?? "entreprise";
    return NextResponse.redirect(new URL(dashboardForRole(role), request.url));
  }

  if (!user && !isPublic) {
    // Utilisateur non connecté sur une route protégée → /login
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
