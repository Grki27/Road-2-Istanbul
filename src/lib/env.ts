export function getPublicSupabaseEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  return {
    url,
    anonKey,
    isConfigured: Boolean(url && anonKey)
  };
}

export function requirePublicSupabaseEnv() {
  const env = getPublicSupabaseEnv();

  if (!env.url || !env.anonKey) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY.");
  }

  return {
    url: env.url,
    anonKey: env.anonKey
  };
}

export function requireServiceRoleKey() {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!serviceRoleKey) {
    throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY.");
  }

  return serviceRoleKey;
}
