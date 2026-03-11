// ============================================================
// MockCA.ai — Auth Helpers
// Every API route MUST call getAuthUser() before any logic.
// Returns the authed user or throws a 401 Response.
// ============================================================

import { createSupabaseServer } from "./supabase";
import { prisma } from "./prisma";

export type AuthUser = {
  id: string;
  email: string;
  name: string | null;
  avatarUrl: string | null;
};

/**
 * Validates the Supabase session from request cookies and returns
 * the corresponding Prisma User record.
 *
 * Usage in API routes:
 *   const user = await getAuthUser(request);
 *
 * Throws a 401 Response if the session is missing or invalid.
 */
export async function getAuthUser(request: Request): Promise<AuthUser> {
  const supabase = createSupabaseServer();

  const authHeader = request.headers.get("Authorization");
  const token = authHeader?.replace("Bearer ", "");

  if (!token) {
    throw new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser(token);

  if (error || !user) {
    throw new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Upsert into Prisma users table on every auth check so new
  // Supabase signups are automatically synced.
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
