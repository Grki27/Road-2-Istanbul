"use client";

import { useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

type AdminLoginFormProps = {
  isSupabaseConfigured: boolean;
};

export function AdminLoginForm({ isSupabaseConfigured }: AdminLoginFormProps) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "sent" | "error">("idle");
  const [message, setMessage] = useState("");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!isSupabaseConfigured) {
      setStatus("error");
      setMessage("Supabase env varijable još nisu postavljene.");
      return;
    }

    setStatus("loading");
    setMessage("");

    const supabase = createSupabaseBrowserClient();
    const redirectTo = `${window.location.origin}/auth/callback?next=/admin`;
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: redirectTo
      }
    });

    if (error) {
      setStatus("error");
      setMessage("Nešto je zapelo. Provjeri email i probaj ponovno.");
      return;
    }

    setStatus("sent");
    setMessage("Magic link je poslan. Otvori email i klikni link za ulaz.");
  }

  return (
    <form onSubmit={handleSubmit} className="mt-6 space-y-4">
      <label className="block">
        <span className="text-sm font-black text-coffee">Email</span>
        <input
          className="mt-2 w-full rounded-2xl border border-coffee/15 bg-paper px-4 py-3 font-semibold outline-none ring-clay/30 transition focus:ring-4"
          disabled={!isSupabaseConfigured || status === "loading"}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="sedmonebo27@gmail.com"
          required
          type="email"
          value={email}
        />
      </label>
      <button
        className="w-full rounded-full bg-clay px-5 py-3 font-black text-paper shadow-pin transition hover:bg-terracotta disabled:cursor-not-allowed disabled:bg-coffee/30"
        disabled={!isSupabaseConfigured || status === "loading"}
        type="submit"
      >
        {status === "loading" ? "Šaljem..." : "Pošalji magic link"}
      </button>
      {!isSupabaseConfigured ? (
        <p className="rounded-2xl bg-sand px-4 py-3 text-sm font-bold text-coffee">
          Dodaj Supabase vrijednosti u `.env.local` da login proradi.
        </p>
      ) : null}
      {message ? (
        <p className={`rounded-2xl px-4 py-3 text-sm font-bold ${status === "error" ? "bg-red-100 text-red-900" : "bg-lime-100 text-lime-900"}`}>
          {message}
        </p>
      ) : null}
    </form>
  );
}
