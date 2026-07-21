"use client";

import { MapPin } from "lucide-react";

export function MapFocusButton({ recapId }: { recapId: string }) {
  function focusRecap() {
    document.getElementById("karta")?.scrollIntoView({ behavior: "smooth", block: "start" });

    window.setTimeout(() => {
      window.dispatchEvent(
        new CustomEvent("focus-map-recap", {
          detail: { recapId }
        })
      );
    }, 550);
  }

  return (
    <button
      className="inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-ink px-4 py-3 text-sm font-black text-paper transition hover:-translate-y-0.5"
      onClick={focusRecap}
      type="button"
    >
      <MapPin size={17} />
      Otvori na karti
    </button>
  );
}
