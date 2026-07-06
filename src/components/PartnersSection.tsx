import Image from "next/image";
import { siteConfig } from "@/config/site";
import { SectionHeader } from "@/components/SectionHeader";

export function PartnersSection() {
  return (
    <section className="px-5 py-20">
      <div className="mx-auto max-w-7xl">
        <SectionHeader eyebrow="Partneri" title="Podržali su avanturu" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {siteConfig.partners.map((partner) => (
            <a
              key={partner.name}
              href={partner.url}
              target="_blank"
              rel="noreferrer"
              className="grid min-h-40 place-items-center rounded-[1.5rem] bg-paper p-8 shadow-paper transition hover:-translate-y-1"
            >
              <Image src={partner.logo} alt={partner.name} width={190} height={90} className="max-h-20 w-auto object-contain" />
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
