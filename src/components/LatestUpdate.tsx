import { BedDouble, CalendarDays, Flag, Route } from "lucide-react";
import { ExpandableText } from "@/components/ExpandableText";
import { PhotoGallery } from "@/components/PhotoGallery";
import { RecapComments } from "@/components/RecapComments";
import type { DailyRecap } from "@/types";
import { fatigueScale } from "@/config/fatigue";
import { formatCountry, formatKilometerRange } from "@/lib/trip-format";

export function LatestUpdate({ recap }: { recap?: DailyRecap }) {
  if (!recap) {
    return (
      <section className="hidden px-5 py-12 md:block">
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
  const images = recap.images.length
    ? recap.images
    : [recap.coverImage ?? "/assets/journey-support-1.jpg"];

  return (
    <section className="hidden px-5 py-12 md:block">
      <div className="mx-auto grid max-w-6xl overflow-hidden rounded-[2rem] bg-paper shadow-paper md:grid-cols-[0.9fr_1.1fr]">
        <PhotoGallery images={images} title={recap.title} className="min-h-[320px]" />
        <div className="p-7 md:p-10">
          <p className="text-xs font-black uppercase tracking-[0.26em] text-clay">
            Zadnji update s ceste
          </p>
          <h2 className="mt-3 font-display text-4xl font-black">{recap.title}</h2>
          <p className="mt-3 font-black text-clay">
            {formatKilometerRange(recap.startLocation, recap.endLocation)}
          </p>
          <div className="mt-5 grid gap-3 text-sm font-bold text-coffee/80 sm:grid-cols-2 lg:grid-cols-4">
            <span className="flex items-center gap-2"><CalendarDays size={18} />Dan {recap.dayNumber}</span>
            <span className="flex items-center gap-2"><Route size={18} />{recap.distanceKm} km</span>
            <span className="flex items-center gap-2"><Flag size={18} />{formatCountry(recap.country)}</span>
            {recap.sleepingLocation ? <span className="flex items-center gap-2"><BedDouble size={18} />{recap.sleepingLocation}</span> : null}
          </div>
          <ExpandableText
            text={recap.shortText}
            className="mt-5 text-lg leading-8 text-coffee/88"
            collapsedClassName="line-clamp-4"
            threshold={260}
          />
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
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <div className="inline-flex items-center gap-2 rounded-full bg-sunset px-4 py-2 font-black">
              <span>{fatigue.emoji}</span>
              Razina umora: {fatigue.label}
            </div>
            <RecapComments
              recapId={recap.id}
              recapTitle={recap.title}
              comments={recap.comments}
              buttonClassName="inline-flex items-center justify-center gap-2 rounded-full bg-ink px-4 py-2 font-black text-paper shadow-pin transition hover:-translate-y-0.5"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
