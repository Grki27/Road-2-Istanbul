"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LoaderCircle, MapPinPlus } from "lucide-react";
import { saveMapEventAction, type AdminActionResult } from "@app/admin/actions";
import { AdminActionMessage, inputClassName, labelClassName, UseCurrentLocationButton } from "@/components/admin/AdminFormUi";
import { ImageUploader, type AdminImage } from "@/components/admin/ImageUploader";
import type { Database } from "@/types/database";

type EventRow = Database["public"]["Tables"]["map_events"]["Row"];

export function MapEventForm({ event, initialImages }: { event?: EventRow; initialImages: AdminImage[] }) {
  const router = useRouter();
  const [emoji, setEmoji] = useState(event?.emoji ?? "📍");
  const [title, setTitle] = useState(event?.title ?? "");
  const [description, setDescription] = useState(event?.description ?? "");
  const [locationName, setLocationName] = useState(event?.location_name ?? "");
  const [country, setCountry] = useState(event?.country ?? "");
  const [latitude, setLatitude] = useState(event ? String(event.latitude) : "");
  const [longitude, setLongitude] = useState(event ? String(event.longitude) : "");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<AdminActionResult | null>(null);

  async function save() {
    if (!latitude.trim() || !longitude.trim()) {
      setResult({ ok: false, message: "GPS lokacija ili ručne koordinate su obavezne." });
      return;
    }
    setBusy(true);
    setResult(null);
    const actionResult = await saveMapEventAction({
      id: event?.id,
      emoji,
      title,
      description,
      locationName,
      country,
      latitude: Number(latitude),
      longitude: Number(longitude)
    });
    setResult(actionResult);
    setBusy(false);
    if (actionResult.ok && !event?.id && actionResult.id) {
      router.replace(`/admin/map-events/${actionResult.id}/edit`);
    } else if (actionResult.ok) {
      router.refresh();
    }
  }

  return (
    <div className="space-y-6">
      <AdminActionMessage result={result} />
      <section className="rounded-2xl bg-white/70 p-5 shadow-paper sm:p-7">
        <div className="grid gap-5 sm:grid-cols-[110px_1fr]">
          <label className={labelClassName}>Emoji<input className={`${inputClassName} text-center text-3xl`} maxLength={16} value={emoji} onChange={(e) => setEmoji(e.target.value)} /></label>
          <label className={labelClassName}>Naslov pina<input className={inputClassName} maxLength={120} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Najbolja pita dosad" /></label>
        </div>
        <label className={`${labelClassName} mt-5`}>Opis<textarea className={`${inputClassName} min-h-32 resize-y`} maxLength={2000} value={description} onChange={(e) => setDescription(e.target.value)} /></label>
        <div className="mt-5 grid gap-5 sm:grid-cols-2">
          <label className={labelClassName}>Naziv mjesta<input className={inputClassName} value={locationName} onChange={(e) => setLocationName(e.target.value)} /></label>
          <label className={labelClassName}>Država<input className={inputClassName} value={country} onChange={(e) => setCountry(e.target.value)} /></label>
        </div>
      </section>

      <section className="rounded-2xl bg-white/70 p-5 shadow-paper sm:p-7">
        <h2 className="font-display text-2xl font-black">Lokacija pina</h2>
        <div className="mt-4"><UseCurrentLocationButton onLocation={(lat, lng) => { setLatitude(String(lat)); setLongitude(String(lng)); }} /></div>
        <div className="mt-5 grid gap-5 sm:grid-cols-2">
          <label className={labelClassName}>Latitude<input className={inputClassName} type="number" step="any" value={latitude} onChange={(e) => setLatitude(e.target.value)} /></label>
          <label className={labelClassName}>Longitude<input className={inputClassName} type="number" step="any" value={longitude} onChange={(e) => setLongitude(e.target.value)} /></label>
        </div>
      </section>

      <section className="rounded-2xl bg-white/70 p-5 shadow-paper sm:p-7">
        <h2 className="font-display text-2xl font-black">Fotografije događaja</h2>
        <p className="mt-2 text-sm font-bold text-coffee/65">Do 5 fotografija. Prvo spremi pin da otključaš upload.</p>
        <div className="mt-5"><ImageUploader kind="event" parentId={event?.id} initialImages={initialImages} maxImages={5} /></div>
      </section>

      <button type="button" onClick={() => void save()} disabled={busy} className="sticky bottom-20 z-30 inline-flex min-h-14 w-full items-center justify-center gap-2 rounded-full bg-clay px-6 py-4 font-black text-paper shadow-pin disabled:opacity-60 lg:bottom-4 sm:w-auto">
        {busy ? <LoaderCircle className="animate-spin" size={20} /> : <MapPinPlus size={20} />}
        {event ? "Spremi promjene" : "Spremi pin"}
      </button>
    </div>
  );
}
