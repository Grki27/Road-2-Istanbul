import { HeartHandshake, Share2 } from "lucide-react";
import type { TripSettings } from "@/types";

const campaignDonationGoal = 1500;

export function HumanitarianSection({ settings }: { settings: TripSettings }) {
  const progress = Math.min((settings.donationRaised / campaignDonationGoal) * 100, 100);
  const isGoalReached = settings.donationRaised >= campaignDonationGoal;

  return (
    <section id="humanitarno" className="px-5 py-20">
      <div className="mx-auto grid max-w-7xl gap-6 rounded-[2rem] bg-ink p-6 text-paper shadow-paper md:grid-cols-[1.1fr_0.9fr] md:p-10">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.26em] text-sunset">Humanitarna priča</p>
          <h2 className="mt-3 font-display text-4xl font-black md:text-6xl">
            Jedan kilometar = Jedan donirani eur
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
            <a
              href="https://www.instagram.com/sedmo_nebo__/"
              className="inline-flex items-center justify-center gap-2 rounded-full border border-paper/30 px-6 py-4 font-black"
            >
              <Share2 size={20} />
              Podijeli priču
            </a>
          </div>
        </div>
        <div className="rounded-[1.5rem] bg-paper p-6 text-ink">
          <p className="text-sm font-black uppercase tracking-[0.2em] text-clay">Cilj kampanje</p>
          <div className="mt-4 flex items-end justify-between gap-4">
            <p className="font-display text-5xl font-black">{settings.donationRaised} €</p>
            <p className="pb-2 font-black text-coffee/70">
              {isGoalReached ? "cilj probijen" : `od ${campaignDonationGoal} €`}
            </p>
          </div>
          <div className="mt-6 h-5 overflow-hidden rounded-full bg-sand">
            <div className="h-full rounded-full bg-clay" style={{ width: `${progress}%` }} />
          </div>
          {isGoalReached ? (
            <p className="mt-5 font-black leading-7 text-clay">
              PREPONOSAN SAM LJUDI, IDEMO VIDJET DO KOLIKO EURA MOŽEMO DOĆI!!
            </p>
          ) : (
            <p className="mt-5 leading-7 text-coffee/80">
              Ruta ima oko 1500 kilometara, zato je cilj {campaignDonationGoal} €. Ako imate eur viška, dajte onima koji nemaju i motivirajte nas da odvozimo dodatni kilometar :)
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
