"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Clock, LoaderCircle, Trash2, X } from "lucide-react";
import {
  deleteModerationItemAction,
  setModerationStatusAction,
  type AdminActionResult
} from "@app/admin/actions";
import { AdminActionMessage } from "@/components/admin/AdminFormUi";

type AdminModerationActionsProps = {
  id: string;
  kind: "comment" | "wall-note";
  status: "pending" | "approved" | "rejected";
};

export function AdminModerationActions({ id, kind, status }: AdminModerationActionsProps) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [result, setResult] = useState<AdminActionResult | null>(null);

  async function setStatus(nextStatus: "pending" | "approved" | "rejected") {
    setBusy(nextStatus);
    const actionResult = await setModerationStatusAction(kind, id, nextStatus);
    setResult(actionResult);
    setBusy(null);
    if (actionResult.ok) router.refresh();
  }

  async function remove() {
    if (!window.confirm("Trajno obrisati ovu objavu?")) return;
    setBusy("delete");
    const actionResult = await deleteModerationItemAction(kind, id);
    setResult(actionResult);
    setBusy(null);
    if (actionResult.ok) router.refresh();
  }

  return (
    <div className="mt-4 space-y-2">
      <div className="flex flex-wrap gap-2">
        {status !== "approved" ? (
          <button type="button" disabled={Boolean(busy)} onClick={() => void setStatus("approved")} className="inline-flex items-center gap-2 rounded-full bg-lime-100 px-3 py-2 text-xs font-black text-lime-950">
            {busy === "approved" ? <LoaderCircle className="animate-spin" size={15} /> : <Check size={15} />}
            Odobri
          </button>
        ) : null}
        {status !== "pending" ? (
          <button type="button" disabled={Boolean(busy)} onClick={() => void setStatus("pending")} className="inline-flex items-center gap-2 rounded-full bg-sand px-3 py-2 text-xs font-black text-ink">
            {busy === "pending" ? <LoaderCircle className="animate-spin" size={15} /> : <Clock size={15} />}
            Pending
          </button>
        ) : null}
        {status !== "rejected" ? (
          <button type="button" disabled={Boolean(busy)} onClick={() => void setStatus("rejected")} className="inline-flex items-center gap-2 rounded-full bg-red-100 px-3 py-2 text-xs font-black text-red-950">
            {busy === "rejected" ? <LoaderCircle className="animate-spin" size={15} /> : <X size={15} />}
            Odbij
          </button>
        ) : null}
        <button type="button" disabled={Boolean(busy)} onClick={() => void remove()} className="inline-flex items-center gap-2 rounded-full bg-ink px-3 py-2 text-xs font-black text-paper">
          {busy === "delete" ? <LoaderCircle className="animate-spin" size={15} /> : <Trash2 size={15} />}
          Obriši
        </button>
      </div>
      <AdminActionMessage result={result} />
    </div>
  );
}
