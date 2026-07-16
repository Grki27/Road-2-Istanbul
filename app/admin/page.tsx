import Link from "next/link";
import { redirect } from "next/navigation";
import { getPublicSupabaseEnv } from "@/lib/env";
import { isAllowedAdminEmail } from "@/lib/auth/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function AdminPage() {
  const { isConfigured } = getPublicSupabaseEnv();

  if (!isConfigured) {
    return (
      <main className="min-h-screen bg-paper px-5 py-10 text-ink">
        <div className="mx-auto max-w-3xl rounded-[2rem] bg-white/70 p-6 shadow-paper">
          <p className="text-xs font-black uppercase tracking-[0.24em] text-clay">Admin setup</p>
          <h1 className="mt-3 font-display text-4xl font-black">Supabase još nije spojen.</h1>
          <p className="mt-4 leading-7 text-coffee/80">
            Phase 2 scaffold je spreman. Kopiraj `.env.example` u `.env.local`, dodaj Supabase URL i anon key, pa restartaj dev server.
          </p>
          <Link className="mt-6 inline-flex rounded-full bg-ink px-5 py-3 font-black text-paper" href="/">
            Nazad na homepage
          </Link>
        </div>
      </main>
    );
  }

  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getUser();

  if (!data.user) {
    redirect("/admin/login");
  }

  if (!isAllowedAdminEmail(data.user.email)) {
    return (
      <main className="min-h-screen bg-paper px-5 py-10 text-ink">
        <div className="mx-auto max-w-3xl rounded-[2rem] bg-white/70 p-6 shadow-paper">
          <p className="text-xs font-black uppercase tracking-[0.24em] text-clay">Nema pristupa</p>
          <h1 className="mt-3 font-display text-4xl font-black">Ovaj email nije na admin listi.</h1>
          <p className="mt-4 leading-7 text-coffee/80">
            Prijavljen si kao {data.user.email}. Admin emailovi se uređuju u `ALLOWED_ADMIN_EMAILS`.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-paper px-5 py-10 text-ink">
      <div className="mx-auto max-w-5xl">
        <p className="text-xs font-black uppercase tracking-[0.24em] text-clay">Admin dashboard</p>
        <h1 className="mt-3 font-display text-5xl font-black">Dobrodošao u Sedmo Nebo admin.</h1>
        <p className="mt-4 max-w-2xl leading-7 text-coffee/80">
          Auth i baza su spremni za Phase 4 formove. Sljedeće ovdje dolaze brze akcije za recap, GPS lokaciju, pinove, komentare i Zid podrške.
        </p>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[
            "Novi dnevni recap",
            "Dodaj trenutnu GPS lokaciju",
            "Dodaj pin na karti",
            "Komentari na čekanju",
            "Zid podrške",
            "Uredi statistiku"
          ].map((label) => (
            <div key={label} className="rounded-[1.5rem] bg-white/70 p-5 font-black shadow-paper">
              {label}
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
