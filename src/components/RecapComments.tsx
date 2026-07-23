"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { MessageCircleMore, Send, SmilePlus, X } from "lucide-react";
import { moderateSubmittedCommentAction, submitCommentAction, toggleCommentReactionAction } from "@app/public-actions";
import type { RecapComment } from "@/types";

type RecapCommentsProps = {
  recapId: string;
  recapTitle: string;
  comments: RecapComment[];
  buttonClassName?: string;
};

const defaultButtonClassName =
  "inline-flex items-center justify-center gap-2 rounded-full bg-white/70 px-3 py-2 text-sm font-black text-ink transition hover:bg-white";
const commentReactionEmojis = ["👍", "❤️", "😂", "😢", "🚲", "💯", "🔥", "🙌", "🤯", "👏"] as const;
const clientIdStorageKey = "sedmo-nebo-comment-reaction-client-id";
const reactionStorageKeyPrefix = "sedmo-nebo-comment-reaction-";

function wordCount(text: string) {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

function statusClassName(status?: string) {
  if (status === "approved") return "bg-lime-100 text-lime-950";
  if (status === "pending") return "bg-sand text-ink";
  if (status === "rejected") return "bg-red-100 text-red-950";
  return "bg-white/70 text-coffee";
}

function getClientId() {
  const existing = window.localStorage.getItem(clientIdStorageKey);
  if (existing) return existing;

  const next = window.crypto.randomUUID();
  window.localStorage.setItem(clientIdStorageKey, next);
  return next;
}

export function RecapComments({
  recapId,
  recapTitle,
  comments,
  buttonClassName = defaultButtonClassName
}: RecapCommentsProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [authorName, setAuthorName] = useState("");
  const [message, setMessage] = useState("");
  const [result, setResult] = useState<{ status?: "approved" | "pending" | "rejected"; message: string } | null>(null);
  const [openPickerCommentId, setOpenPickerCommentId] = useState<string | null>(null);
  const [reactionBurst, setReactionBurst] = useState<{ commentId: string; emoji: string; nonce: number } | null>(null);
  const [isPending, startTransition] = useTransition();
  const [isReactionPending, startReactionTransition] = useTransition();
  const visibleComments = useMemo(() => comments, [comments]);
  const currentWordCount = wordCount(message);
  const commentCount = visibleComments.length;

  function submit() {
    setResult(null);
    startTransition(async () => {
      const actionResult = await submitCommentAction({
        recapId,
        authorName,
        message
      });

      setResult({ status: actionResult.status, message: actionResult.message });

      if (actionResult.ok && actionResult.status === "approved" && actionResult.id) {
        setMessage("");
        router.refresh();

        const moderationResult = await moderateSubmittedCommentAction({ id: actionResult.id });
        setResult({ status: moderationResult.status, message: moderationResult.message });
        if (moderationResult.status === "rejected") {
          router.refresh();
        }
      }
    });
  }

  function reactToComment(commentId: string, emoji: (typeof commentReactionEmojis)[number]) {
    startReactionTransition(async () => {
      const clientId = getClientId();
      const storageKey = `${reactionStorageKeyPrefix}${commentId}`;
      const actionResult = await toggleCommentReactionAction({ commentId, emoji, clientId });

      if (!actionResult.ok) {
        setResult({ status: "pending", message: actionResult.message });
        return;
      }

      if (actionResult.selectedEmoji) {
        window.localStorage.setItem(storageKey, actionResult.selectedEmoji);
        setReactionBurst({ commentId, emoji: actionResult.selectedEmoji, nonce: Date.now() });
      } else {
        window.localStorage.removeItem(storageKey);
      }

      setOpenPickerCommentId(null);
      router.refresh();
    });
  }

  return (
    <>
      <button
        aria-label={`Otvori komentare za ${recapTitle}`}
        className={buttonClassName}
        onClick={() => setIsOpen(true)}
        type="button"
      >
        <MessageCircleMore size={17} />
        {commentCount}
      </button>

      {isOpen ? (
        <div className="fixed inset-0 z-[105] flex items-end bg-ink/55 px-3 pb-3 pt-10 backdrop-blur-sm sm:items-center sm:justify-center sm:p-5">
          <div
            aria-label={`Komentari: ${recapTitle}`}
            aria-modal="true"
            className="max-h-[92vh] w-full max-w-2xl overflow-hidden rounded-[2rem] bg-paper shadow-paper"
            role="dialog"
          >
            <div className="flex items-start justify-between gap-4 border-b border-coffee/10 p-5">
              <div className="min-w-0">
                <p className="text-xs font-black uppercase tracking-[0.2em] text-clay">Komentari</p>
                <h3 className="mt-1 truncate font-display text-2xl font-black">{recapTitle}</h3>
              </div>
              <button
                aria-label="Zatvori komentare"
                className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-ink text-paper"
                onClick={() => setIsOpen(false)}
                type="button"
              >
                <X size={20} />
              </button>
            </div>

            <div className="max-h-[calc(92vh-10rem)] overflow-y-auto p-5">
              <div className="space-y-3">
                {visibleComments.length ? (
                  visibleComments.map((comment) => (
                    <article key={comment.id} className="relative rounded-2xl bg-white/70 p-4">
                      <div className="flex items-center justify-between gap-3">
                        <p className="font-display text-lg font-black">{comment.authorName}</p>
                        <div className="flex items-center gap-2">
                          <time className="text-xs font-bold text-coffee/55" dateTime={comment.createdAt}>
                            {new Intl.DateTimeFormat("hr-HR", { day: "numeric", month: "short" }).format(new Date(comment.createdAt))}
                          </time>
                          <button
                            aria-label="Dodaj reakciju"
                            className="grid h-8 w-8 place-items-center rounded-full bg-paper text-coffee shadow-pin transition hover:-translate-y-0.5 hover:text-ink disabled:opacity-50"
                            disabled={isReactionPending}
                            onClick={() => setOpenPickerCommentId((current) => current === comment.id ? null : comment.id)}
                            type="button"
                          >
                            <SmilePlus size={16} />
                          </button>
                        </div>
                      </div>
                      <p className="mt-2 leading-7 text-coffee/85">{comment.message}</p>
                      {comment.reactions.length ? (
                        <div className="mt-3 flex flex-wrap gap-1.5">
                          {comment.reactions.map((reaction) => (
                            <span
                              className={`inline-flex items-center gap-1 rounded-full bg-paper px-2.5 py-1 text-sm font-black text-ink shadow-sm ${
                                reactionBurst?.commentId === comment.id && reactionBurst.emoji === reaction.emoji
                                  ? "comment-reaction-pop"
                                  : ""
                              }`}
                              key={`${reaction.emoji}-${reactionBurst?.nonce ?? "stable"}`}
                            >
                              <span>{reaction.emoji}</span>
                              <span className="text-xs text-coffee/70">{reaction.count}</span>
                            </span>
                          ))}
                        </div>
                      ) : null}
                      {openPickerCommentId === comment.id ? (
                        <div className="absolute right-4 top-14 z-20 flex flex-wrap gap-1 rounded-2xl bg-paper p-2 shadow-paper">
                          {commentReactionEmojis.map((emoji) => (
                            <button
                              aria-label={`Reagiraj: ${emoji}`}
                              className="grid h-9 w-9 place-items-center rounded-full text-lg transition hover:scale-110 hover:bg-white disabled:opacity-50"
                              disabled={isReactionPending}
                              key={emoji}
                              onClick={() => reactToComment(comment.id, emoji)}
                              type="button"
                            >
                              {emoji}
                            </button>
                          ))}
                        </div>
                      ) : null}
                    </article>
                  ))
                ) : (
                  <div className="rounded-2xl border border-dashed border-coffee/25 p-5 text-center font-bold text-coffee/65">
                    Još nema komentara. Budi prvi glas s ceste.
                  </div>
                )}
              </div>

              <div className="mt-5 rounded-2xl bg-white/60 p-4">
                <label className="block text-sm font-black text-coffee">
                  Ime
                  <input
                    className="mt-2 w-full rounded-2xl border border-coffee/15 bg-white px-4 py-3 font-semibold outline-none ring-clay/25 transition focus:ring-4"
                    maxLength={24}
                    onChange={(event) => setAuthorName(event.target.value)}
                    value={authorName}
                  />
                </label>
                <label className="mt-3 block text-sm font-black text-coffee">
                  Komentar
                  <textarea
                    className="mt-2 min-h-28 w-full resize-y rounded-2xl border border-coffee/15 bg-white px-4 py-3 font-semibold outline-none ring-clay/25 transition focus:ring-4"
                    maxLength={700}
                    onChange={(event) => setMessage(event.target.value)}
                    value={message}
                  />
                </label>
                <div className="mt-2 flex flex-wrap items-center justify-between gap-3 text-xs font-bold text-coffee/65">
                  <span>{authorName.length}/24 znakova ime</span>
                  <span className={currentWordCount > 80 ? "text-red-800" : ""}>{currentWordCount}/80 riječi</span>
                </div>
                {result ? (
                  <div className={`mt-3 rounded-2xl px-4 py-3 text-sm font-black ${statusClassName(result.status)}`}>
                    {result.status === "pending" ? "Pending: " : null}
                    {result.message}
                  </div>
                ) : null}
                <button
                  className="mt-4 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-ink px-5 py-3 font-black text-paper disabled:opacity-55"
                  disabled={isPending || !authorName.trim() || !message.trim() || currentWordCount > 80}
                  onClick={submit}
                  type="button"
                >
                  <Send size={18} />
                  {isPending ? "Šaljem..." : "Pošalji komentar"}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
