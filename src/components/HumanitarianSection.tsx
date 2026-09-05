"use client";

import { useState } from "react";
import { HeartHandshake, Share2 } from "lucide-react";
import type { TripSettings } from "@/types";

const campaignDonationGoal = 1500;
const amountFormatter = new Intl.NumberFormat("hr-HR", {
  maximumFractionDigits: 0
});

export function HumanitarianSection({ settings }: { settings: TripSettings }) {
  const [shareLabel, setShareLabel] = useState("Podijeli priču");
  const donationRaised = Math.max(settings.donationRaised, 0);
  const isGoalReached = settings.donationRaised >= campaignDonationGoal;
  const amountAboveGoal = Math.max(donationRaised - campaignDonationGoal, 0);
  const progressScale = Math.max(donationRaised, campaignDonationGoal);
  const goalProgress = (campaignDonationGoal / progressScale) * 100;
  const raisedToGoalProgress =
    (Math.min(donationRaised, campaignDonationGoal) / progressScale) * 100;
  const aboveGoalProgress = (amountAboveGoal / progressScale) * 100;
  const goalLabelAlignment = goalProgress > 90 ? "translateX(-100%)" : "translateX(-50%)";

  async function shareCampaign() {
    if (!settings.donationUrl) return;

    const shareData = {
      title: "Sedmo Nebo: Road to Istanbul",
      text: "Podrži naš put do Istanbula i humanitarnu kampanju za SOS Dječje selo Hrvatska.",
      url: settings.donationUrl
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
        return;
      }

      await navigator.clipboard.writeText(settings.donationUrl);
      setShareLabel("Link je kopiran");
      window.setTimeout(() => setShareLabel("Podijeli priču"), 2200);
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
      setShareLabel("Pokušaj ponovno");
      window.setTimeout(() => setShareLabel("Podijeli priču"), 2200);
    }
  }

  return (
    <section id="humanitarno" className="px-5 py-20">
      <div className="mx-auto grid max-w-7xl gap-6 rounded-[2rem] bg-ink p-6 text-paper shadow-paper md:grid-cols-[1.1fr_0.9fr] md:p-10">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.26em] text-sunset">Humanitarna priča</p>
          <h2 className="mt-3 font-display text-4xl font-black md:text-6xl">
            Jedan kilometar = Jedan donirani euro
          </h2>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-paper/82">
            Cilj je jednostavan: za svaki prijeđeni kilometar prema Istanbulu pokušavamo skupiti jedan euro za SOS Dječje selo Hrvatska.
            Ako ti je fora pratiti ovu avanturu, možeš svaki kilometar pretvoriti u konkretnu podršku djeci i mladima kojima pomoć stvarno znači.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            {settings.donationUrl ? (
              <a
                href={settings.donationUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-sunset px-6 py-4 font-black text-ink transition hover:-translate-y-0.5"
              >
                <HeartHandshake size={20} />
                Podrži kampanju
              </a>
            ) : (
              <button disabled className="inline-flex items-center justify-center gap-2 rounded-full bg-paper/40 px-6 py-4 font-black text-paper/75">
                <HeartHandshake size={20} />
                Link stiže uskoro
              </button>
            )}
            <button
              type="button"
              onClick={() => void shareCampaign()}
              disabled={!settings.donationUrl}
              className="inline-flex items-center justify-center gap-2 rounded-full border border-paper/30 px-6 py-4 font-black"
            >
              <Share2 size={20} />
              {shareLabel}
            </button>
          </div>
        </div>
        <div className="rounded-[1.5rem] bg-paper p-6 text-ink">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm font-black uppercase tracking-[0.2em] text-clay">Cilj kampanje</p>
            <p className="ml-auto rounded-full bg-sand/70 px-3 py-1.5 text-xs font-black leading-none text-coffee/75">
              {isGoalReached ? "Cilj probijen 😎" : `Od ${amountFormatter.format(campaignDonationGoal)} €`}
            </p>
          </div>
          <p className="mt-4 whitespace-nowrap font-display text-[clamp(2.75rem,13vw,3.75rem)] font-black leading-none tracking-tight">
            {amountFormatter.format(donationRaised)} €
          </p>
          <div className="mt-3">
            <div className="relative pt-5">
              <span
                className="absolute top-0 whitespace-nowrap text-xs font-black text-coffee"
                style={{ left: `${goalProgress}%`, transform: goalLabelAlignment }}
              >
                {amountFormatter.format(campaignDonationGoal)} €
              </span>
              <div className="relative flex h-5 overflow-hidden rounded-full bg-sand shadow-inner">
                <div
                  className="h-full bg-clay transition-[width] duration-700"
                  style={{ width: `${raisedToGoalProgress}%` }}
                />
                {amountAboveGoal > 0 ? (
                  <div
                    className="campaign-extra-progress h-full transition-[width] duration-700"
                    style={{ width: `${aboveGoalProgress}%` }}
                  />
                ) : null}
                <span
                  aria-hidden="true"
                  className="absolute inset-y-0 z-10 w-0.5 -translate-x-1/2 bg-ink shadow-[0_0_0_1px_rgba(255,248,234,0.75)]"
                  style={{ left: `${goalProgress}%` }}
                />
              </div>
            </div>
            {amountAboveGoal > 0 ? (
              <div className="mt-3 flex items-center gap-2 text-sm font-bold text-coffee/80">
                <span
                  aria-hidden="true"
                  className="campaign-extra-dot h-2.5 w-2.5 shrink-0 rounded-full bg-sunset"
                />
                <span>Prikupljeno iznad cilja</span>
                <span className="ml-auto shrink-0 font-black text-clay">
                  +{amountFormatter.format(amountAboveGoal)} €
                </span>
              </div>
            ) : null}
          </div>
          {isGoalReached ? (
            <p className="mt-5 font-black leading-7 text-clay">
              PREPONOSAN SAM LJUDI, IDEMO VIDJET DO KOLIKO EURA MOŽEMO DOĆI!!
            </p>
          ) : (
            <p className="mt-5 leading-7 text-coffee/80">
              Ruta ima oko 1500 kilometara, zato je cilj {campaignDonationGoal} € :)
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
