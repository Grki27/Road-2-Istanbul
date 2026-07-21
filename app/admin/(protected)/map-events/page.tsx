import Link from "next/link";
import { Edit3, Plus } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { MapEventRowActions } from "@/components/admin/MapEventRowActions";
import { requireAdminContext } from "@/lib/auth/admin-server";

export default async function AdminMapEventsPage() {
  const { supabase } = await requireAdminContext();
  const { data: events, error } = await supabase.from("map_events").select("*").order("created_at", { ascending: false });

  return (
    <>
      <AdminPageHeader eyebrow="Karta" title="Event pinovi" description="Hrana, kvarovi, granice, psi, zalasci i svi sidequestovi koji zaslužuju svoj pin." />
      <Link href="/admin/map-events/new" className="mb-6 inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-clay px-5 py-3 font-black text-paper shadow-pin"><Plus size={19} /> Novi pin</Link>
      {error ? <p className="rounded-2xl bg-red-100 p-4 font-bold text-red-950">Pinovi se nisu učitali: {error.message}</p> : null}
      <div className="grid gap-3 sm:grid-cols-2">
        {(events ?? []).map((event) => (
          <article key={event.id} className="rounded-2xl bg-white/70 p-5 shadow-paper">
            <div className="flex items-start gap-3"><span className="text-3xl">{event.emoji}</span><div><h2 className="font-display text-2xl font-black">{event.title}</h2><p className="mt-1 text-sm font-bold text-coffee/65">{[event.location_name, event.country].filter(Boolean).join(", ") || "Lokacija bez naziva"}</p></div></div>
            <Link href={`/admin/map-events/${event.id}/edit`} className="mt-4 inline-flex items-center gap-2 rounded-full bg-ink px-4 py-2 text-sm font-black text-paper"><Edit3 size={16} /> Uredi</Link>
            <MapEventRowActions id={event.id} />
          </article>
        ))}
        {!events?.length && !error ? <div className="rounded-2xl border border-dashed border-coffee/25 p-7 text-center font-bold text-coffee/65 sm:col-span-2">Još nema pravih event pinova.</div> : null}
      </div>
    </>
  );
}
