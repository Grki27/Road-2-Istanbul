"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, Flag, LoaderCircle, Save, Send, Star, WifiOff, X } from "lucide-react";
import { saveRecapAction, type AdminActionResult } from "@app/admin/actions";
import { AdminActionMessage, inputClassName, labelClassName, UseCurrentLocationButton } from "@/components/admin/AdminFormUi";
import { ImageUploader, type AdminImage } from "@/components/admin/ImageUploader";
import type { Database } from "@/types/database";
import { formatCountry, formatKilometerRange } from "@/lib/trip-format";

type RecapRow = Database["public"]["Tables"]["daily_recaps"]["Row"];
type FormState = {
  dayNumber: string;
  date: string;
  title: string;
  startLocation: string;
  endLocation: string;
  sleepingLocation: string;
  country: string;
  latitude: string;
  longitude: string;
  distanceKm: string;
  shortText: string;
  fatigueRating: string;
  marinFatigueRating: string;
  markoFatigueRating: string;
  highlightOfTheDay: string;
  problemOfTheDay: string;
  isRestDay: boolean;
  specialMilestoneType: string;
};

const fatigueOptions = [
  { value: "1", label: "💀 mrtvi" },
  { value: "2", label: "😵 umiremo" },
  { value: "3", label: "😐 neloša" },
  { value: "4", label: "🙂 odmorni" },
  { value: "5", label: "🚀 letimoo" }
];

function stateFromRecap(recap?: RecapRow, defaults?: { dayNumber: number; date: string; previousTotalKm?: number }): FormState {
  return {
    dayNumber: String(recap?.day_number ?? defaults?.dayNumber ?? 1),
    date: recap?.date ?? defaults?.date ?? "",
    title: recap?.title ?? "",
    startLocation: recap?.start_location ?? "",
    endLocation: recap?.end_location ?? "",
    sleepingLocation: recap?.sleeping_location ?? "",
    country: recap?.country ?? "",
    latitude: recap?.latitude === null || recap?.latitude === undefined ? "" : String(recap.latitude),
    longitude: recap?.longitude === null || recap?.longitude === undefined ? "" : String(recap.longitude),
    distanceKm: recap?.distance_km === null || recap?.distance_km === undefined ? "" : String(recap.distance_km),
    shortText: recap?.short_text ?? "",
    fatigueRating: recap?.fatigue_rating ? String(recap.fatigue_rating) : "",
    marinFatigueRating: recap?.marin_fatigue_rating ? String(recap.marin_fatigue_rating) : "",
    markoFatigueRating: recap?.marko_fatigue_rating ? String(recap.marko_fatigue_rating) : "",
    highlightOfTheDay: recap?.highlight_of_the_day ?? "",
    problemOfTheDay: recap?.problem_of_the_day ?? "",
    isRestDay: recap?.is_rest_day ?? false,
    specialMilestoneType: recap?.special_milestone_type ?? ""
  };
}

function nullableNumber(value: string) {
  if (!value.trim()) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function formatKmValue(value: number) {
  return Number.isInteger(value) ? String(value) : value.toFixed(1).replace(/\.0$/, "");
}

function FieldError({ errors }: { errors?: string[] }) {
  return errors?.[0] ? <p className="mt-1 text-xs font-bold text-red-800">{errors[0]}</p> : null;
}

function RecapPreview({ form, onClose }: { form: FormState; onClose: () => void }) {
  const fatigue = fatigueOptions.find((option) => option.value === form.fatigueRating)?.label ?? "Bez ocjene";

  return (
    <div className="fixed inset-0 z-[100] overflow-y-auto bg-ink/[0.65] p-3 backdrop-blur-sm sm:p-8">
      <div className="mx-auto max-w-3xl overflow-hidden rounded-2xl bg-paper shadow-paper">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-coffee/10 bg-paper/95 px-5 py-4 backdrop-blur">
          <p className="font-black">Preview recapa</p>
          <button type="button" onClick={onClose} className="grid h-10 w-10 place-items-center rounded-full bg-ink text-paper" aria-label="Zatvori preview"><X size={19} /></button>
        </div>
        <div className="p-6 sm:p-9">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-clay">Dan {form.dayNumber || "?"} · {form.date || "Datum nije upisan"}</p>
          <h2 className="mt-3 font-display text-4xl font-black sm:text-5xl">{form.title || "Naslov recapa"}</h2>
          <p className="mt-3 font-black text-clay">{formatKilometerRange(form.startLocation, form.endLocation)}</p>
          <div className="mt-5 flex flex-wrap gap-2 text-sm font-black">
            <span className="rounded-full bg-white px-3 py-2">{form.distanceKm || 0} km</span>
            <span className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-2"><Flag size={16} />{formatCountry(form.country)}</span>
            <span className="rounded-full bg-sunset px-3 py-2">{fatigue}</span>
            {form.specialMilestoneType ? <span className="inline-flex items-center gap-2 rounded-full bg-sand px-3 py-1.5"><Star size={15} fill="currentColor" />{form.specialMilestoneType}</span> : null}
          </div>
          <p className="mt-6 whitespace-pre-wrap text-lg leading-8 text-coffee/85">{form.shortText || "Tekst dnevnog recapa pojavit će se ovdje."}</p>
          <div className="mt-7 grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl bg-white/70 p-5"><p className="font-black text-moss">Highlight dana</p><p className="mt-2 leading-7">{form.highlightOfTheDay || "Još nije upisan."}</p></div>
            <div className="rounded-2xl bg-white/70 p-5"><p className="font-black text-clay">Problem dana</p><p className="mt-2 leading-7">{form.problemOfTheDay || "Još nije upisan."}</p></div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function RecapForm({
  recap,
  initialImages,
  defaults
}: {
  recap?: RecapRow;
  initialImages: AdminImage[];
  defaults?: { dayNumber: number; date: string; previousTotalKm?: number };
}) {
  const router = useRouter();
  const [form, setForm] = useState<FormState>(() => stateFromRecap(recap, defaults));
  const [result, setResult] = useState<AdminActionResult | null>(null);
  const [busy, setBusy] = useState<"draft" | "published" | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [savedDraft, setSavedDraft] = useState<FormState | null>(null);
  const [online, setOnline] = useState(true);
  const [autosaveReady, setAutosaveReady] = useState(false);
  const storageKey = useMemo(() => `sedmo-nebo-admin-recap-${recap?.id ?? "new"}`, [recap?.id]);
  const previousTotalKm = defaults?.previousTotalKm ?? 0;
  const todayDistanceKm = nullableNumber(form.distanceKm);
  const computedStartKm = previousTotalKm;
  const computedEndKm = previousTotalKm + (todayDistanceKm ?? 0);
  const computedStartLocation = formatKmValue(computedStartKm);
  const computedEndLocation = todayDistanceKm === null ? "" : formatKmValue(computedEndKm);

  useEffect(() => {
    setOnline(navigator.onLine);
    const handleOnline = () => setOnline(true);
    const handleOffline = () => setOnline(false);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) setSavedDraft(JSON.parse(stored) as FormState);
    } catch {
      localStorage.removeItem(storageKey);
    }
    setAutosaveReady(true);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [storageKey]);

  useEffect(() => {
    if (!autosaveReady) return;
    const timeout = window.setTimeout(() => {
      localStorage.setItem(storageKey, JSON.stringify(form));
    }, 700);
    return () => window.clearTimeout(timeout);
  }, [autosaveReady, form, storageKey]);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function save(status: "draft" | "published") {
    setBusy(status);
    setResult(null);
    const actionResult = await saveRecapAction({
      id: recap?.id,
      dayNumber: Number(form.dayNumber),
      date: form.date,
      title: form.title,
      sleepingLocation: form.sleepingLocation,
      country: form.country,
      latitude: nullableNumber(form.latitude),
      longitude: nullableNumber(form.longitude),
      distanceKm: nullableNumber(form.distanceKm),
      shortText: form.shortText,
      fatigueRating: nullableNumber(form.fatigueRating),
      marinFatigueRating: nullableNumber(form.marinFatigueRating),
      markoFatigueRating: nullableNumber(form.markoFatigueRating),
      highlightOfTheDay: form.highlightOfTheDay,
      problemOfTheDay: form.problemOfTheDay,
      isRestDay: form.isRestDay,
      specialMilestoneType: form.specialMilestoneType,
      startLocation: todayDistanceKm === null ? "" : computedStartLocation,
      endLocation: todayDistanceKm === null ? "" : computedEndLocation,
      status
    });
    setResult(actionResult);
    setBusy(null);

    if (actionResult.ok) {
      localStorage.removeItem(storageKey);
      setSavedDraft(null);
      if (!recap?.id && actionResult.id) {
        router.replace(`/admin/recaps/${actionResult.id}/edit`);
      } else {
        router.refresh();
      }
    }
  }

  const errors = result?.fieldErrors ?? {};

  return (
    <div className="space-y-6">
      {!online ? (
        <div className="flex items-center gap-3 rounded-2xl bg-red-100 px-4 py-3 text-sm font-black text-red-950"><WifiOff size={18} /> Offline si. Nacrt se i dalje sprema lokalno.</div>
      ) : null}
      {savedDraft ? (
        <div className="rounded-2xl bg-sand p-4">
          <p className="font-black">Pronađen je lokalni nacrt.</p>
          <p className="mt-1 text-sm font-bold text-coffee/70">Možeš ga vratiti ili nastaviti s podacima iz baze.</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button type="button" onClick={() => { setForm(savedDraft); setSavedDraft(null); }} className="rounded-full bg-ink px-4 py-2 text-sm font-black text-paper">Vrati lokalni nacrt</button>
            <button type="button" onClick={() => { localStorage.removeItem(storageKey); setSavedDraft(null); }} className="rounded-full bg-white/70 px-4 py-2 text-sm font-black">Odbaci</button>
          </div>
        </div>
      ) : null}

      <AdminActionMessage result={result} />

      <section className="rounded-2xl bg-white/65 p-5 shadow-paper sm:p-6">
        <h2 className="font-display text-2xl font-black">Osnovno</h2>
        <div className="mt-5 grid gap-5 sm:grid-cols-2">
          <label className={labelClassName}>Dan puta<input className={inputClassName} type="number" min="1" max="365" value={form.dayNumber} onChange={(e) => update("dayNumber", e.target.value)} /><FieldError errors={errors.dayNumber} /></label>
          <label className={labelClassName}>Datum<input className={inputClassName} type="date" value={form.date} onChange={(e) => update("date", e.target.value)} /><FieldError errors={errors.date} /></label>
          <label className={`${labelClassName} sm:col-span-2`}>Naslov<input className={inputClassName} maxLength={120} value={form.title} onChange={(e) => update("title", e.target.value)} placeholder="Kiša, granica i najbolji burek dosad" /><FieldError errors={errors.title} /></label>
          <div className="rounded-2xl bg-sand/75 p-4 sm:col-span-2">
            <div className="grid gap-3 sm:grid-cols-[1fr_1.2fr_1fr] sm:items-end">
              <div>
                <p className="text-xs font-black uppercase text-clay">Start se računa</p>
                <p className="mt-1 font-display text-3xl font-black">{computedStartLocation} km</p>
              </div>
              <label className={labelClassName}>Danas prešli kilometara<input className={inputClassName} type="number" min="0" max="500" step="0.1" value={form.distanceKm} onChange={(e) => update("distanceKm", e.target.value)} placeholder="80" /><FieldError errors={errors.distanceKm} /></label>
              <div>
                <p className="text-xs font-black uppercase text-clay">Finish nakon dana</p>
                <p className="mt-1 font-display text-3xl font-black">{computedEndLocation || `${computedStartLocation} km`}{computedEndLocation ? " km" : ""}</p>
              </div>
            </div>
          </div>
          <label className={labelClassName}>Mjesto spavanja<input className={inputClassName} value={form.sleepingLocation} onChange={(e) => update("sleepingLocation", e.target.value)} placeholder="Skadar" /></label>
          <label className={labelClassName}>Država<input className={inputClassName} value={form.country} onChange={(e) => update("country", e.target.value)} /><FieldError errors={errors.country} /></label>
          <label className={labelClassName}>Poseban milestone<input className={inputClassName} value={form.specialMilestoneType} onChange={(e) => update("specialMilestoneType", e.target.value)} placeholder="Prva granica, 500 km..." /></label>
        </div>
        <label className="mt-5 flex min-h-12 items-center gap-3 rounded-2xl bg-sand px-4 py-3 font-black"><input type="checkbox" className="h-5 w-5 accent-clay" checked={form.isRestDay} onChange={(e) => update("isRestDay", e.target.checked)} /> Dan odmora</label>
      </section>

      <section className="rounded-2xl bg-white/65 p-5 shadow-paper sm:p-6">
        <h2 className="font-display text-2xl font-black">Lokacija pina</h2>
        <p className="mt-2 text-sm font-bold text-coffee/65">Koordinate su obavezne tek kod objave.</p>
        <div className="mt-4"><UseCurrentLocationButton onLocation={(lat, lng) => { update("latitude", String(lat)); update("longitude", String(lng)); }} /></div>
        <div className="mt-5 grid gap-5 sm:grid-cols-2">
          <label className={labelClassName}>Latitude<input className={inputClassName} type="number" step="any" value={form.latitude} onChange={(e) => update("latitude", e.target.value)} /><FieldError errors={errors.latitude} /></label>
          <label className={labelClassName}>Longitude<input className={inputClassName} type="number" step="any" value={form.longitude} onChange={(e) => update("longitude", e.target.value)} /><FieldError errors={errors.longitude} /></label>
        </div>
      </section>

      <section className="rounded-2xl bg-white/65 p-5 shadow-paper sm:p-6">
        <h2 className="font-display text-2xl font-black">Priča dana</h2>
        <div className="mt-5 space-y-5">
          <label className={labelClassName}>Kratki recap<textarea className={`${inputClassName} min-h-36 resize-y`} maxLength={4000} value={form.shortText} onChange={(e) => update("shortText", e.target.value)} /><FieldError errors={errors.shortText} /></label>
          <div className="grid gap-5 sm:grid-cols-2">
            <label className={labelClassName}>Highlight dana<textarea className={`${inputClassName} min-h-28 resize-y`} value={form.highlightOfTheDay} onChange={(e) => update("highlightOfTheDay", e.target.value)} /><FieldError errors={errors.highlightOfTheDay} /></label>
            <label className={labelClassName}>Problem dana<textarea className={`${inputClassName} min-h-28 resize-y`} value={form.problemOfTheDay} onChange={(e) => update("problemOfTheDay", e.target.value)} /><FieldError errors={errors.problemOfTheDay} /></label>
          </div>
        </div>
      </section>

      <section className="rounded-2xl bg-white/65 p-5 shadow-paper sm:p-6">
        <h2 className="font-display text-2xl font-black">Stanje ekipe</h2>
        <div className="mt-5 grid gap-5 sm:grid-cols-3">
          {([
            ["fatigueRating", "Stanje dana"],
            ["marinFatigueRating", "Marin"],
            ["markoFatigueRating", "Marko"]
          ] as const).map(([key, label]) => (
            <label key={key} className={labelClassName}>{label}<select className={inputClassName} value={form[key]} onChange={(e) => update(key, e.target.value)}><option value="">Odaberi</option>{fatigueOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select><FieldError errors={errors[key]} /></label>
          ))}
        </div>
      </section>

      <section className="rounded-2xl bg-white/65 p-5 shadow-paper sm:p-6">
        <h2 className="font-display text-2xl font-black">Fotografije</h2>
        <p className="mt-2 text-sm font-bold text-coffee/65">Do 10 slika. Svaka se prije uploada komprimira za cestu.</p>
        <div className="mt-5"><ImageUploader kind="recap" parentId={recap?.id} initialImages={initialImages} maxImages={10} /></div>
      </section>

      <div className="sticky bottom-20 z-30 grid gap-2 rounded-2xl border border-coffee/10 bg-paper/95 p-3 shadow-paper backdrop-blur sm:grid-cols-3 lg:bottom-4">
        <button type="button" onClick={() => setShowPreview(true)} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-sand px-5 py-3 font-black"><Eye size={19} /> Preview</button>
        <button type="button" onClick={() => void save("draft")} disabled={busy !== null} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-ink px-5 py-3 font-black text-paper disabled:opacity-60">{busy === "draft" ? <LoaderCircle className="animate-spin" size={19} /> : <Save size={19} />} Spremi nacrt</button>
        <button type="button" onClick={() => void save("published")} disabled={busy !== null} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-clay px-5 py-3 font-black text-paper disabled:opacity-60">{busy === "published" ? <LoaderCircle className="animate-spin" size={19} /> : <Send size={19} />} Objavi recap</button>
      </div>

      {showPreview ? (
        <RecapPreview
          form={{
            ...form,
            startLocation: todayDistanceKm === null ? "" : computedStartLocation,
            endLocation: todayDistanceKm === null ? "" : computedEndLocation
          }}
          onClose={() => setShowPreview(false)}
        />
      ) : null}
    </div>
  );
}
