import { notFound } from "next/navigation";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { MapEventForm } from "@/components/admin/MapEventForm";
import { requireAdminContext } from "@/lib/auth/admin-server";

export default async function EditMapEventPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase } = await requireAdminContext();
  const [eventResult, imagesResult] = await Promise.all([
    supabase.from("map_events").select("*").eq("id", id).maybeSingle(),
    supabase.from("map_event_images").select("*").eq("map_event_id", id).order("sort_order", { ascending: true })
  ]);
  if (!eventResult.data) notFound();

  return (
    <>
      <AdminPageHeader eyebrow="Uredi pin" title={`${eventResult.data.emoji} ${eventResult.data.title}`} backHref="/admin/map-events" />
      <MapEventForm
        event={eventResult.data}
        initialImages={(imagesResult.data ?? []).map((image) => ({ id: image.id, imageUrl: image.image_url, storagePath: image.storage_path ?? undefined, sortOrder: image.sort_order }))}
      />
    </>
  );
}
