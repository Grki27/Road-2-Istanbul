"use server";

import { redirect } from "next/navigation";
import { isAllowedAdminEmail } from "@/lib/auth/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type LoginState = {
  message: string;
};

export async function loginAdminAction(
  _previousState: LoginState,
  formData: FormData
): Promise<LoginState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");

  if (!isAllowedAdminEmail(email) || password.length < 6) {
    return { message: "Email ili lozinka nisu ispravni." };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { message: "Email ili lozinka nisu ispravni." };
  }

  redirect("/admin");
}
