import { createServerClient } from "@supabase/auth-helpers-nextjs";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import type { ResponseCookie } from "next/dist/compiled/@edge-runtime/cookies";

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};

// Routes that never require authentication
const PUBLIC_PATHS = ["/login", "/invite-gate", "/waitlist", "/"];
const PUBLIC_API_PREFIXES = ["/api/auth/"];

// Routes that always require an active Supabase session
const PROTECTED_PREFIXES = [
  "/dashboard",
  "/interview",
  "/history",
  "/profile",
  "/admin",
  "/api/sessions",
  "/api/interview",
  "/api/admin",
];

export async function middleware(req: NextRequest) {
  let res = NextResponse.next({ request: { headers: req.headers } });

  // Refresh session cookie on every request (keeps the JWT alive)
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

  const {
    data: { session },
  } = await supabase.auth.getSession();

  const { pathname } = req.nextUrl;

  const isPublicPath = PUBLIC_PATHS.some(
    (p) => pathname === p || pathname.startsWith(p + "/")
  );
  const isPublicApi = PUBLIC_API_PREFIXES.some((p) => pathname.startsWith(p));
  const isProtected = PROTECTED_PREFIXES.some((p) => pathname.startsWith(p));

  // Only rule: no session + protected route → /login
  if (!session && isProtected && !isPublicPath && !isPublicApi) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  // Authenticated user on /login → /dashboard
  // (the callback handles invite-gate routing — middleware never touches it)
  if (session && pathname === "/login") {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  return res;
}
