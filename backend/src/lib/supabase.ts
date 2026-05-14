import { createClient } from "@supabase/supabase-js";

export function getSupabaseAdmin() {
  const url = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url) throw new Error("SUPABASE_URL is required");
  if (!serviceRoleKey) throw new Error("SUPABASE_SERVICE_ROLE_KEY is required");

  return createClient(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false }
  });
}

export function getSupabaseAdminOptional() {
  const url = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRoleKey) return null;
  return createClient(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false }
  });
}

export function getSupabaseRlsClient(accessToken: string) {
  const url = process.env.SUPABASE_URL;
  const anonKey = process.env.SUPABASE_ANON_KEY;
  if (!url) throw new Error("SUPABASE_URL is required");
  if (!anonKey) throw new Error("SUPABASE_ANON_KEY is required");
  if (!accessToken) throw new Error("accessToken is required");

  return createClient(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: {
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    }
  });
}
