// ============================================================
// MockCA.ai — Supabase Client
// createSupabaseServer() uses SERVICE_ROLE_KEY — server only.
// createSupabaseClient() uses ANON_KEY — safe for client.
// NEVER import createSupabaseServer from a client component.
// ============================================================

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

/** Browser-safe client — uses anon key, respects RLS. */
export function createSupabaseClient() {
  return createClient(supabaseUrl, supabaseAnonKey);
}

/**
 * Server-only admin client — bypasses RLS.
 * Use only in API routes and Server Components.
 * NEVER call this from client components.
 */
export function createSupabaseServer() {
  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: { persistSession: false },
  });
}
