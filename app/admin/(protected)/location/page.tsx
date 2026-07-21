import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { LocationForm } from "@/components/admin/LocationForm";
import { requireAdminContext } from "@/lib/auth/admin-server";

function formatDate(value?: string) {
  if (!value) return "Nema spremljene lokacije";
  return new Intl.DateTimeFormat("hr-HR", { dateStyle: "full", timeStyle: "short" }).format(new Date(value));
}

export default async function AdminLocationPage() {
  const { supabase } = await requireAdminContext();
  const [location, settings] = await Promise.all([
    supabase.from("current_locations").select("*").order("created_at", { ascending: false }).limit(1).maybeSingle(),
    supabase.from("trip_settings").select("current_country").eq("id", 1).maybeSingle()
  ]);

  return (
    <>
      <AdminPageHeader eyebrow="Brzi update" title="Trenutna GPS lokacija" description="Ovo je najbrža akcija s ceste. Novi marker i prošli dio rute pojavit će se odmah na javnoj karti." />
      <div className="mb-6 rounded-2xl bg-sea p-5 text-paper shadow-paper">
        <p className="text-xs font-black uppercase tracking-[0.18em] text-sunset">Zadnji update</p>
        <p className="mt-2 font-display text-2xl font-black">{formatDate(location.data?.created_at)}</p>
        {location.data ? <p className="mt-2 text-sm font-bold text-paper/75">{location.data.latitude.toFixed(5)}, {location.data.longitude.toFixed(5)}{location.data.note ? ` · ${location.data.note}` : ""}</p> : null}
      </div>
      <LocationForm defaultCountry={settings.data?.current_country ?? ""} />
    </>
  );
}
