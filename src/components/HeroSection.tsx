import Image from "next/image";
import { ArrowDown, HeartHandshake, MapPinned } from "lucide-react";
import { siteConfig } from "@/config/site";

export function HeroSection() {
  return (
    <section className="relative min-h-[92vh] overflow-hidden bg-ink text-white">
      <Image
        src="/assets/hero-road-to-istanbul.jpg"
        alt="Sedmo Nebo biciklistička avantura"
        fill
        priority
        className="object-cover"
        sizes="100vw"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/25 to-ink/82" />
      <div className="absolute inset-x-0 top-0 z-10">
        <nav className="mx-auto flex max-w-7xl items-center justify-between px-5 py-5">
          <a href="#" className="flex items-center gap-3">
            <span className="relative h-12 w-12 overflow-hidden rounded-full bg-paper/90 p-1 shadow-pin">
              <Image src="/assets/sedmo-nebo-logo.png" alt="Sedmo Nebo logo" fill className="object-contain p-1" />
            </span>
            <span className="hidden text-sm font-black uppercase tracking-[0.24em] sm:block">
              Sedmo Nebo
            </span>
          </a>
          <div className="hidden items-center gap-6 text-sm font-bold text-white/86 md:flex">
            <a href="#karta">Karta</a>
            <a href="#dnevnik">Dnevnik</a>
            <a href="#podrska">Zid podrške</a>
            <a href="#humanitarno">Humanitarno</a>
          </div>
        </nav>
      </div>

      <div className="relative z-10 mx-auto flex min-h-[92vh] max-w-7xl items-end px-5 pb-16 pt-28 md:pb-24">
        <div className="max-w-4xl">
          <div className="mb-5 inline-flex rotate-[-1.5deg] rounded-full bg-paper px-4 py-2 text-sm font-black text-clay shadow-pin">
            Start: {siteConfig.startDate} · Dubrovnik → Istanbul
          </div>
          <h1 className="font-display text-5xl font-black leading-[0.95] md:text-7xl lg:text-8xl">
            Sedmo Nebo:
            <span className="block text-sand">Road to Istanbul</span>
          </h1>
          <p className="mt-6 max-w-2xl text-lg font-semibold leading-8 text-white/90 md:text-2xl">
            {siteConfig.tagline}
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <a
              href="#karta"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-sunset px-6 py-4 font-black text-ink shadow-pin transition hover:-translate-y-0.5"
            >
              <MapPinned size={20} />
              Prati kartu
            </a>
            <a
              href="#humanitarno"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-white/92 px-6 py-4 font-black text-ink shadow-pin transition hover:-translate-y-0.5"
            >
              <HeartHandshake size={20} />
              Podrži kampanju
            </a>
            <a
              href="#zadnji-update"
              className="inline-flex items-center justify-center gap-2 rounded-full border border-white/50 px-6 py-4 font-black text-white backdrop-blur transition hover:bg-white/12"
            >
              <ArrowDown size={20} />
              Zadnji update
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
