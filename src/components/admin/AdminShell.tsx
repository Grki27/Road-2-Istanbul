"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  Bike,
  LogOut,
  MapPinned,
  Navigation,
  NotebookPen
} from "lucide-react";
import { signOutAction } from "@app/admin/actions";

const navigation = [
  { href: "/admin", label: "Početna", icon: Bike },
  { href: "/admin/recaps", label: "Recapovi", icon: NotebookPen },
  { href: "/admin/location", label: "GPS", icon: Navigation },
  { href: "/admin/map-events", label: "Pinovi", icon: MapPinned },
  { href: "/admin/settings", label: "Postavke", icon: BarChart3 }
];

export function AdminShell({ email, children }: { email: string; children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-paper text-ink">
      <header className="sticky top-0 z-40 border-b border-coffee/10 bg-paper/95 px-4 py-3 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4">
          <Link href="/admin" className="min-w-0">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-clay">Sedmo Nebo</p>
            <p className="truncate font-display text-xl font-black">Admin za cestu</p>
          </Link>
          <nav className="hidden items-center gap-1 lg:flex" aria-label="Admin navigacija">
            {navigation.map((item) => {
              const active = item.href === "/admin"
                ? pathname === item.href
                : pathname.startsWith(item.href);
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-black transition ${
                    active ? "bg-ink text-paper" : "text-coffee hover:bg-sand"
                  }`}
                >
                  <Icon size={17} />
                  {item.label}
                </Link>
              );
            })}
          </nav>
          <div className="flex items-center gap-2">
            <span className="hidden max-w-52 truncate text-xs font-bold text-coffee/65 sm:block">{email}</span>
            <form action={signOutAction}>
              <button
                type="submit"
                className="grid h-10 w-10 place-items-center rounded-full bg-ink text-paper"
                aria-label="Odjavi se"
                title="Odjavi se"
              >
                <LogOut size={18} />
              </button>
            </form>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 pb-28 pt-7 lg:pb-12">{children}</main>

      <nav
        className="fixed inset-x-0 bottom-0 z-50 grid grid-cols-5 border-t border-coffee/10 bg-paper/95 px-1 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2 shadow-[0_-8px_30px_rgba(47,36,27,0.12)] backdrop-blur lg:hidden"
        aria-label="Mobilna admin navigacija"
      >
        {navigation.map((item) => {
          const active = item.href === "/admin"
            ? pathname === item.href
            : pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex min-w-0 flex-col items-center gap-1 rounded-xl px-1 py-2 text-[10px] font-black ${
                active ? "bg-sand text-ink" : "text-coffee/65"
              }`}
            >
              <Icon size={20} />
              <span className="truncate">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
