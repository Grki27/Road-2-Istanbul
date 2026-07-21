"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LoaderCircle, Trash2 } from "lucide-react";
import { deleteMapEventAction, type AdminActionResult } from "@app/admin/actions";
import { AdminActionMessage } from "@/components/admin/AdminFormUi";

export function MapEventRowActions({ id }: { id: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<AdminActionResult | null>(null);

  async function remove() {
    if (!window.confirm("Trajno obrisati ovaj pin i njegove fotografije?")) return;
    setBusy(true);
    const actionResult = await deleteMapEventAction(id);
    setResult(actionResult);
    setBusy(false);
    if (actionResult.ok) router.refresh();
  }

  return (
    <div className="mt-3 space-y-2">
      <button type="button" onClick={() => void remove()} disabled={busy} className="inline-flex items-center gap-2 rounded-full bg-red-100 px-3 py-2 text-xs font-black text-red-900">{busy ? <LoaderCircle className="animate-spin" size={15} /> : <Trash2 size={15} />} Trajno obriši</button>
      <AdminActionMessage result={result} />
    </div>
  );
}
