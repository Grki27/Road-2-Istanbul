import Image from "next/image";
import { SectionHeader } from "@/components/SectionHeader";
import { fatigueScale } from "@/config/fatigue";
import type { DailyRecap } from "@/types";

type StatItem = {
  label: string;
  value: 1 | 2 | 3 | 4 | 5;
};

type Rider = {
  name: string;
  image: string;
  description: string;
  strengths: StatItem[];
  weaknesses: StatItem[];
};

const riders: Rider[] = [
  {
    name: "Marin",
    image: "/assets/marin.jpg",
    description:
      "Splićanin, student FER-a i kreator iza profila Sedmo Nebo. Voli igrat svaki sport, svira gitaru, rijetko kad kaže ne izlasku i često ga možete naći na nekom krovu, putovanju ili avanturi.",
    strengths: [
      { label: "Ima beskonačno kondicije", value: 5 },
      { label: "Uvijek je spreman za side quest", value: 5 },
      { label: "Može napravit 10 ruskih zgibova", value: 5 }
    ],
    weaknesses: [
      { label: "Iznervira se na uzbrdicama", value: 1 },
      { label: "Mobitel mu je uvijek mrtav", value: 2 }
    ]
  },
  {
    name: "Marko",
    image: "/assets/marko.jpg",
    description:
      "Riječanin, student medicine u Zagrebu i ljubitelj bicikliranja. Odlično kuha, svira flautu i voli se družit s ljudima.",
    strengths: [
      { label: "Zna prvu pomoć", value: 5 },
      { label: "Uvijek ima neki snack pri ruci", value: 5 },
      { label: "Ima Dekanovu nagradu", value: 5 }
    ],
    weaknesses: [
      { label: "Iznervira se ako negdje krivo skrenemo", value: 2 },
      { label: "Mora nać savršeno mjesto za jest", value: 1 }
    ]
  }
];

function getScoreColor(value: StatItem["value"]) {
  if (value === 1) return "bg-red-500";
  if (value === 2) return "bg-orange-500";
  if (value === 3) return "bg-yellow-500";
  if (value === 4) return "bg-lime-600";
  return "bg-moss";
}

function StatDots({ item }: { item: StatItem }) {
  const color = getScoreColor(item.value);

  return (
    <li className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
      <span className="text-sm font-bold leading-5 text-coffee/88">{item.label}</span>
      <div
        aria-label={`${item.label}: ${item.value} od 5`}
        className="flex shrink-0 gap-1.5"
        role="img"
      >
        {Array.from({ length: 5 }).map((_, index) => (
          <span
            aria-hidden="true"
            key={index}
            className={`h-3 w-3 rounded-full border ${
              index < item.value ? `${color} border-transparent` : "border-coffee/25 bg-transparent"
            }`}
          />
        ))}
      </div>
    </li>
  );
}

export function RidersSection({ latestRecap }: { latestRecap?: DailyRecap }) {
  const fatigueByRider = {
    Marin: latestRecap?.marinFatigueRating,
    Marko: latestRecap?.markoFatigueRating
  };

  return (
    <section className="px-5 py-20">
      <div className="mx-auto max-w-7xl">
        <SectionHeader eyebrow="Tko vozi?" title="Character stats" />
        <div className="grid gap-6 md:grid-cols-2">
          {riders.map((rider) => (
            <article key={rider.name} className="rounded-[2rem] bg-paper p-5 shadow-paper md:p-7">
              <div className="grid gap-5 sm:grid-cols-[180px_1fr]">
                <div className="relative aspect-square overflow-hidden rounded-[1.5rem] bg-sand">
                  <Image src={rider.image} alt={rider.name} fill className="object-cover" />
                  <div
                    aria-label={
                      fatigueByRider[rider.name as keyof typeof fatigueByRider]
                        ? fatigueScale[fatigueByRider[rider.name as keyof typeof fatigueByRider]!].label
                        : "Čekamo start"
                    }
                    className="absolute right-3 top-3 grid h-12 w-12 place-items-center rounded-full bg-paper text-2xl font-black shadow-pin"
                    title={
                      fatigueByRider[rider.name as keyof typeof fatigueByRider]
                        ? fatigueScale[fatigueByRider[rider.name as keyof typeof fatigueByRider]!].label
                        : "Čekamo start"
                    }
                  >
                    {fatigueByRider[rider.name as keyof typeof fatigueByRider]
                      ? fatigueScale[fatigueByRider[rider.name as keyof typeof fatigueByRider]!].emoji
                      : "🤷"}
                  </div>
                </div>
                <div>
                  <h3 className="font-display text-4xl font-black">{rider.name}</h3>
                  <p className="mt-3 leading-7 text-coffee/82">{rider.description}</p>
                </div>
              </div>
              <div className="mt-6 grid gap-4 md:grid-cols-2">
                <div className="rounded-2xl bg-white/60 p-4">
                  <p className="font-black text-moss">Snage</p>
                  <ul className="mt-4 space-y-4">
                    {rider.strengths.map((item) => (
                      <StatDots key={item.label} item={item} />
                    ))}
                  </ul>
                </div>
                <div className="rounded-2xl bg-white/60 p-4">
                  <p className="font-black text-clay">Slabosti</p>
                  <ul className="mt-4 space-y-4">
                    {rider.weaknesses.map((item) => (
                      <StatDots key={item.label} item={item} />
                    ))}
                  </ul>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
