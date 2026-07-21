"use client";

import { useState } from "react";
import { LoaderCircle, Navigation } from "lucide-react";
import { updateCurrentLocationAction, type AdminActionResult } from "@app/admin/actions";
import { AdminActionMessage, inputClassName, labelClassName, UseCurrentLocationButton } from "@/components/admin/AdminFormUi";

export function LocationForm({ defaultCountry = "" }: { defaultCountry?: string }) {
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [note, setNote] = useState("");
  const [country, setCountry] = useState(defaultCountry);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<AdminActionResult | null>(null);

  async function save() {
    if (!latitude.trim() || !longitude.trim()) {
      setResult({ ok: false, message: "GPS lokacija ili ručne koordinate su obavezne." });
      return;
    }

    setBusy(true);
    setResult(null);
    const actionResult = await updateCurrentLocationAction({
      latitude: Number(latitude),
      longitude: Number(longitude),
      note,
      currentCountry: country
    });
    setResult(actionResult);
    setBusy(false);
    if (actionResult.ok) setNote("");
  }

  return (
    <div className="space-y-6">
      <AdminActionMessage result={result} />
      <section className="rounded-2xl bg-white/70 p-5 shadow-paper sm:p-7">
        <UseCurrentLocationButton onLocation={(lat, lng) => { setLatitude(String(lat)); setLongitude(String(lng)); }} />
        <div className="mt-6 grid gap-5 sm:grid-cols-2">
          <label className={labelClassName}>Latitude<input className={inputClassName} type="number" step="any" value={latitude} onChange={(e) => setLatitude(e.target.value)} placeholder="42.6507" /></label>
          <label className={labelClassName}>Longitude<input className={inputClassName} type="number" step="any" value={longitude} onChange={(e) => setLongitude(e.target.value)} placeholder="18.0944" /></label>
          <label className={`${labelClassName} sm:col-span-2`}>Kratka napomena<textarea className={`${inputClassName} min-h-24 resize-y`} maxLength={300} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Stali smo na kavu prije granice." /></label>
          <label className={`${labelClassName} sm:col-span-2`}>Trenutna država, opcionalno<input className={inputClassName} maxLength={80} value={country} onChange={(e) => setCountry(e.target.value)} placeholder="Crna Gora" /><span className="mt-2 block text-xs font-bold text-coffee/55">Ako je ostaviš praznom, javna statistika države se neće mijenjati.</span></label>
        </div>
        <button type="button" onClick={() => void save()} disabled={busy} className="mt-6 inline-flex min-h-14 w-full items-center justify-center gap-2 rounded-full bg-clay px-6 py-4 font-black text-paper shadow-pin disabled:opacity-60 sm:w-auto">
          {busy ? <LoaderCircle className="animate-spin" size={20} /> : <Navigation size={20} />}
          Objavi trenutnu lokaciju
        </button>
      </section>
    </div>
  );
}
