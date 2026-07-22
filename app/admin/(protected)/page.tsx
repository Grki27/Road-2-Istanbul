import Link from "next/link";
import {
  ArrowRight,
  Clock3,
  MapPinPlus,
  MessageCircleMore,
  Navigation,
  NotebookPen,
  Settings2,
  StickyNote
} from "lucide-react";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { requireAdminContext } from "@/lib/auth/admin-server";

const quickActions = [
  { href: "/admin/recaps/new", label: "Novi dnevni recap", icon: NotebookPen, color: "bg-clay text-paper" },
  { href: "/admin/location", label: "Dodaj GPS lokaciju", icon: Navigation, color: "bg-sea text-paper" },
  { href: "/admin/map-events/new", label: "Dodaj pin na karti", icon: MapPinPlus, color: "bg-sunset text-ink" },
  { href: "/admin/settings", label: "Uredi statistiku", icon: Settings2, color: "bg-moss text-paper" }
];

function formatDate(value?: string | null) {
  if (!value) return "Jos nema updatea";
  return new Intl.DateTimeFormat("hr-HR", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

export default async function AdminDashboardPage() {
  const { supabase } = await requireAdminContext();
  const [recaps, events, location, pendingComments, pendingNotes] = await Promise.all([
    supabase.from("daily_recaps").select("id", { count: "exact", head: true }),
    supabase.from("map_events").select("id", { count: "exact", head: true }),
    supabase.from("current_locations").select("created_at, note").order("created_at", { ascending: false }).limit(1).maybeSingle(),
    supabase.from("comments").select("id", { count: "exact", head: true }).eq("status", "pending"),
    supabase.from("wall_notes").select("id", { count: "exact", head: true }).eq("status", "pending")
  ]);

  return (
    <>
      <AdminPageHeader
        eyebrow="Dashboard"
        title="Sto danas saljemo s ceste?"
        description="Najcesce akcije su odmah ispod. Sve je slozeno za palac, umorne noge i internet koji ima svoje misljenje."
      />

      <section className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl bg-white/70 p-5 shadow-paper">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-clay">Recapovi</p>
          <p className="mt-2 font-display text-4xl font-black">{recaps.count ?? 0}</p>
        </div>
        <div className="rounded-2xl bg-white/70 p-5 shadow-paper">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-clay">Event pinovi</p>
          <p className="mt-2 font-display text-4xl font-black">{events.count ?? 0}</p>
        </div>
        <div className="rounded-2xl bg-white/70 p-5 shadow-paper">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-clay">Zadnji GPS</p>
          <p className="mt-2 text-sm font-black leading-6">{formatDate(location.data?.created_at)}</p>
        </div>
      </section>

      <section className="mt-7 grid gap-4 sm:grid-cols-2">
        {quickActions.map((action) => {
          const Icon = action.icon;
          return (
            <Link key={action.href} href={action.href} className={`flex min-h-32 items-center justify-between gap-4 rounded-2xl p-5 shadow-paper transition hover:-translate-y-1 ${action.color}`}>
              <span>
                <Icon size={26} />
                <span className="mt-4 block font-display text-2xl font-black">{action.label}</span>
              </span>
              <ArrowRight size={24} />
            </Link>
          );
        })}
      </section>

      <section className="mt-8 grid gap-4 sm:grid-cols-2">
        <Link href="/admin/comments?status=pending" className="rounded-2xl border border-dashed border-coffee/25 bg-white/40 p-5 transition hover:-translate-y-1">
          <div className="flex items-start justify-between gap-4">
            <MessageCircleMore className="text-clay" />
            <span className="rounded-full bg-sand px-3 py-1 text-xs font-black">{pendingComments.count ?? 0} pending</span>
          </div>
          <h2 className="mt-4 font-display text-2xl font-black">Komentari na cekanju</h2>
          <p className="mt-2 text-sm font-bold text-coffee/65">Otvori listu komentara i rucno rijesi sve sto LLM ostavi za admina.</p>
        </Link>
        <Link href="/admin/wall-notes?status=pending" className="rounded-2xl border border-dashed border-coffee/25 bg-white/40 p-5 transition hover:-translate-y-1">
          <div className="flex items-start justify-between gap-4">
            <StickyNote className="text-clay" />
            <span className="rounded-full bg-sand px-3 py-1 text-xs font-black">{pendingNotes.count ?? 0} pending</span>
          </div>
          <h2 className="mt-4 font-display text-2xl font-black">Zid podrske</h2>
          <p className="mt-2 text-sm font-bold text-coffee/65">Odobri sticky notes, provjeri crteze i makni ono sto ne pase na pano.</p>
        </Link>
      </section>

      <Link href="/" className="mt-8 inline-flex items-center gap-2 text-sm font-black text-clay">
        <Clock3 size={17} />
        Pogledaj javnu stranicu
      </Link>
    </>
  );
}
