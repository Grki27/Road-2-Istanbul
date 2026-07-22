import Link from "next/link";
import { StickyNote } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminModerationActions } from "@/components/admin/AdminModerationActions";
import { requireAdminContext } from "@/lib/auth/admin-server";
import type { DrawingData } from "@/types";
import type { Json } from "@/types/database";

const statuses = ["pending", "approved", "rejected"] as const;
const statusStyle = {
  pending: "bg-sand text-ink",
  approved: "bg-lime-100 text-lime-950",
  rejected: "bg-red-100 text-red-950"
};

type Status = typeof statuses[number];

function isStatus(value: unknown): value is Status {
  return typeof value === "string" && statuses.includes(value as Status);
}

function drawingFromJson(value: Json | null): DrawingData | undefined {
  if (!value || typeof value !== "object" || Array.isArray(value)) return undefined;
  const candidate = value as Partial<DrawingData>;

  if (
    typeof candidate.width !== "number" ||
    typeof candidate.height !== "number" ||
    !Array.isArray(candidate.strokes)
  ) {
    return undefined;
  }

  return candidate as DrawingData;
}

function DrawingPreview({ drawingData }: { drawingData?: DrawingData }) {
  if (!drawingData?.strokes.length) return null;

  return (
    <svg className="mt-4 h-28 w-full rounded-xl bg-paper" viewBox={`0 0 ${drawingData.width} ${drawingData.height}`} aria-hidden="true">
      {drawingData.strokes.map((stroke, index) => (
        <polyline
          fill="none"
          key={index}
          points={stroke.points.map((point) => `${point.x * drawingData.width},${point.y * drawingData.height}`).join(" ")}
          stroke={stroke.color || "#111111"}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={8}
        />
      ))}
    </svg>
  );
}

export default async function AdminWallNotesPage({
  searchParams
}: {
  searchParams?: Promise<{ status?: string }>;
}) {
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const status = isStatus(resolvedSearchParams.status) ? resolvedSearchParams.status : "pending";
  const { supabase } = await requireAdminContext();
  const notesResult = await supabase
    .from("wall_notes")
    .select("*")
    .eq("status", status)
    .order("created_at", { ascending: false });

  return (
    <>
      <AdminPageHeader
        eyebrow="Moderacija"
        title="Zid podrške"
        description="Odobri, odbij ili ukloni sticky notes. Odobreni papirići žive 24 sata."
        backHref="/admin"
      />
      <div className="mb-5 flex flex-wrap gap-2">
        {statuses.map((item) => (
          <Link
            className={`rounded-full px-4 py-2 text-sm font-black ${item === status ? "bg-ink text-paper" : "bg-white/70 text-coffee"}`}
            href={`/admin/wall-notes?status=${item}`}
            key={item}
          >
            {item}
          </Link>
        ))}
      </div>
      <section className="grid gap-4 md:grid-cols-2">
        {(notesResult.data ?? []).map((note) => {
          const drawingData = drawingFromJson(note.drawing_data);

          return (
            <article className="rounded-2xl bg-white/70 p-5 shadow-paper" key={note.id}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.16em] text-clay"><StickyNote size={15} /> Sticky note</p>
                  <h2 className="mt-2 font-display text-2xl font-black">{note.author_name}</h2>
                  <p className="mt-1 text-sm font-bold text-coffee/65">
                    Ističe: {new Intl.DateTimeFormat("hr-HR", { dateStyle: "medium", timeStyle: "short" }).format(new Date(note.expires_at))}
                  </p>
                </div>
                <span className={`rounded-full px-3 py-1 text-xs font-black ${statusStyle[note.status]}`}>{note.status}</span>
              </div>
              <p className="mt-4 whitespace-pre-wrap leading-7 text-coffee/85">{note.message}</p>
              <DrawingPreview drawingData={drawingData} />
              <p className="mt-3 text-sm font-bold text-coffee/60">
                Pozicija: {Number(note.x_position ?? 0).toFixed(1)}%, {Number(note.y_position ?? 0).toFixed(1)}%
              </p>
              {note.moderation_reason ? <p className="mt-3 rounded-2xl bg-sand px-4 py-3 text-sm font-bold text-ink">Razlog: {note.moderation_reason}</p> : null}
              <AdminModerationActions id={note.id} kind="wall-note" status={note.status} />
            </article>
          );
        })}
        {!notesResult.data?.length ? (
          <div className="rounded-2xl border border-dashed border-coffee/25 p-7 text-center font-bold text-coffee/65 md:col-span-2">
            Nema sticky noteova za ovaj filter.
          </div>
        ) : null}
      </section>
    </>
  );
}
