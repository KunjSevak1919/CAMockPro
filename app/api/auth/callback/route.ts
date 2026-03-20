import { createServerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import type { ResponseCookie } from "next/dist/compiled/@edge-runtime/cookies";
import { prisma } from "@/lib/prisma";

// Handles the OAuth redirect and magic-link callback from Supabase.
// Exchanges the one-time code for a session cookie, then:
//   - New user (not in DB) → creates record → /invite-gate
//   - Returning user with inviteCodeUsed → /dashboard
//   - Returning user without inviteCodeUsed → /invite-gate
export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");

  if (!code) {
    return NextResponse.redirect(new URL("/login?error=missing_code", url.origin));
  }

  const cookieStore = cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: Partial<ResponseCookie>) {
          cookieStore.set({ name, value, ...options });
        },
        remove(name: string, options: Partial<ResponseCookie>) {
          cookieStore.set({ name, value: "", ...options });
        },
      },
    }
  );

  const { data, error } = await supabase.auth.exchangeCodeForSession(code);

  if (error || !data.session) {
    return NextResponse.redirect(new URL("/login?error=auth_failed", url.origin));
  }

  const { user } = data.session;

  // Check if user already exists in Prisma
  const dbUser = await prisma.user.findUnique({
    where: { email: user.email! },
    select: { inviteCodeUsed: true },
  });

  if (!dbUser) {
    // First time — create record, send to invite gate
    await prisma.user.create({
      data: {
        id: user.id,
        email: user.email!,
        name:
          user.user_metadata?.full_name ??
          user.email!.split("@")[0],
        avatarUrl: user.user_metadata?.avatar_url ?? null,
        examLevel: "intermediate",
        inviteCodeUsed: null,
      },
    });
    return NextResponse.redirect(new URL("/invite-gate", url.origin));
  }

  // Returning user
  if (dbUser.inviteCodeUsed !== null) {
    return NextResponse.redirect(new URL("/dashboard", url.origin));
  }

  return NextResponse.redirect(new URL("/invite-gate", url.origin));
}
