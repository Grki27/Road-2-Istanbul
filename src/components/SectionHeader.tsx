type SectionHeaderProps = {
  eyebrow?: string;
  title: string;
  text?: string;
};

export function SectionHeader({ eyebrow, title, text }: SectionHeaderProps) {
  return (
    <div className="mx-auto mb-8 max-w-3xl text-center">
      {eyebrow ? (
        <p className="mb-3 text-xs font-black uppercase tracking-[0.26em] text-clay">
          {eyebrow}
        </p>
      ) : null}
      <h2 className="font-display text-3xl font-black text-ink md:text-5xl">{title}</h2>
      {text ? <p className="mt-4 text-base leading-7 text-coffee/80 md:text-lg">{text}</p> : null}
    </div>
  );
}
