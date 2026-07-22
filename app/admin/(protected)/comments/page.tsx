import Link from "next/link";
import { MessageCircleMore } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminModerationActions } from "@/components/admin/AdminModerationActions";
import { requireAdminContext } from "@/lib/auth/admin-server";

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

export default async function AdminCommentsPage({
  searchParams
}: {
  searchParams?: Promise<{ status?: string }>;
}) {
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const status = isStatus(resolvedSearchParams.status) ? resolvedSearchParams.status : "pending";
  const { supabase } = await requireAdminContext();
  const [commentsResult, recapsResult] = await Promise.all([
    supabase
      .from("comments")
      .select("*")
      .eq("status", status)
      .order("created_at", { ascending: false }),
    supabase.from("daily_recaps").select("id, day_number, title")
  ]);
  const recapsById = new Map((recapsResult.data ?? []).map((recap) => [recap.id, recap]));

  return (
    <>
      <AdminPageHeader
        eyebrow="Moderacija"
        title="Komentari"
        description="Komentari se prikazuju samo na dnevnim recapovima, nikad u karti."
        backHref="/admin"
      />
      <div className="mb-5 flex flex-wrap gap-2">
        {statuses.map((item) => (
          <Link
            className={`rounded-full px-4 py-2 text-sm font-black ${item === status ? "bg-ink text-paper" : "bg-white/70 text-coffee"}`}
            href={`/admin/comments?status=${item}`}
            key={item}
          >
            {item}
          </Link>
        ))}
      </div>
      <section className="grid gap-4">
        {(commentsResult.data ?? []).map((comment) => {
          const recap = recapsById.get(comment.recap_id);

          return (
            <article className="rounded-2xl bg-white/70 p-5 shadow-paper" key={comment.id}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.16em] text-clay"><MessageCircleMore size={15} /> Komentar</p>
                  <h2 className="mt-2 font-display text-2xl font-black">{comment.author_name}</h2>
                  <p className="mt-1 text-sm font-bold text-coffee/65">
                    {recap ? `Dan ${recap.day_number}: ${recap.title}` : "Recap nije pronađen"}
                  </p>
                </div>
                <span className={`rounded-full px-3 py-1 text-xs font-black ${statusStyle[comment.status]}`}>{comment.status}</span>
              </div>
              <p className="mt-4 whitespace-pre-wrap leading-7 text-coffee/85">{comment.message}</p>
              {comment.moderation_reason ? <p className="mt-3 rounded-2xl bg-sand px-4 py-3 text-sm font-bold text-ink">Razlog: {comment.moderation_reason}</p> : null}
              <p className="mt-3 text-xs font-bold text-coffee/55">{new Intl.DateTimeFormat("hr-HR", { dateStyle: "medium", timeStyle: "short" }).format(new Date(comment.created_at))}</p>
              <AdminModerationActions id={comment.id} kind="comment" status={comment.status} />
            </article>
          );
        })}
        {!commentsResult.data?.length ? (
          <div className="rounded-2xl border border-dashed border-coffee/25 p-7 text-center font-bold text-coffee/65">
            Nema komentara za ovaj filter.
          </div>
        ) : null}
      </section>
    </>
  );
}
