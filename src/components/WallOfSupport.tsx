import type { StickyNote } from "@/types";
import { SectionHeader } from "@/components/SectionHeader";

export function WallOfSupport({ notes }: { notes: StickyNote[] }) {
  return (
    <section id="podrska" className="px-5 py-20">
      <div className="mx-auto max-w-7xl">
        <SectionHeader
          eyebrow="Zid podrške"
          title="Ostavi nam poruku za cestu."
          text="Papirići će u pravoj verziji živjeti 24 sata, kao storyji. Za sada je ovo preview zida s podrškom."
        />
        <div className="relative min-h-[560px] overflow-hidden rounded-[2rem] bg-cork bg-[length:18px_18px,auto] p-5 shadow-paper md:p-8">
          <button className="absolute right-5 top-5 z-20 rounded-full bg-paper px-5 py-3 font-black text-ink shadow-pin">
            Dodaj poruku
          </button>
          <div className="absolute inset-0 opacity-20 [background-image:linear-gradient(90deg,rgba(47,36,27,.2)_1px,transparent_1px),linear-gradient(rgba(47,36,27,.2)_1px,transparent_1px)] [background-size:44px_44px]" />
          {notes.map((note) => (
            <article
              key={note.id}
              className="absolute w-48 rounded-sm p-5 shadow-pin md:w-56"
              style={{
                left: `${note.xPosition}%`,
                top: `${note.yPosition}%`,
                transform: `rotate(${note.rotation}deg)`,
                backgroundColor: note.noteColor
              }}
            >
              <span className="absolute left-1/2 top-2 h-4 w-4 -translate-x-1/2 rounded-full bg-clay shadow-inner" />
              <p className="pt-3 font-display text-xl font-black">{note.authorName}</p>
              <p className="mt-3 leading-6 text-ink/82">{note.message}</p>
            </article>
          ))}
          <div className="absolute bottom-5 left-5 rounded-2xl bg-paper/95 p-4 shadow-pin">
            <p className="font-black">U Phase 5 dolazi modal, crtanje, drag preview i moderacija.</p>
            <p className="mt-1 text-sm text-coffee/75">Sad je cilj uhvatiti pravi osjećaj zida.</p>
          </div>
        </div>
      </div>
    </section>
  );
}
