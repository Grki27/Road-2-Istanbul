"use client";

import { Flag } from "lucide-react";
import { type CSSProperties, useEffect, useRef, useState } from "react";

type Stat = {
  label: string;
  value: string;
};

export function StatsStrip({
  stats,
  tripCompleted = false
}: {
  stats: Stat[];
  tripCompleted?: boolean;
}) {
  const completedStatRef = useRef<HTMLDivElement | null>(null);
  const [celebrate, setCelebrate] = useState(false);

  useEffect(() => {
    const target = completedStatRef.current;
    if (!tripCompleted || !target || celebrate) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return;
        setCelebrate(true);
        observer.disconnect();
      },
      { threshold: 0.45 }
    );

    observer.observe(target);
    return () => observer.disconnect();
  }, [celebrate, tripCompleted]);

  return (
    <section className="relative z-20 -mt-7 px-5">
      <div className="stats-torn-card mx-auto grid max-w-7xl gap-3 rounded-b-[2rem] bg-paper/95 px-3 pb-3 pt-9 shadow-paper ring-1 ring-coffee/10 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const isCompletedDistance = tripCompleted && stat.label === "Odvoženo";

          return (
            <div
              key={stat.label}
              ref={isCompletedDistance ? completedStatRef : undefined}
              className="relative overflow-hidden rounded-[1.5rem] border border-coffee/10 bg-white/58 px-5 py-5"
            >
              {isCompletedDistance && celebrate ? <ConfettiBurst /> : null}
              {isCompletedDistance ? (
                <span
                  aria-label="Cilj ostvaren"
                  className="absolute right-4 top-4 z-10 grid h-10 w-10 place-items-center rounded-full bg-sunset text-ink shadow-pin"
                  role="img"
                >
                  <Flag aria-hidden="true" size={20} strokeWidth={2.5} />
                </span>
              ) : null}
              <p className="relative z-10 text-xs font-black uppercase tracking-[0.2em] text-clay">{stat.label}</p>
              <p className={`relative z-10 mt-2 font-display text-3xl font-black text-ink ${isCompletedDistance ? "pr-10" : ""}`}>
                {stat.value}
              </p>
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
