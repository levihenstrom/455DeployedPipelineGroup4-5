import { createClient } from "@supabase/supabase-js";

const url =
  process.env.SUPABASE_URL ||
  process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey =
  process.env.SUPABASE_ANON_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export const supabase = url && anonKey ? createClient(url, anonKey) : null;

export function getSupabaseServerClient() {
  if (!url) return null;
  const key = serviceRoleKey || anonKey;
  if (!key) return null;
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false }
  });
}

export function getSupabaseConfigStatus() {
  return {
    hasUrl: Boolean(url),
    hasAnonKey: Boolean(anonKey),
    hasServiceRoleKey: Boolean(serviceRoleKey)
  };
}
