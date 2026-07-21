import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { MapEventForm } from "@/components/admin/MapEventForm";

export default function NewMapEventPage() {
  return (
    <>
      <AdminPageHeader eyebrow="Novi događaj" title="Dodaj pin na kartu" description="Spremi kratki trenutak s ceste. Fotografije dodaješ odmah nakon prvog spremanja." backHref="/admin/map-events" />
      <MapEventForm initialImages={[]} />
    </>
  );
}
