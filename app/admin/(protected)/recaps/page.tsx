import Link from "next/link";
import { Edit3, Plus } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { RecapRowActions } from "@/components/admin/RecapRowActions";
import { requireAdminContext } from "@/lib/auth/admin-server";
import { formatKilometerRange } from "@/lib/trip-format";

const statusStyle = {
  draft: "bg-sand text-ink",
  published: "bg-lime-100 text-lime-950",
  archived: "bg-coffee/10 text-coffee"
};

export default async function AdminRecapsPage() {
  const { supabase } = await requireAdminContext();
  const { data: recaps, error } = await supabase
    .from("daily_recaps")
    .select("*")
    .order("day_number", { ascending: false });

  return (
    <>
      <AdminPageHeader eyebrow="Dnevnik" title="Dnevni recapovi" description="Nacrti ostaju privatni. Objavljeni recap odmah se pojavljuje na karti i timelineu." />
      <Link href="/admin/recaps/new" className="mb-6 inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-clay px-5 py-3 font-black text-paper shadow-pin"><Plus size={19} /> Novi recap</Link>
      {error ? <p className="rounded-2xl bg-red-100 p-4 font-bold text-red-950">Recapovi se nisu učitali: {error.message}</p> : null}
      <div className="space-y-3">
        {(recaps ?? []).map((recap) => (
          <article key={recap.id} className="rounded-2xl bg-white/70 p-5 shadow-paper">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.16em] text-clay">Dan {recap.day_number} · {recap.date}</p>
                <h2 className="mt-2 font-display text-2xl font-black">{recap.title}</h2>
                <p className="mt-1 text-sm font-bold text-coffee/65">{formatKilometerRange(recap.start_location ?? undefined, recap.end_location ?? undefined)}</p>
              </div>
              <span className={`rounded-full px-3 py-1 text-xs font-black ${statusStyle[recap.status]}`}>{recap.status}</span>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <Link href={`/admin/recaps/${recap.id}/edit`} className="inline-flex items-center gap-2 rounded-full bg-ink px-4 py-2 text-sm font-black text-paper"><Edit3 size={16} /> Uredi</Link>
            </div>
            <RecapRowActions id={recap.id} status={recap.status} />
          </article>
        ))}
        {!recaps?.length && !error ? <div className="rounded-2xl border border-dashed border-coffee/25 p-7 text-center font-bold text-coffee/65">Još nema stvarnih recapova. Preview na javnoj stranici nestat će kad spremiš prvi zapis.</div> : null}
      </div>
    </>
  );
}
