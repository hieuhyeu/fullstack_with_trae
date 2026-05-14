import { createClient } from "@supabase/supabase-js";
import { requireEnv } from "./env";

export function getSupabaseAnonClient() {
  const url = requireEnv("SUPABASE_URL");
  const key = requireEnv("SUPABASE_ANON_KEY");
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false }
  });
}

export function getSupabaseServiceRoleClient() {
  const url = requireEnv("SUPABASE_URL");
  const key = requireEnv("SUPABASE_SERVICE_ROLE_KEY");
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false }
  });
}

