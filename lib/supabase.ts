// ============================================================
// MockCA.ai — Supabase Client Factories
// createSupabaseAdmin() uses SERVICE_ROLE_KEY — server only.
// For auth-aware clients use createBrowserClient /
// createServerClient from @supabase/auth-helpers-nextjs directly.
// NEVER import createSupabaseAdmin from a client component.
// ============================================================

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

/**
 * Server-only admin client — bypasses RLS.
 * Use for storage operations, admin tasks, and seeding.
 * NEVER call this from a client component.
 */
export function createSupabaseAdmin() {
  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: { persistSession: false },
  });
}
