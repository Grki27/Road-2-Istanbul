import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { RecapForm } from "@/components/admin/RecapForm";
import { requireAdminContext } from "@/lib/auth/admin-server";

export default async function NewRecapPage() {
  const { supabase } = await requireAdminContext();
  const { data: latest } = await supabase
    .from("daily_recaps")
    .select("day_number, date")
    .order("day_number", { ascending: false })
    .limit(1)
    .maybeSingle();

  const nextDate = latest?.date
    ? new Date(new Date(`${latest.date}T12:00:00`).getTime() + 86400000).toISOString().slice(0, 10)
    : "2026-08-25";

  return (
    <>
      <AdminPageHeader eyebrow="Novi zapis" title="Novi dnevni recap" description="Spremi nacrt čim upišeš osnovno. Fotografije možeš dodati odmah nakon toga." backHref="/admin/recaps" />
      <RecapForm initialImages={[]} defaults={{ dayNumber: (latest?.day_number ?? 0) + 1, date: nextDate }} />
    </>
  );
}
