import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { TripSettingsForm } from "@/components/admin/TripSettingsForm";
import { requireAdminContext } from "@/lib/auth/admin-server";

export default async function AdminSettingsPage() {
  const { supabase } = await requireAdminContext();
  const { data: settings, error } = await supabase.from("trip_settings").select("*").eq("id", 1).single();

  return (
    <>
      <AdminPageHeader eyebrow="Globalno" title="Statistika i donacije" description="Ove vrijednosti odmah hrane javne brojke i humanitarnu sekciju." />
      {error || !settings ? <p className="rounded-2xl bg-red-100 p-5 font-bold text-red-950">Postavke se nisu učitale: {error?.message ?? "Nema retka trip_settings."}</p> : <TripSettingsForm settings={settings} />}
    </>
  );
}
