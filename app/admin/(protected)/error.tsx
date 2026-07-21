"use client";

export default function AdminError({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="rounded-2xl bg-red-100 p-6 text-red-950 shadow-paper">
      <p className="text-xs font-black uppercase tracking-[0.2em]">Nešto je zapelo</p>
      <h1 className="mt-2 font-display text-3xl font-black">Admin podaci se nisu učitali.</h1>
      <p className="mt-3 leading-7">Provjeri vezu i pokušaj ponovno. Ništa što si već spremio nije izgubljeno.</p>
      <button type="button" onClick={reset} className="mt-5 rounded-full bg-red-900 px-5 py-3 font-black text-white">
        Pokušaj ponovno
      </button>
    </div>
  );
}
