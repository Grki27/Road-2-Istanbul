import Image from "next/image";
import { ArrowDown, HeartHandshake, MapPinned } from "lucide-react";
import { siteConfig } from "@/config/site";

export function HeroSection() {
  return (
    <section className="relative min-h-[96vh] overflow-hidden bg-ink text-white">
      <div
        aria-hidden="true"
        className="absolute inset-0 scale-105 bg-cover bg-no-repeat [background-position:34%_center] lg:bg-fixed lg:bg-center"
        style={{
          backgroundImage: "url('/assets/hero-road-to-istanbul.jpg')"
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-black/62 via-black/22 to-ink/82" />
      <div className="absolute inset-x-0 top-0 z-[90]">
        <nav className="mx-auto flex max-w-7xl items-center justify-between px-5 py-5">
          <a href="#" className="flex items-center gap-3">
            <span className="relative h-12 w-12 overflow-hidden rounded-full bg-paper/90 p-1 shadow-pin">
              <Image
                src="/assets/sedmo-nebo-logo.png"
                alt="Sedmo Nebo logo"
                fill
                className="object-contain p-1"
              />
            </span>
            <span className="hidden text-sm font-black uppercase tracking-[0.24em] sm:block">
              Sedmo Nebo
            </span>
          </a>
          <div className="flex max-w-[72vw] items-center gap-3 overflow-x-auto rounded-full bg-black/18 px-3 py-2 text-xs font-bold text-white/90 backdrop-blur sm:max-w-none sm:gap-4 md:gap-6 md:bg-transparent md:px-0 md:py-0 md:text-sm md:text-white/86 md:backdrop-blur-0">
            <a className="transition hover:text-sunset" href="#karta">Karta</a>
            <a className="transition hover:text-sunset" href="#dnevnik">Dnevnik</a>
            <a className="transition hover:text-sunset" href="#podrska">Podrška</a>
            <a className="transition hover:text-sunset" href="#humanitarno">Humanitarno</a>
          </div>
        </nav>
      </div>

      <div className="relative z-10 mx-auto flex min-h-[96vh] max-w-7xl items-start px-5 pb-72 pt-32 sm:pt-32 md:pt-36 lg:items-end lg:pb-32 lg:pt-28">
        <div className="max-w-[24rem] sm:max-w-xl lg:max-w-4xl">
          <div className="mb-4 inline-flex rotate-[-1.5deg] rounded-full bg-paper px-4 py-2 text-sm font-black text-clay shadow-pin sm:text-base lg:text-sm">
            Start: {siteConfig.startDate} · Dubrovnik → Istanbul
          </div>
          <h1 className="font-display font-black leading-[0.95]">
            <span className="block text-[2.85rem] sm:text-6xl md:text-7xl lg:text-8xl">Sedmo Nebo:</span>
            <span className="block text-4xl text-sand sm:text-5xl md:text-6xl lg:text-8xl">Road to Istanbul</span>
          </h1>
          <p className="mt-4 max-w-2xl text-lg font-semibold leading-7 text-white/90 sm:text-xl md:text-2xl lg:mt-6">
            {siteConfig.tagline}
          </p>
          <div className="absolute inset-x-5 bottom-28 flex flex-col gap-3 sm:bottom-32 sm:flex-row md:bottom-36 lg:static lg:mt-8 [@media(max-height:720px)]:bottom-16">
            <a
              href="#karta"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-sunset px-6 py-3.5 font-black text-ink shadow-pin transition hover:-translate-y-0.5 lg:py-4"
            >
              <MapPinned size={20} />
              Prati kartu
            </a>
            <a
              href="#humanitarno"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-clay px-6 py-3.5 font-black text-paper shadow-pin transition hover:-translate-y-0.5 hover:bg-terracotta lg:py-4"
            >
              <HeartHandshake size={20} />
              Podrži kampanju
            </a>
            <a
              href="#zadnji-update"
              className="inline-flex items-center justify-center gap-2 rounded-full border border-white/50 px-6 py-3.5 font-black text-white backdrop-blur transition hover:bg-white/12 lg:py-4"
            >
              <ArrowDown size={20} />
              Zadnji update
            </a>
          </div>
        </div>
      </div>
      <div className="torn-map-edge absolute inset-x-0 bottom-0 z-20 h-24" aria-hidden="true" />
    </section>
  );
}
