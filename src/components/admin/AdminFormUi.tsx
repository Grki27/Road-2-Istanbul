"use client";

import { useState } from "react";
import { LocateFixed, LoaderCircle } from "lucide-react";
import type { AdminActionResult } from "@app/admin/actions";

export const inputClassName =
  "mt-2 w-full rounded-2xl border border-coffee/15 bg-white/75 px-4 py-3 font-semibold text-ink outline-none ring-clay/25 transition placeholder:text-coffee/35 focus:ring-4 disabled:cursor-not-allowed disabled:opacity-60";

export const labelClassName = "block text-sm font-black text-coffee";

export function AdminActionMessage({ result }: { result?: AdminActionResult | null }) {
  if (!result) return null;

  return (
    <div
      role="status"
      className={`rounded-2xl px-4 py-3 text-sm font-bold ${
        result.ok ? "bg-lime-100 text-lime-950" : "bg-red-100 text-red-950"
      }`}
    >
      {result.message}
    </div>
  );
}

export function UseCurrentLocationButton({
  onLocation
}: {
  onLocation: (latitude: number, longitude: number) => void;
}) {
  const [state, setState] = useState<"idle" | "loading" | "error">("idle");
  const [error, setError] = useState("");

  function locate() {
    if (!navigator.geolocation) {
      setState("error");
      setError("GPS nije dostupan. Ručno upiši koordinate.");
      return;
    }

    setState("loading");
    setError("");
    navigator.geolocation.getCurrentPosition(
      (position) => {
        onLocation(
          Number(position.coords.latitude.toFixed(7)),
          Number(position.coords.longitude.toFixed(7))
        );
        setState("idle");
      },
      () => {
        setState("error");
        setError("GPS lokacija nije dostupna. Možeš ručno upisati koordinate.");
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 30000 }
    );
  }

  return (
    <div>
      <button
        type="button"
        onClick={locate}
        disabled={state === "loading"}
        className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-sea px-5 py-3 font-black text-paper disabled:opacity-60 sm:w-auto"
      >
        {state === "loading" ? <LoaderCircle className="animate-spin" size={19} /> : <LocateFixed size={19} />}
        {state === "loading" ? "Tražim GPS..." : "Koristi trenutnu GPS lokaciju"}
      </button>
      {error ? <p className="mt-2 text-sm font-bold text-red-800">{error}</p> : null}
    </div>
  );
}
