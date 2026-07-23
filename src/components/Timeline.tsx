import { Flag, Star } from "lucide-react";
import { ExpandableText } from "@/components/ExpandableText";
import { MapFocusButton } from "@/components/MapFocusButton";
import { PhotoGallery } from "@/components/PhotoGallery";
import { RecapComments } from "@/components/RecapComments";
import type { DailyRecap } from "@/types";
import { fatigueScale } from "@/data/mockData";
import { formatCountry, formatKilometerRange } from "@/lib/trip-format";

export function Timeline({ recaps, isPreview }: { recaps: DailyRecap[]; isPreview: boolean }) {
  return (
    <section id="dnevnik" className="px-5 py-20">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 max-w-3xl">
          <p className="text-xs font-black uppercase tracking-[0.26em] text-clay">Dnevnik puta</p>
          <h2 className="mt-3 font-display text-4xl font-black md:text-6xl">Kilometri, granice i dnevni recapovi</h2>
          {isPreview ? (
            <p className="mt-4 text-lg leading-8 text-coffee/80">
              Ovo je jasno označen preview. Zamijenit će ga prvi dnevni update koji admin objavi.
            </p>
          ) : null}
        </div>
        {recaps.length ? (
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {recaps.map((recap) => {
            const fatigue = fatigueScale[recap.fatigueRating];
            const images = recap.images.length
              ? recap.images
              : [recap.coverImage ?? "/assets/journey-support-1.jpg"];
            return (
              <article
                id={`recap-${recap.id}`}
                key={recap.id}
                className="scroll-mt-24 overflow-hidden rounded-[2rem] bg-paper shadow-paper"
              >
                <div className="relative h-56">
                  <PhotoGallery images={images} title={recap.title} className="h-full" />
                  <div className="absolute left-4 top-4 rounded-full bg-ink px-4 py-2 text-sm font-black text-paper">
                    {isPreview ? "Preview · " : ""}Dan {recap.dayNumber}
                  </div>
                </div>
                <div className="p-5">
                  <p className="text-sm font-black text-clay">
                    {formatKilometerRange(recap.startLocation, recap.endLocation)}
                  </p>
                  <h3 className="mt-2 font-display text-2xl font-black">{recap.title}</h3>
                  <ExpandableText
                    text={recap.shortText}
                    className="mt-3 leading-7 text-coffee/80"
                    threshold={135}
                  />
                  <div className="mt-5 flex flex-wrap gap-2 text-sm font-black">
                    <span className="rounded-full bg-white/70 px-3 py-2">{recap.distanceKm} km</span>
                    <span className="inline-flex items-center gap-2 rounded-full bg-white/70 px-3 py-2"><Flag size={16} />{formatCountry(recap.country)}</span>
                    <span className="rounded-full bg-white/70 px-3 py-2">{fatigue.emoji} {fatigue.label}</span>
                    {recap.specialMilestoneType ? <span className="inline-flex items-center gap-2 rounded-full bg-sand px-3 py-1.5"><Star size={15} fill="currentColor" />{recap.specialMilestoneType}</span> : null}
                  </div>
                  <div className="mt-5 flex flex-wrap gap-2">
                    {recap.latitude !== undefined && recap.longitude !== undefined ? (
                      <MapFocusButton recapId={recap.id} />
                    ) : (
                      <span className="flex-1 rounded-full bg-coffee/10 px-4 py-3 text-center text-sm font-black text-coffee/55">
                        Lokacija nije upisana
                      </span>
                    )}
                    <RecapComments
                      recapId={recap.id}
                      recapTitle={recap.title}
                      comments={recap.comments}
                      buttonClassName="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-white/80 px-4 py-3 text-sm font-black text-ink shadow-pin transition hover:-translate-y-0.5"
                    />
                  </div>
                </div>
              </article>
            );
            })}
          </div>
        ) : (
          <div className="paper-edge rounded-[2rem] bg-paper p-8 text-center shadow-paper">
            <h3 className="font-display text-3xl font-black">Put još nije krenuo.</h3>
            <p className="mx-auto mt-3 max-w-2xl text-lg leading-8 text-coffee/80">
              Kad admin objavi prvi dnevni update, ovdje će se pojaviti prava priča s ceste.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
