"use client";

import { type TouchEvent, useEffect, useState } from "react";
import { BedDouble, ChevronLeft, ChevronRight, Flag, Route } from "lucide-react";
import { ExpandableText } from "@/components/ExpandableText";
import { MapFocusButton } from "@/components/MapFocusButton";
import { PhotoGallery } from "@/components/PhotoGallery";
import { RecapComments } from "@/components/RecapComments";
import { fatigueScale } from "@/data/mockData";
import { formatCountry, formatKilometerRange } from "@/lib/trip-format";
import type { DailyRecap } from "@/types";

const mobileRecapsBatchSize = 3;
const desktopRecapsBatchSize = 6;
const swipeThresholdPx = 50;

export function Timeline({ recaps, isPreview }: { recaps: DailyRecap[]; isPreview: boolean }) {
  const [isMobile, setIsMobile] = useState(false);
  const [visibleRecaps, setVisibleRecaps] = useState(desktopRecapsBatchSize);
  const [activeMobileIndex, setActiveMobileIndex] = useState(Math.max(recaps.length - 1, 0));
  const [expandedMobileRecapIds, setExpandedMobileRecapIds] = useState<Set<string>>(new Set());
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const [pendingTimelineFocus, setPendingTimelineFocus] = useState<{
    recapId: string;
    expand: boolean;
  } | null>(null);
  const batchSize = isMobile ? mobileRecapsBatchSize : desktopRecapsBatchSize;
  const shownRecaps = recaps.slice(0, visibleRecaps);
  const canShowMore = !isMobile && visibleRecaps < recaps.length;
  const activeMobileRecap = recaps[activeMobileIndex];

  useEffect(() => {
    const media = window.matchMedia("(max-width: 767px)");
    const update = () => setIsMobile(media.matches);

    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    setVisibleRecaps(isMobile ? mobileRecapsBatchSize : desktopRecapsBatchSize);
  }, [isMobile, recaps.length]);

  useEffect(() => {
    setActiveMobileIndex(Math.max(recaps.length - 1, 0));
  }, [recaps.length]);

  useEffect(() => {
    function showRecapInTimeline(event: Event) {
      const detail = (event as CustomEvent<{ recapId?: string; expand?: boolean }>).detail;
      const recapId = detail?.recapId;
      if (!recapId) return;

      const recapIndex = recaps.findIndex((recap) => recap.id === recapId);
      if (recapIndex < 0) return;

      if (isMobile) {
        setActiveMobileIndex(recapIndex);
        setPendingTimelineFocus({ recapId, expand: Boolean(detail.expand) });
        return;
      }

      const requiredVisibleRecaps = Math.ceil((recapIndex + 1) / batchSize) * batchSize;
      setVisibleRecaps((current) => Math.max(current, requiredVisibleRecaps));
      setPendingTimelineFocus({ recapId, expand: Boolean(detail.expand) });
    }

    window.addEventListener("show-recap-in-timeline", showRecapInTimeline);
    return () => window.removeEventListener("show-recap-in-timeline", showRecapInTimeline);
  }, [batchSize, isMobile, recaps]);

  useEffect(() => {
    const focusIsVisible = isMobile
      ? activeMobileRecap?.id === pendingTimelineFocus?.recapId
      : shownRecaps.some((recap) => recap.id === pendingTimelineFocus?.recapId);

    if (!pendingTimelineFocus || !focusIsVisible) {
      return;
    }

    const timeout = window.setTimeout(() => {
      document
        .getElementById(`recap-${pendingTimelineFocus.recapId}`)
        ?.scrollIntoView({ behavior: "smooth", block: "start" });

      if (pendingTimelineFocus.expand) {
        if (isMobile) {
          setExpandedMobileRecapIds((current) => new Set(current).add(pendingTimelineFocus.recapId));
        } else {
          window.setTimeout(() => {
            window.dispatchEvent(
              new CustomEvent("expand-recap-text", {
                detail: { recapId: pendingTimelineFocus.recapId }
              })
            );
          }, 450);
        }
      }

      setPendingTimelineFocus(null);
    }, 80);

    return () => window.clearTimeout(timeout);
  }, [activeMobileRecap?.id, isMobile, pendingTimelineFocus, shownRecaps]);

  function goToOlderDay() {
    setActiveMobileIndex((current) => Math.max(current - 1, 0));
  }

  function goToNewerDay() {
    setActiveMobileIndex((current) => Math.min(current + 1, recaps.length - 1));
  }

  function handleTouchStart(event: TouchEvent<HTMLElement>) {
    setTouchStartX(event.touches[0]?.clientX ?? null);
  }

  function handleTouchEnd(event: TouchEvent<HTMLElement>) {
    if (touchStartX === null) return;
    const touchEndX = event.changedTouches[0]?.clientX ?? touchStartX;
    const delta = touchEndX - touchStartX;
    setTouchStartX(null);

    if (Math.abs(delta) < swipeThresholdPx) return;
    if (delta < 0) {
      goToOlderDay();
    } else {
      goToNewerDay();
    }
  }

  function toggleMobileDetails(recapId: string) {
    setExpandedMobileRecapIds((current) => {
      const next = new Set(current);
      if (next.has(recapId)) {
        next.delete(recapId);
      } else {
        next.add(recapId);
      }

      return next;
    });
  }

  return (
    <section id="dnevnik" className="px-5 py-20">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 max-w-3xl">
          <p className="text-xs font-black uppercase tracking-[0.26em] text-clay">Dnevnik puta</p>
          <h2 className="mt-3 font-display text-4xl font-black md:text-6xl">
            Kilometri, granice i dnevni recapovi
          </h2>
          {isPreview ? (
            <p className="mt-4 text-lg leading-8 text-coffee/80">
              Ovo je jasno označen preview. Zamijenit će ga prvi dnevni update koji admin objavi.
            </p>
          ) : null}
        </div>

        {recaps.length && isMobile && activeMobileRecap ? (
          <MobileTimelineCard
            canGoNewer={activeMobileIndex < recaps.length - 1}
            canGoOlder={activeMobileIndex > 0}
            expanded={expandedMobileRecapIds.has(activeMobileRecap.id)}
            isPreview={isPreview}
            onGoNewer={goToNewerDay}
            onGoOlder={goToOlderDay}
            onTouchEnd={handleTouchEnd}
            onTouchStart={handleTouchStart}
            onToggleDetails={() => toggleMobileDetails(activeMobileRecap.id)}
            recap={activeMobileRecap}
          />
        ) : null}

        {recaps.length && !isMobile ? (
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {shownRecaps.map((recap) => (
              <DesktopTimelineCard
                isPreview={isPreview}
                key={recap.id}
                recap={recap}
              />
            ))}
          </div>
        ) : null}

        {!recaps.length ? (
          <div className="paper-edge rounded-[2rem] bg-paper p-8 text-center shadow-paper">
            <h3 className="font-display text-3xl font-black">Put još nije krenuo.</h3>
            <p className="mx-auto mt-3 max-w-2xl text-lg leading-8 text-coffee/80">
              Kad admin objavi prvi dnevni update, ovdje će se pojaviti prava priča s ceste.
            </p>
          </div>
        ) : null}

        {canShowMore ? (
          <div className="mt-8 flex justify-center">
            <button
              className="inline-flex min-h-12 items-center justify-center rounded-full bg-ink px-6 py-3 font-black text-paper shadow-pin transition active:scale-95"
              onClick={() => setVisibleRecaps((current) => current + batchSize)}
              type="button"
            >
              Učitaj još
            </button>
          </div>
        ) : null}
      </div>
    </section>
  );
}

function getRecapImages(recap: DailyRecap) {
  return recap.images.length
    ? recap.images
    : [recap.coverImage ?? "/assets/journey-support-1.jpg"];
}

function DesktopTimelineCard({ recap, isPreview }: { recap: DailyRecap; isPreview: boolean }) {
  const fatigue = fatigueScale[recap.fatigueRating];

  return (
    <article
      id={`recap-${recap.id}`}
      className="scroll-mt-24 overflow-hidden rounded-[2rem] bg-paper shadow-paper"
    >
      <div className="relative h-56">
        <PhotoGallery images={getRecapImages(recap)} title={recap.title} className="h-full" />
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
          expandEventId={recap.id}
        />
        <div className="mt-5 flex flex-wrap gap-2 text-sm font-black">
          <span className="rounded-full bg-white/70 px-3 py-2">{recap.distanceKm} km</span>
          <span className="inline-flex items-center gap-2 rounded-full bg-white/70 px-3 py-2">
            <Flag size={16} />
            {formatCountry(recap.country)}
          </span>
          <span className="rounded-full bg-white/70 px-3 py-2">
            {fatigue.emoji} {fatigue.label}
          </span>
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
}

function MobileTimelineCard({
  recap,
  isPreview,
  expanded,
  canGoNewer,
  canGoOlder,
  onGoNewer,
  onGoOlder,
  onToggleDetails,
  onTouchStart,
  onTouchEnd
}: {
  recap: DailyRecap;
  isPreview: boolean;
  expanded: boolean;
  canGoNewer: boolean;
  canGoOlder: boolean;
  onGoNewer: () => void;
  onGoOlder: () => void;
  onToggleDetails: () => void;
  onTouchStart: (event: TouchEvent<HTMLElement>) => void;
  onTouchEnd: (event: TouchEvent<HTMLElement>) => void;
}) {
  const fatigue = fatigueScale[recap.fatigueRating];

  return (
    <div className="relative">
      <button
        aria-label="Prikaži noviji dan"
        className="absolute left-0 top-32 z-20 grid h-11 w-11 -translate-x-2 place-items-center rounded-full bg-ink text-paper shadow-pin disabled:opacity-30"
        disabled={!canGoNewer}
        onClick={onGoNewer}
        type="button"
      >
        <ChevronLeft size={22} />
      </button>
      <button
        aria-label="Prikaži dan prije"
        className="absolute right-0 top-32 z-20 grid h-11 w-11 translate-x-2 place-items-center rounded-full bg-ink text-paper shadow-pin disabled:opacity-30"
        disabled={!canGoOlder}
        onClick={onGoOlder}
        type="button"
      >
        <ChevronRight size={22} />
      </button>

      <article
        id={`recap-${recap.id}`}
        className="scroll-mt-24 overflow-hidden rounded-[2rem] bg-paper shadow-paper"
        onTouchEnd={onTouchEnd}
        onTouchStart={onTouchStart}
      >
        <div className="relative h-60">
          <PhotoGallery images={getRecapImages(recap)} title={recap.title} className="h-full" />
          <div className="absolute left-4 top-4 rounded-full bg-ink px-4 py-2 text-sm font-black text-paper">
            {isPreview ? "Preview · " : ""}Dan {recap.dayNumber}
          </div>
        </div>
        <div className="p-5">
          <p className="text-sm font-black text-clay">
            {formatKilometerRange(recap.startLocation, recap.endLocation)}
          </p>
          <h3 className="mt-2 font-display text-2xl font-black">{recap.title}</h3>
          <p className={`mt-3 leading-7 text-coffee/80 ${expanded ? "" : "line-clamp-3"}`}>
            {recap.shortText}
          </p>
          <div className="mt-5 flex flex-wrap gap-2 text-sm font-black">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/70 px-3 py-2">
              <Route size={16} />
              {recap.distanceKm} km
            </span>
            <span className="inline-flex items-center gap-2 rounded-full bg-white/70 px-3 py-2">
              <Flag size={16} />
              {formatCountry(recap.country)}
            </span>
            {recap.sleepingLocation ? (
              <span className="inline-flex items-center gap-2 rounded-full bg-white/70 px-3 py-2">
                <BedDouble size={16} />
                {recap.sleepingLocation}
              </span>
            ) : null}
          </div>
          <div className="mt-5">
            <div className="inline-flex items-center gap-2 rounded-full bg-sunset px-4 py-2 font-black">
              <span>{fatigue.emoji}</span>
              Razina umora: {fatigue.label}
            </div>
          </div>

          <button
            className="mt-5 w-full rounded-full bg-sand px-5 py-3 text-sm font-black text-ink shadow-pin"
            onClick={onToggleDetails}
            type="button"
          >
            {expanded ? "Prikaži manje detalja" : "Prikaži više detalja"}
          </button>

          {expanded ? (
            <div className="mt-5 space-y-4">
              <div className="grid gap-3">
                <div className="rounded-2xl bg-white/60 p-4">
                  <p className="text-sm font-black text-moss">Highlight dana</p>
                  <p className="mt-2 leading-7">{recap.highlightOfTheDay}</p>
                </div>
                <div className="rounded-2xl bg-white/60 p-4">
                  <p className="text-sm font-black text-clay">Problem dana</p>
                  <p className="mt-2 leading-7">{recap.problemOfTheDay}</p>
                </div>
              </div>
              <RecapComments
                recapId={recap.id}
                recapTitle={recap.title}
                comments={recap.comments}
                buttonClassName="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-ink px-4 py-3 text-sm font-black text-paper shadow-pin transition active:scale-95"
              />
              {recap.latitude !== undefined && recap.longitude !== undefined ? (
                <MapFocusButton recapId={recap.id} />
              ) : (
                <span className="block rounded-full bg-coffee/10 px-4 py-3 text-center text-sm font-black text-coffee/55">
                  Lokacija nije upisana
                </span>
              )}
            </div>
          ) : null}
        </div>
      </article>
    </div>
  );
}
