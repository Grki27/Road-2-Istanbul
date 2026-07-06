import Image from "next/image";
import { SectionHeader } from "@/components/SectionHeader";

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
      "Splićanin, kreator iza Sedmog Neba, student FER-a, avanturist, ljubitelj svakog sporta, snimanja videa, letenja drona i osoba koja nikad neće reći ne izlasku s ekipom.",
    strengths: [
      { label: "Beskonačna kondicija", value: 5 },
      { label: "Može spavat bilo gdje", value: 4 },
      { label: "Može složit kadar iz ničega", value: 5 }
    ],
    weaknesses: [
      { label: "Lako izgori", value: 2 },
      { label: "Živciraju ga uzbrdice", value: 1 },
      { label: "Kaže da kreće lagano pa napravi mini dokumentarac", value: 2 }
    ]
  },
  {
    name: "Marko",
    image: "/assets/marko.jpg",
    description:
      "Student medicine, ljubitelj biciklizma, svira flautu, voli radit stvari za plot i nekako uvijek pronađe dodatni sidequest kad svi misle da je dan gotov.",
    strengths: [
      { label: "Zna prvu pomoć", value: 5 },
      { label: "Voli sidequestat po putu", value: 5 },
      { label: "Ima bolji bajk", value: 4 }
    ],
    weaknesses: [
      { label: "Mora nać savršeno mjesto za jest", value: 2 },
      { label: "Kaže “još malo” bez definicije kilometara", value: 2 },
      { label: "Previše mirno prihvaća loše ideje", value: 3 }
    ]
  }
];

function getBarColor(value: StatItem["value"]) {
  if (value === 1) return "bg-red-500";
  if (value === 2) return "bg-orange-500";
  if (value === 3) return "bg-yellow-500";
  if (value === 4) return "bg-lime-600";
  return "bg-moss";
}

function StatBars({ item }: { item: StatItem }) {
  const color = getBarColor(item.value);

  return (
    <li className="space-y-2">
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm font-bold leading-5 text-coffee/88">{item.label}</span>
        <span className="shrink-0 text-xs font-black text-coffee/60">{item.value}/5</span>
      </div>
      <div className="grid grid-cols-5 gap-1.5" aria-label={`${item.label}: ${item.value} od 5`}>
        {Array.from({ length: 5 }).map((_, index) => (
          <span
            key={index}
            className={`h-2.5 rounded-full ${index < item.value ? color : "bg-coffee/12"}`}
          />
        ))}
      </div>
    </li>
  );
}

export function RidersSection() {
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
                    aria-label="Čekamo start"
                    className="absolute right-3 top-3 grid h-12 w-12 place-items-center rounded-full bg-paper text-2xl font-black shadow-pin"
                    title="Čekamo start"
                  >
                    😐
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
                      <StatBars key={item.label} item={item} />
                    ))}
                  </ul>
                </div>
                <div className="rounded-2xl bg-white/60 p-4">
                  <p className="font-black text-clay">Slabosti</p>
                  <ul className="mt-4 space-y-4">
                    {rider.weaknesses.map((item) => (
                      <StatBars key={item.label} item={item} />
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
