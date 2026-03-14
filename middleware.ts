import { createServerClient } from "@supabase/auth-helpers-nextjs";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import type { ResponseCookie } from "next/dist/compiled/@edge-runtime/cookies";

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};

// Routes that do NOT require a Supabase session
const PUBLIC_PATHS = ["/login", "/invite-gate"];
const PUBLIC_API_PATHS = ["/api/auth/validate-invite", "/api/auth/callback"];

export async function middleware(req: NextRequest) {
  let res = NextResponse.next({ request: { headers: req.headers } });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return req.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: Partial<ResponseCookie>) {
          req.cookies.set({ name, value, ...options } as ResponseCookie);
          res = NextResponse.next({ request: { headers: req.headers } });
          res.cookies.set({ name, value, ...options } as ResponseCookie);
        },
        remove(name: string, options: Partial<ResponseCookie>) {
          req.cookies.set({ name, value: "", ...options } as ResponseCookie);
          res = NextResponse.next({ request: { headers: req.headers } });
          res.cookies.set({ name, value: "", ...options } as ResponseCookie);
        },
      },
    }
  );

  // Always refresh the session so cookies stay up to date
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const { pathname } = req.nextUrl;

  const isPublicPath = PUBLIC_PATHS.some(
    (p) => pathname === p || pathname.startsWith(p + "/")
  );
  const isPublicApi = PUBLIC_API_PATHS.some((p) => pathname.startsWith(p));

  // Unauthenticated user hitting a protected route → /login
  if (!session && !isPublicPath && !isPublicApi) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  // Authenticated user hitting /login → /invite-gate
  if (session && pathname === "/login") {
    return NextResponse.redirect(new URL("/invite-gate", req.url));
  }

  return res;
}
