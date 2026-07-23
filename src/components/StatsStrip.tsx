import type { CSSProperties } from "react";

type Stat = {
  label: string;
  value: string;
};

export function StatsStrip({ stats }: { stats: Stat[] }) {
  return (
    <section className="relative z-20 -mt-7 px-5">
      <div className="stats-torn-card mx-auto grid max-w-7xl gap-3 rounded-b-[2rem] bg-paper/95 px-3 pb-3 pt-9 shadow-paper ring-1 ring-coffee/10 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const showConfetti = stat.label === "Do Istanbula" && stat.value.trim().startsWith("0");

          return (
            <div
              key={stat.label}
              className="relative overflow-hidden rounded-[1.5rem] border border-coffee/10 bg-white/58 px-5 py-5"
            >
              {showConfetti ? <ConfettiBurst /> : null}
              <p className="relative z-10 text-xs font-black uppercase tracking-[0.2em] text-clay">{stat.label}</p>
              <p className="relative z-10 mt-2 font-display text-3xl font-black text-ink">{stat.value}</p>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function ConfettiBurst() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-0">
      {Array.from({ length: 18 }).map((_, index) => (
        <span
          className="stats-confetti"
          key={index}
          style={{
            "--confetti-x": `${Math.cos((index / 18) * Math.PI * 2) * (42 + (index % 4) * 9)}px`,
            "--confetti-y": `${Math.sin((index / 18) * Math.PI * 2) * (28 + (index % 5) * 7)}px`,
            "--confetti-rotate": `${index * 31}deg`,
            "--confetti-delay": `${(index % 6) * 45}ms`,
            "--confetti-color": ["#d64232", "#f4b35e", "#5aa469", "#2f7abf", "#7c3aed", "#f0d24b"][index % 6]
          } as CSSProperties}
        />
      ))}
    </div>
  );
}
