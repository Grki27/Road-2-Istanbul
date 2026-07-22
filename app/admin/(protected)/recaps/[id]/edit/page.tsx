import { notFound } from "next/navigation";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { RecapForm } from "@/components/admin/RecapForm";
import { requireAdminContext } from "@/lib/auth/admin-server";

export default async function EditRecapPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase } = await requireAdminContext();
  const [recapResult, imagesResult, recapsResult] = await Promise.all([
    supabase.from("daily_recaps").select("*").eq("id", id).maybeSingle(),
    supabase.from("recap_images").select("*").eq("recap_id", id).order("sort_order", { ascending: true }),
    supabase.from("daily_recaps").select("id, day_number, distance_km, status")
  ]);

  if (!recapResult.data) notFound();
  const recap = recapResult.data;

  const previousTotalKm = (recapsResult.data ?? [])
    .filter((row) =>
      row.id !== id &&
      row.status !== "archived" &&
      row.day_number < recap.day_number
    )
    .reduce((sum, row) => sum + Number(row.distance_km ?? 0), 0);

  return (
    <>
      <AdminPageHeader eyebrow={`Dan ${recap.day_number}`} title={`Uredi: ${recap.title}`} description="Promjene se na javnoj stranici vide nakon objave." backHref="/admin/recaps" />
      <RecapForm
        recap={recap}
        defaults={{
          dayNumber: recap.day_number,
          date: recap.date,
          previousTotalKm
        }}
        initialImages={(imagesResult.data ?? []).map((image) => ({
          id: image.id,
          imageUrl: image.image_url,
          storagePath: image.storage_path ?? undefined,
          sortOrder: image.sort_order
        }))}
      />
    </>
  );
}
