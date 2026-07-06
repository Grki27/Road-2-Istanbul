import Image from "next/image";
import type { DailyRecap } from "@/types";
import { fatigueScale } from "@/data/mockData";

export function Timeline({ recaps, preview }: { recaps: DailyRecap[]; preview: DailyRecap[] }) {
  const items = recaps.length ? recaps : preview;

  return (
    <section id="dnevnik" className="px-5 py-20">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 max-w-3xl">
          <p className="text-xs font-black uppercase tracking-[0.26em] text-clay">Dnevnik puta</p>
          <h2 className="mt-3 font-display text-4xl font-black md:text-6xl">Dan po dan, kad cesta počne.</h2>
          {!recaps.length ? (
            <p className="mt-4 text-lg leading-8 text-coffee/80">
              Ovo je preview kartice. Pravi dnevni updatei pojavit će se tek kad ih admin objavi.
            </p>
          ) : null}
        </div>
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {items.map((recap) => {
            const fatigue = fatigueScale[recap.fatigueRating];
            return (
              <article key={recap.id} className="overflow-hidden rounded-[2rem] bg-paper shadow-paper">
                <div className="relative h-56">
                  <Image src={recap.coverImage ?? "/assets/journey-support-1.jpg"} alt={recap.title} fill className="object-cover" />
                  <div className="absolute left-4 top-4 rounded-full bg-ink px-4 py-2 text-sm font-black text-paper">
                    Dan {recap.dayNumber}
                  </div>
                </div>
                <div className="p-5">
                  <p className="text-sm font-black text-clay">
                    {recap.startLocation} → {recap.endLocation}
                  </p>
                  <h3 className="mt-2 font-display text-2xl font-black">{recap.title}</h3>
                  <p className="mt-3 line-clamp-3 leading-7 text-coffee/80">{recap.shortText}</p>
                  <div className="mt-5 flex flex-wrap gap-2 text-sm font-black">
                    <span className="rounded-full bg-white/70 px-3 py-2">{recap.distanceKm} km</span>
                    <span className="rounded-full bg-white/70 px-3 py-2">{fatigue.emoji} {fatigue.label}</span>
                  </div>
                  <div className="mt-5 flex gap-2">
                    <button className="flex-1 rounded-full bg-ink px-4 py-3 text-sm font-black text-paper">
                      Otvori na karti
                    </button>
                    <button className="flex-1 rounded-full bg-sunset px-4 py-3 text-sm font-black text-ink">
                      Pročitaj više
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
