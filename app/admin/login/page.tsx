import Link from "next/link";
import { AdminLoginForm } from "@/components/admin/AdminLoginForm";
import { getPublicSupabaseEnv } from "@/lib/env";

export default function AdminLoginPage() {
  const { isConfigured } = getPublicSupabaseEnv();

  return (
    <main className="min-h-screen bg-paper px-5 py-10 text-ink">
      <div className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-md flex-col justify-center">
        <Link href="/" className="mb-8 text-sm font-black text-clay">
          ← Nazad na stranicu
        </Link>
        <div className="rounded-[2rem] bg-white/70 p-6 shadow-paper">
          <p className="text-xs font-black uppercase tracking-[0.24em] text-clay">Admin</p>
          <h1 className="mt-3 font-display text-4xl font-black">Prijava za cestu</h1>
          <p className="mt-3 leading-7 text-coffee/80">
            Prijavi se jednim od dopuštenih admin emailova i lozinkom.
          </p>
          <AdminLoginForm isSupabaseConfigured={isConfigured} />
        </div>
      </div>
    </main>
  );
}
