// ============================================================
// MockCA.ai — Auth Helpers
// Every API route MUST call getAuthUser() before any logic.
// Uses cookie-based Supabase sessions (refreshed by middleware).
// ============================================================

import { createServerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { prisma } from "./prisma";

export type AuthUser = {
  id: string;
  email: string;
  name: string | null;
  avatarUrl: string | null;
};

/**
 * Reads the Supabase session from request cookies and returns
 * the Prisma User record, upserting on first login.
 *
 * Throws a 401 Response if the session is missing or invalid.
 *
 * Usage in route handlers:
 *   const user = await getAuthUser();
 */
export async function getAuthUser(): Promise<AuthUser> {
  const cookieStore = cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
      },
    }
  );

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.user) {
    throw new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const { user } = session;

  const dbUser = await prisma.user.upsert({
    where: { id: user.id },
    update: {},
    create: {
      id: user.id,
      email: user.email!,
      name: user.user_metadata?.full_name ?? null,
      avatarUrl: user.user_metadata?.avatar_url ?? null,
    },
    select: { id: true, email: true, name: true, avatarUrl: true },
  });

  return dbUser;
}
