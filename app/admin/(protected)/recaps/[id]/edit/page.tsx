import { notFound } from "next/navigation";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { RecapForm } from "@/components/admin/RecapForm";
import { requireAdminContext } from "@/lib/auth/admin-server";

export default async function EditRecapPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase } = await requireAdminContext();
  const [recapResult, imagesResult] = await Promise.all([
    supabase.from("daily_recaps").select("*").eq("id", id).maybeSingle(),
    supabase.from("recap_images").select("*").eq("recap_id", id).order("sort_order", { ascending: true })
  ]);

  if (!recapResult.data) notFound();

  return (
    <>
      <AdminPageHeader eyebrow={`Dan ${recapResult.data.day_number}`} title={`Uredi: ${recapResult.data.title}`} description="Promjene se na javnoj stranici vide nakon objave." backHref="/admin/recaps" />
      <RecapForm
        recap={recapResult.data}
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
