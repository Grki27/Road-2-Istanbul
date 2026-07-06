import Image from "next/image";
import { SectionHeader } from "@/components/SectionHeader";

const riders = [
  {
    name: "Marin",
    image: "/assets/marin.jpg",
    description:
      "Creator iza Sedmog Neba, student FER-a, zadužen za kameru, priču i nepotrebno kompliciranje kadrova.",
    strengths: ["Snima i kad nitko normalan ne bi snimao", "Izvuče priču iz svake rupe", "Složi kadar usred kaosa"],
    weaknesses: ["Nepotrebno komplicira kadrove", "Zaboravi jesti dok snima", "Kaže “još samo jedan shot” 19 puta"]
  },
  {
    name: "Marko",
    image: "/assets/marko.jpg",
    description:
      "Student medicine, sportski freak, osoba koja zna ostati smirena kad pukne guma ili nestane vode.",
    strengths: ["Smiren kad sve ode u kaos", "Medicinski mozak na biciklu", "Može voziti i kad normalni ljudi odustanu"],
    weaknesses: ["“Još 20 km” mu zvuči kao ništa", "Premalo paničari", "Vjerojatno bi popravljao gumu bez emocije"]
  }
];

export function RidersSection() {
  return (
    <section className="px-5 py-20">
      <div className="mx-auto max-w-7xl">
        <SectionHeader eyebrow="Tko vozi?" title="Dva čovjeka, dvije bicikle i puno upitnih odluka." />
        <div className="grid gap-6 md:grid-cols-2">
          {riders.map((rider) => (
            <article key={rider.name} className="rounded-[2rem] bg-paper p-5 shadow-paper md:p-7">
              <div className="grid gap-5 sm:grid-cols-[180px_1fr]">
                <div className="relative aspect-square overflow-hidden rounded-[1.5rem] bg-sand">
                  <Image src={rider.image} alt={rider.name} fill className="object-cover" />
                  <div className="absolute right-3 top-3 rounded-full bg-paper px-3 py-2 font-black shadow-pin">
                    😐 Čekamo start
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
                  <ul className="mt-3 space-y-2 text-sm leading-6 text-coffee/84">
                    {rider.strengths.map((item) => <li key={item}>+ {item}</li>)}
                  </ul>
                </div>
                <div className="rounded-2xl bg-white/60 p-4">
                  <p className="font-black text-clay">Slabosti</p>
                  <ul className="mt-3 space-y-2 text-sm leading-6 text-coffee/84">
                    {rider.weaknesses.map((item) => <li key={item}>- {item}</li>)}
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
