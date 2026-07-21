import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export function AdminPageHeader({
  eyebrow,
  title,
  description,
  backHref
}: {
  eyebrow: string;
  title: string;
  description?: string;
  backHref?: string;
}) {
  return (
    <div className="mb-7">
      {backHref ? (
        <Link href={backHref} className="mb-4 inline-flex items-center gap-2 text-sm font-black text-clay">
          <ArrowLeft size={17} />
          Nazad
        </Link>
      ) : null}
      <p className="text-xs font-black uppercase tracking-[0.22em] text-clay">{eyebrow}</p>
      <h1 className="mt-2 font-display text-4xl font-black sm:text-5xl">{title}</h1>
      {description ? <p className="mt-3 max-w-3xl leading-7 text-coffee/75">{description}</p> : null}
    </div>
  );
}
