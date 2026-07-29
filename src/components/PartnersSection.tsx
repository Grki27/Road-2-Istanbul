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
              className={`relative grid min-h-40 place-items-center overflow-hidden rounded-[1.5rem] shadow-paper transition hover:-translate-y-1 ${
                partner.theme === "dark"
                  ? "border border-white/10 bg-black p-6"
                  : partner.theme === "blue"
                    ? "border border-[#00AEEF] bg-[#00AEEF] p-4"
                    : "bg-paper p-8"
              }`}
            >
              <Image
                src={partner.logo}
                alt={partner.name}
                width={partner.theme === "light" ? 190 : 280}
                height={90}
                className={`relative z-10 w-auto object-contain ${
                  partner.theme === "dark"
                    ? "max-h-24 max-w-full"
                    : partner.theme === "blue"
                      ? "max-h-28 max-w-full"
                      : "max-h-20"
                }`}
              />
              {partner.theme !== "light" ? (
                <span
                  className="pointer-events-none absolute inset-0 rounded-[inherit] ring-1 ring-inset ring-paper/10"
                  aria-hidden="true"
                />
              ) : null}
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
