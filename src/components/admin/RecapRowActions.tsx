"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Archive, LoaderCircle, RotateCcw, Trash2 } from "lucide-react";
import { deleteRecapAction, setRecapStatusAction, type AdminActionResult } from "@app/admin/actions";
import { AdminActionMessage } from "@/components/admin/AdminFormUi";

export function RecapRowActions({ id, status }: { id: string; status: "draft" | "published" | "archived" }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<AdminActionResult | null>(null);

  async function changeStatus(nextStatus: "draft" | "archived") {
    setBusy(true);
    const actionResult = await setRecapStatusAction(id, nextStatus);
    setResult(actionResult);
    setBusy(false);
    if (actionResult.ok) router.refresh();
  }

  async function permanentlyDelete() {
    if (!window.confirm("Ovo trajno briše recap i sve njegove slike. Nema povratka. Nastaviti?")) return;
    setBusy(true);
    const actionResult = await deleteRecapAction(id);
    setResult(actionResult);
    setBusy(false);
    if (actionResult.ok) router.refresh();
  }

  return (
    <div className="mt-3 space-y-2">
      <div className="flex flex-wrap gap-2">
        {status === "archived" ? (
          <button type="button" disabled={busy} onClick={() => void changeStatus("draft")} className="inline-flex items-center gap-2 rounded-full bg-lime-100 px-3 py-2 text-xs font-black text-lime-950"><RotateCcw size={15} /> Vrati kao nacrt</button>
        ) : (
          <button type="button" disabled={busy} onClick={() => void changeStatus("archived")} className="inline-flex items-center gap-2 rounded-full bg-sand px-3 py-2 text-xs font-black"><Archive size={15} /> Arhiviraj</button>
        )}
        {status === "archived" ? (
          <button type="button" disabled={busy} onClick={() => void permanentlyDelete()} className="inline-flex items-center gap-2 rounded-full bg-red-100 px-3 py-2 text-xs font-black text-red-900">{busy ? <LoaderCircle className="animate-spin" size={15} /> : <Trash2 size={15} />} Trajno obriši</button>
        ) : null}
      </div>
      <AdminActionMessage result={result} />
    </div>
  );
}
