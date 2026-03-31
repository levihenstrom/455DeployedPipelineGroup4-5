import { createClient } from "@supabase/supabase-js";

const isVercelRuntime = process.env.VERCEL === "1" || Boolean(process.env.VERCEL_ENV);

function resolveEnv(varName: string, localVarName?: string): string | undefined {
  if (isVercelRuntime) {
    return process.env[varName];
  }
  if (localVarName && process.env[localVarName]) {
    return process.env[localVarName];
  }
  return process.env[varName];
}

const url =
  resolveEnv("SUPABASE_URL", "LOCAL_SUPABASE_URL") ||
  resolveEnv("NEXT_PUBLIC_SUPABASE_URL", "LOCAL_NEXT_PUBLIC_SUPABASE_URL");
const anonKey =
  resolveEnv("SUPABASE_ANON_KEY", "LOCAL_SUPABASE_ANON_KEY") ||
  resolveEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "LOCAL_NEXT_PUBLIC_SUPABASE_ANON_KEY");
const serviceRoleKey = resolveEnv("SUPABASE_SERVICE_ROLE_KEY", "LOCAL_SUPABASE_SERVICE_ROLE_KEY");

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
