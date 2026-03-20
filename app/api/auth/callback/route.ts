import { createServerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import type { ResponseCookie } from "next/dist/compiled/@edge-runtime/cookies";
import { prisma } from "@/lib/prisma";

// ── Auth callback ─────────────────────────────────────────────────────────
//
// Root cause fixed: the session cookies written by exchangeCodeForSession()
// must be forwarded onto the final redirect Response.  Previously we wrote
// them to cookieStore (next/headers) while returning a brand-new
// NextResponse.redirect() that had no cookies → session was lost on every
// OAuth / magic-link login.
//
// Fix: collect every cookie mutation Supabase makes while exchanging the
// code, then stamp them onto the redirect response before returning it.
//
// Routing logic after successful exchange:
//   • User NOT in Prisma          → create record → /invite-gate
//   • User has inviteCodeUsed set → /dashboard  (skip invite gate)
//   • User has no inviteCodeUsed  → /invite-gate

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");

  console.log("=== AUTH CALLBACK DEBUG ===");
  console.log("Code present:", !!code);

  if (!code) {
    return NextResponse.redirect(new URL("/login?error=missing_code", url.origin));
  }

  const cookieStore = cookies();

  // Collect every cookie Supabase wants to set during the exchange so we
  // can forward them onto the redirect response.
  type CookieWrite = { name: string; value: string; options: Partial<ResponseCookie> };
  const pendingCookies: CookieWrite[] = [];

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: Partial<ResponseCookie>) {
          pendingCookies.push({ name, value, options });
        },
        remove(name: string, options: Partial<ResponseCookie>) {
          pendingCookies.push({ name, value: "", options });
        },
      },
    }
  );

  const { data, error } = await supabase.auth.exchangeCodeForSession(code);
  console.log("Exchange error:", error?.message ?? "none");

  if (error || !data.session) {
    return NextResponse.redirect(new URL("/login?error=auth_failed", url.origin));
  }

  // Use getUser() to verify the JWT rather than trusting the session object directly
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser(data.session.access_token);
  console.log("getUser error:", userError?.message ?? "none");
  console.log("User email:", user?.email);

  if (userError || !user) {
    return NextResponse.redirect(new URL("/login?error=auth_failed", url.origin));
  }

  // Find user in Prisma by email (not id — safer across OAuth providers)
  const dbUser = await prisma.user.findUnique({
    where: { email: user.email! },
    select: { id: true, inviteCodeUsed: true },
  });

  console.log("DB user found:", dbUser);
  console.log("inviteCodeUsed:", dbUser?.inviteCodeUsed);

  // Determine redirect destination
  let destination: string;

  if (!dbUser) {
    // Brand new user — create record, must enter invite code
    await prisma.user.create({
      data: {
        id: user.id,
        email: user.email!,
        name:
          (user.user_metadata?.full_name as string | undefined) ??
          user.email!.split("@")[0],
        avatarUrl: (user.user_metadata?.avatar_url as string | undefined) ?? null,
        examLevel: "intermediate",
        inviteCodeUsed: null,
      },
    });
    destination = "/invite-gate";
    console.log("New user created → /invite-gate");
  } else if (dbUser.inviteCodeUsed) {
    // Returning user with access → skip invite gate
    destination = "/dashboard";
    console.log("Returning user with access → /dashboard");
  } else {
    // Registered but never entered a code
    destination = "/invite-gate";
    console.log("User exists but no inviteCodeUsed → /invite-gate");
  }

  // Build redirect response and stamp all session cookies onto it
  const response = NextResponse.redirect(new URL(destination, url.origin));
  for (const { name, value, options } of pendingCookies) {
    response.cookies.set({ name, value, ...options } as ResponseCookie);
  }

  console.log("Cookies forwarded:", pendingCookies.map((c) => c.name));
  console.log("=== END CALLBACK ===");

  return response;
}
