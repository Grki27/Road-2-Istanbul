type Stat = {
  label: string;
  value: string;
};

export function StatsStrip({ stats }: { stats: Stat[] }) {
  return (
    <section className="relative z-20 -mt-7 px-5">
      <div className="stats-torn-card mx-auto grid max-w-7xl gap-3 rounded-b-[2rem] bg-paper/95 px-3 pb-3 pt-9 shadow-paper ring-1 ring-coffee/10 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="rounded-[1.5rem] border border-coffee/10 bg-white/58 px-5 py-5"
          >
            <p className="text-xs font-black uppercase tracking-[0.2em] text-clay">{stat.label}</p>
            <p className="mt-2 font-display text-3xl font-black text-ink">{stat.value}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
