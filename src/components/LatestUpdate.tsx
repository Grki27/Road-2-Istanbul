import Image from "next/image";
import { CalendarDays, Flag, Route } from "lucide-react";
import type { DailyRecap } from "@/types";
import { fatigueScale } from "@/data/mockData";

export function LatestUpdate({ recap, isPreview = false }: { recap?: DailyRecap; isPreview?: boolean }) {
  if (!recap) {
    return (
      <section id="zadnji-update" className="px-5 py-12">
        <div className="paper-edge mx-auto max-w-5xl rounded-[2rem] bg-paper p-8 text-center shadow-paper">
          <p className="text-xs font-black uppercase tracking-[0.26em] text-clay">Zadnji update s ceste</p>
          <h2 className="mt-3 font-display text-4xl font-black">Put još nije krenuo.</h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg leading-8 text-coffee/80">
            Kad Marin i Marko pošalju prvi dnevni recap, ovdje će se pojaviti svježa priča s ceste.
          </p>
        </div>
      </section>
    );
  }

  const fatigue = fatigueScale[recap.fatigueRating];

  return (
    <section id="zadnji-update" className="px-5 py-12">
      <div className="mx-auto grid max-w-6xl overflow-hidden rounded-[2rem] bg-paper shadow-paper md:grid-cols-[0.9fr_1.1fr]">
        <div className="relative min-h-[320px]">
          <Image src={recap.coverImage ?? "/assets/journey-support-1.jpg"} alt={recap.title} fill className="object-cover" />
        </div>
        <div className="p-7 md:p-10">
          <p className="text-xs font-black uppercase tracking-[0.26em] text-clay">
            {isPreview ? "Preview zadnjeg updatea" : "Zadnji update s ceste"}
          </p>
          <h2 className="mt-3 font-display text-4xl font-black">{recap.title}</h2>
          <div className="mt-5 grid gap-3 text-sm font-bold text-coffee/80 sm:grid-cols-3">
            <span className="flex items-center gap-2"><CalendarDays size={18} />Dan {recap.dayNumber}</span>
            <span className="flex items-center gap-2"><Route size={18} />{recap.distanceKm} km</span>
            <span className="flex items-center gap-2"><Flag size={18} />{recap.country}</span>
          </div>
          <p className="mt-5 text-lg leading-8 text-coffee/88">{recap.shortText}</p>
          <div className="mt-6 grid gap-3 md:grid-cols-2">
            <div className="rounded-2xl bg-white/60 p-4">
              <p className="text-sm font-black text-moss">Highlight dana</p>
              <p className="mt-2 leading-7">{recap.highlightOfTheDay}</p>
            </div>
            <div className="rounded-2xl bg-white/60 p-4">
              <p className="text-sm font-black text-clay">Problem dana</p>
              <p className="mt-2 leading-7">{recap.problemOfTheDay}</p>
            </div>
          </div>
          <div className="mt-6 inline-flex items-center gap-2 rounded-full bg-sunset px-4 py-2 font-black">
            <span>{fatigue.emoji}</span>
            Razina umora: {fatigue.label}
          </div>
        </div>
      </div>
    </section>
  );
}
