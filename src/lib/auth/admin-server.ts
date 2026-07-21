import "server-only";

import { redirect } from "next/navigation";
import { isAllowedAdminEmail } from "@/lib/auth/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function getAdminContext() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user || !isAllowedAdminEmail(user.email)) {
    return null;
  }

  return { supabase, user };
}

export async function requireAdminContext() {
  const context = await getAdminContext();

  if (!context) {
    redirect("/admin/login");
  }

  return context;
}
