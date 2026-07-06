import { Compass, LocateFixed, MapPinned, Navigation } from "lucide-react";
import type { LucideIcon } from "lucide-react";

const mapLegendItems: Array<{
  title: string;
  text: string;
  Icon: LucideIcon;
}> = [
  {
    title: "Crveni pinovi",
    text: "Pojavit će se tek kad admin doda dnevni recap.",
    Icon: MapPinned
  },
  {
    title: "Trenutna lokacija",
    text: "Zaseban brzi update s mobitela.",
    Icon: LocateFixed
  },
  {
    title: "Event pinovi",
    text: "Hrana, kvarovi, granice, psi, zalasci i ostali trenuci.",
    Icon: Navigation
  }
];

export function MapPreview({ routePoints }: { routePoints: string }) {
  return (
    <section id="karta" className="px-5 py-20">
      <div className="mx-auto max-w-7xl">
        <div className="mb-7 flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.26em] text-clay">Live karta</p>
            <h2 className="mt-3 font-display text-4xl font-black md:text-6xl">Ruta je spremna. Pinovi čekaju cestu.</h2>
          </div>
          <div className="flex flex-wrap gap-2">
            <button className="rounded-full bg-ink px-4 py-3 text-sm font-black text-paper shadow-pin">
              Prikaži cijelu rutu
            </button>
            <button className="rounded-full bg-paper px-4 py-3 text-sm font-black text-ink shadow-pin">
              Zadnja lokacija
            </button>
          </div>
        </div>

        <div className="overflow-hidden rounded-[2rem] border-[10px] border-paper bg-sea shadow-paper">
          <div className="relative min-h-[520px] bg-[radial-gradient(circle_at_20%_20%,rgba(255,248,234,.20),transparent_18rem),linear-gradient(135deg,#315f67,#224248)]">
            <div className="absolute left-5 top-5 z-10 rounded-2xl bg-paper/95 p-4 shadow-pin">
              <div className="flex items-center gap-3">
                <span className="grid h-10 w-10 place-items-center rounded-full bg-clay text-white">
                  <Compass size={21} />
                </span>
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.2em] text-clay">Dubrovnik → Istanbul</p>
                  <p className="font-bold text-ink">GPX ruta učitana iz `Ruta.gpx`</p>
                </div>
              </div>
            </div>
            <svg viewBox="0 0 1000 480" className="absolute inset-0 h-full w-full p-4" aria-hidden="true">
              <defs>
                <filter id="routeShadow">
                  <feDropShadow dx="0" dy="6" stdDeviation="5" floodOpacity="0.28" />
                </filter>
              </defs>
              <path d="M110 70 C230 130 190 240 350 270 S590 175 680 260 790 380 910 330" fill="none" stroke="rgba(255,248,234,.16)" strokeWidth="34" strokeLinecap="round" />
              {routePoints ? (
                <polyline
                  points={routePoints}
                  fill="none"
                  stroke="#f4b35e"
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  filter="url(#routeShadow)"
                  className="route-dash"
                />
              ) : (
                <path d="M80 380 C190 260 280 290 380 210 S620 90 750 170 820 330 930 210" fill="none" stroke="#f4b35e" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" className="route-dash" />
              )}
              <circle cx="72" cy="387" r="16" fill="#d9824b" stroke="#fff8ea" strokeWidth="6" />
              <circle cx="923" cy="216" r="16" fill="#d9824b" stroke="#fff8ea" strokeWidth="6" />
            </svg>
            <div className="absolute bottom-5 left-5 right-5 grid gap-3 md:grid-cols-3">
              {mapLegendItems.map(({ title, text, Icon }) => (
                <div key={title} className="rounded-2xl bg-paper/94 p-4 shadow-pin">
                  <Icon className="mb-3 text-clay" size={24} />
                  <p className="font-black">{title}</p>
                  <p className="mt-1 text-sm leading-6 text-coffee/78">{text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
