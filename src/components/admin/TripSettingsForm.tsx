"use client";

import { useState } from "react";
import { LoaderCircle, Save } from "lucide-react";
import { saveTripSettingsAction, type AdminActionResult } from "@app/admin/actions";
import { AdminActionMessage, inputClassName, labelClassName } from "@/components/admin/AdminFormUi";
import type { Database } from "@/types/database";

type SettingsRow = Database["public"]["Tables"]["trip_settings"]["Row"];

export function TripSettingsForm({ settings }: { settings: SettingsRow }) {
  const [plannedTotalKm, setPlannedTotalKm] = useState(String(settings.planned_total_km));
  const [currentCountry, setCurrentCountry] = useState(settings.current_country ?? "");
  const [countriesVisited, setCountriesVisited] = useState(String(settings.countries_visited));
  const [borderCrossings, setBorderCrossings] = useState(String(settings.border_crossings));
  const [donationGoal, setDonationGoal] = useState(String(settings.donation_goal));
  const [donationRaised, setDonationRaised] = useState(String(settings.donation_raised));
  const [donationUrl, setDonationUrl] = useState(settings.donation_url ?? "");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<AdminActionResult | null>(null);

  async function save() {
    setBusy(true);
    setResult(null);
    const actionResult = await saveTripSettingsAction({
      plannedTotalKm: Number(plannedTotalKm),
      currentCountry,
      countriesVisited: Number(countriesVisited),
      borderCrossings: Number(borderCrossings),
      donationGoal: Number(donationGoal),
      donationRaised: Number(donationRaised),
      donationUrl
    });
    setResult(actionResult);
    setBusy(false);
  }

  return (
    <div className="space-y-6">
      <AdminActionMessage result={result} />
      <section className="rounded-2xl bg-white/70 p-5 shadow-paper sm:p-7">
        <h2 className="font-display text-2xl font-black">Putovanje</h2>
        <div className="mt-5 grid gap-5 sm:grid-cols-2">
          <label className={labelClassName}>Planirano kilometara<input className={inputClassName} type="number" min="1" value={plannedTotalKm} onChange={(e) => setPlannedTotalKm(e.target.value)} /></label>
          <label className={labelClassName}>Trenutna država<input className={inputClassName} value={currentCountry} onChange={(e) => setCurrentCountry(e.target.value)} /></label>
          <label className={labelClassName}>Posjećene države<input className={inputClassName} type="number" min="0" value={countriesVisited} onChange={(e) => setCountriesVisited(e.target.value)} /></label>
          <label className={labelClassName}>Prijeđene granice<input className={inputClassName} type="number" min="0" value={borderCrossings} onChange={(e) => setBorderCrossings(e.target.value)} /></label>
        </div>
      </section>
      <section className="rounded-2xl bg-ink p-5 text-paper shadow-paper sm:p-7">
        <h2 className="font-display text-2xl font-black">Donacije</h2>
        <div className="mt-5 grid gap-5 sm:grid-cols-2">
          <label className="block text-sm font-black">Cilj u eurima<input className={`${inputClassName} text-ink`} type="number" min="0" step="0.01" value={donationGoal} onChange={(e) => setDonationGoal(e.target.value)} /></label>
          <label className="block text-sm font-black">Prikupljeno eura<input className={`${inputClassName} text-ink`} type="number" min="0" step="0.01" value={donationRaised} onChange={(e) => setDonationRaised(e.target.value)} /></label>
          <label className="block text-sm font-black sm:col-span-2">Vanjski donation URL<input className={`${inputClassName} text-ink`} type="url" value={donationUrl} onChange={(e) => setDonationUrl(e.target.value)} placeholder="https://..." /></label>
        </div>
      </section>
      <button type="button" onClick={() => void save()} disabled={busy} className="inline-flex min-h-14 w-full items-center justify-center gap-2 rounded-full bg-clay px-6 py-4 font-black text-paper shadow-pin disabled:opacity-60 sm:w-auto">{busy ? <LoaderCircle className="animate-spin" size={20} /> : <Save size={20} />} Spremi postavke</button>
    </div>
  );
}
