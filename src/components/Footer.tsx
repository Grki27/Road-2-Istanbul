import Image from "next/image";
import { Facebook, Instagram, Mail, Music2, Youtube } from "lucide-react";
import { siteConfig } from "@/config/site";

export function Footer() {
  const links = [
    ["Instagram", siteConfig.socials.instagram, Instagram],
    ["TikTok", siteConfig.socials.tiktok, Music2],
    ["YouTube", siteConfig.socials.youtube, Youtube],
    ["Facebook", siteConfig.socials.facebook, Facebook]
  ] as const;

  return (
    <footer className="px-5 pb-8 pt-14">
      <div className="mx-auto max-w-7xl rounded-[2rem] bg-paper p-6 shadow-paper md:p-8">
        <div className="flex flex-col justify-between gap-8 md:flex-row md:items-center">
          <div className="flex items-center gap-4">
            <span className="relative h-16 w-16 overflow-hidden rounded-full bg-white p-2 shadow-pin">
              <Image src="/assets/sedmo-nebo-logo.png" alt="Sedmo Nebo logo" fill className="object-contain p-2" />
            </span>
            <div>
              <p className="font-display text-2xl font-black">{siteConfig.name}</p>
              <p className="text-coffee/75">Road to Istanbul — live dnevnik puta</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {links.map(([label, href, Icon]) => (
              <a key={label} href={href} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-full bg-white/70 px-4 py-3 font-bold">
                <Icon size={18} />
                {label}
              </a>
            ))}
          </div>
        </div>
        <div className="mt-8 flex flex-col justify-between gap-3 border-t border-coffee/10 pt-5 text-sm font-semibold text-coffee/70 md:flex-row">
          <span>© 2026 Sedmo Nebo</span>
          <a href={`mailto:${siteConfig.contactEmail}`} className="inline-flex items-center gap-2">
            <Mail size={16} />
            {siteConfig.contactEmail}
          </a>
        </div>
      </div>
    </footer>
  );
}
