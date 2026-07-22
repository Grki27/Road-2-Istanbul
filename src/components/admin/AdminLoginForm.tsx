"use client";

import { useActionState } from "react";
import { loginAdminAction } from "@app/admin/login/actions";

type AdminLoginFormProps = {
  isSupabaseConfigured: boolean;
};

const initialState = {
  message: ""
};

export function AdminLoginForm({ isSupabaseConfigured }: AdminLoginFormProps) {
  const [state, formAction, isPending] = useActionState(loginAdminAction, initialState);

  return (
    <form action={formAction} className="mt-6 space-y-4">
      <label className="block">
        <span className="text-sm font-black text-coffee">Email</span>
        <input
          autoComplete="email"
          className="mt-2 w-full rounded-2xl border border-coffee/15 bg-paper px-4 py-3 font-semibold outline-none ring-clay/30 transition focus:ring-4"
          disabled={!isSupabaseConfigured || isPending}
          name="email"
          placeholder="sedmonebo27@gmail.com"
          required
          type="email"
        />
      </label>
      <label className="block">
        <span className="text-sm font-black text-coffee">Lozinka</span>
        <input
          autoComplete="current-password"
          className="mt-2 w-full rounded-2xl border border-coffee/15 bg-paper px-4 py-3 font-semibold outline-none ring-clay/30 transition focus:ring-4"
          disabled={!isSupabaseConfigured || isPending}
          minLength={6}
          name="password"
          required
          type="password"
        />
      </label>
      <button
        className="w-full rounded-full bg-clay px-5 py-3 font-black text-paper shadow-pin transition hover:bg-terracotta disabled:cursor-not-allowed disabled:bg-coffee/30"
        disabled={!isSupabaseConfigured || isPending}
        type="submit"
      >
        {isPending ? "Prijavljujem..." : "Prijavi se"}
      </button>
      {!isSupabaseConfigured ? (
        <p className="rounded-2xl bg-sand px-4 py-3 text-sm font-bold text-coffee">
          Dodaj Supabase vrijednosti u `.env.local` da login proradi.
        </p>
      ) : null}
      {state.message ? (
        <p className="rounded-2xl bg-red-100 px-4 py-3 text-sm font-bold text-red-900">
          {state.message}
        </p>
      ) : null}
    </form>
  );
}
