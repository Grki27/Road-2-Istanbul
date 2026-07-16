import { createClient } from "@supabase/supabase-js";
import { requirePublicSupabaseEnv, requireServiceRoleKey } from "@/lib/env";
import type { Database } from "@/types/database";

export function createSupabaseServiceClient() {
  const { url } = requirePublicSupabaseEnv();
  const serviceRoleKey = requireServiceRoleKey();

  return createClient<Database>(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
}
