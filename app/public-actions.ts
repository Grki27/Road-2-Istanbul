"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { moderatePublicContent, moderateStickyNoteContent, type PublicModerationStatus } from "@/lib/moderation";
import { createSupabaseServiceClient } from "@/lib/supabase/service";
import type { Database } from "@/types/database";

type PublicActionResult = {
  ok: boolean;
  status: PublicModerationStatus;
  message: string;
  reason?: string;
  id?: string;
};

const AUTHOR_MAX_LENGTH = 24;
const COMMENT_MAX_WORDS = 80;
const WALL_NOTE_MAX_WORDS = 20;
const COMMENT_MAX_LENGTH = 700;
const WALL_NOTE_MAX_LENGTH = 240;
const allowedPenColors = ["#111111", "#d33a2c", "#1f65d6", "#2f8a4b", "#f0b429", "#7c3aed"] as const;
const allowedNoteColors = ["#ffe08a", "#c8f3d4", "#ffd0df", "#d6edff", "#f8c98d"] as const;
const allowedCommentReactionEmojis = ["👍", "❤️", "😂", "😢", "🚲", "💯", "🔥", "🙌", "🤯", "👏"] as const;

const drawingDataSchema = z.object({
  width: z.number().int().min(120).max(900),
  height: z.number().int().min(80).max(700),
  strokes: z.array(z.object({
    color: z.enum(allowedPenColors).catch("#111111"),
    points: z.array(z.object({
      x: z.number().min(0).max(1),
      y: z.number().min(0).max(1)
    })).min(1).max(500)
  })).max(40)
});

const commentSchema = z.object({
  recapId: z.string().uuid(),
  authorName: z.string().trim().min(1, "Upisi ime.").max(AUTHOR_MAX_LENGTH, "Ime moze imati najvise 24 znaka."),
  message: z.string().trim().min(1, "Upisi komentar.").max(COMMENT_MAX_LENGTH, "Komentar je predug.")
});

const wallNoteSchema = z.object({
  authorName: z.string().trim().min(1, "Upisi ime.").max(AUTHOR_MAX_LENGTH, "Ime moze imati najvise 24 znaka."),
  message: z.string().trim().min(1, "Upisi poruku.").max(WALL_NOTE_MAX_LENGTH, "Poruka je preduga."),
  noteColor: z.enum(allowedNoteColors).catch("#ffe08a"),
  drawingData: drawingDataSchema.optional(),
  drawingDataUrl: z.string().startsWith("data:image/").max(300_000).optional()
});

const moveWallNoteSchema = z.object({
  id: z.string().uuid(),
  xPosition: z.number().min(0).max(100),
  yPosition: z.number().min(0).max(100)
});

const moderationTargetSchema = z.object({
  id: z.string().uuid(),
  drawingDataUrl: z.string().startsWith("data:image/").max(300_000).optional()
});

const commentReactionSchema = z.object({
  commentId: z.string().uuid(),
  emoji: z.enum(allowedCommentReactionEmojis),
  clientId: z.string().uuid()
});

function countWords(text: string) {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

function validationResult(message: string): PublicActionResult {
  return {
    ok: false,
    status: "rejected",
    message,
    reason: message
  };
}

function randomNotePlacement() {
  return {
    xPosition: Number((6 + Math.random() * 74).toFixed(2)),
    yPosition: Number((12 + Math.random() * 58).toFixed(2)),
    rotation: Number((-5 + Math.random() * 10).toFixed(2))
  };
}

export async function submitCommentAction(input: unknown): Promise<PublicActionResult> {
  const parsed = commentSchema.safeParse(input);
  if (!parsed.success) return validationResult(parsed.error.issues[0]?.message ?? "Provjeri komentar.");

  const value = parsed.data;
  if (countWords(value.message) > COMMENT_MAX_WORDS) {
    return validationResult(`Komentar moze imati najvise ${COMMENT_MAX_WORDS} rijeci.`);
  }

  const supabase = createSupabaseServiceClient();
  const { data: recap, error: recapError } = await supabase
    .from("daily_recaps")
    .select("id, status")
    .eq("id", value.recapId)
    .maybeSingle();

  if (recapError || !recap || recap.status !== "published") {
    return validationResult("Komentari su moguci samo na objavljene dnevne recapove.");
  }

  const { data: insertedComment, error } = await supabase.from("comments").insert({
    recap_id: value.recapId,
    author_name: value.authorName,
    message: value.message,
    status: "approved",
    moderation_reason: null
  }).select("id").single();

  if (error) {
    return {
      ok: false,
      status: "pending",
      message: "Komentar nije spremljen. Probaj ponovno za trenutak."
    };
  }

  revalidatePath("/");
  return {
    ok: true,
    id: insertedComment.id,
    status: "approved",
    message: "Komentar je objavljen. AI pregled je u tijeku."
  };
}

export async function moderateSubmittedCommentAction(input: unknown): Promise<PublicActionResult> {
  const parsed = moderationTargetSchema.safeParse(input);
  if (!parsed.success) return validationResult("Komentar nije pronađen.");

  const supabase = createSupabaseServiceClient();
  const { data: comment, error } = await supabase
    .from("comments")
    .select("id, author_name, message, status")
    .eq("id", parsed.data.id)
    .maybeSingle();

  if (error || !comment || comment.status !== "approved") {
    return {
      ok: false,
      status: "pending",
      message: "AI pregled nije uspio pronaći komentar."
    };
  }

  const moderation = await moderatePublicContent({
    text: `${comment.author_name}\n${comment.message}`
  });

  if (moderation.status === "rejected") {
    await supabase
      .from("comments")
      .update({
        status: "rejected",
        moderation_reason: moderation.reason ?? "Komentar nije prošao moderaciju."
      })
      .eq("id", comment.id);
    revalidatePath("/");

    return {
      ok: true,
      id: comment.id,
      status: "rejected",
      message: moderation.reason ?? "Komentar je maknut jer nije prošao AI moderaciju.",
      reason: moderation.reason
    };
  }

  if (moderation.status === "pending") {
    return {
      ok: true,
      id: comment.id,
      status: "pending",
      message: moderation.reason ?? "AI pregled trenutno nije dovršen. Komentar ostaje objavljen."
    };
  }

  return {
    ok: true,
    id: comment.id,
    status: "approved",
    message: "Komentar je prošao AI pregled."
  };
}

export async function submitWallNoteAction(input: unknown): Promise<PublicActionResult> {
  const parsed = wallNoteSchema.safeParse(input);
  if (!parsed.success) return validationResult(parsed.error.issues[0]?.message ?? "Provjeri poruku.");

  const value = parsed.data;
  if (countWords(value.message) > WALL_NOTE_MAX_WORDS) {
    return validationResult(`Sticky note moze imati najvise ${WALL_NOTE_MAX_WORDS} rijeci.`);
  }

  const placement = randomNotePlacement();
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
  const supabase = createSupabaseServiceClient();
  const payload: Database["public"]["Tables"]["wall_notes"]["Insert"] = {
    author_name: value.authorName,
    message: value.message,
    note_color: value.noteColor,
    x_position: placement.xPosition,
    y_position: placement.yPosition,
    rotation: placement.rotation,
    drawing_data: value.drawingData ?? null,
    status: "approved",
    moderation_reason: null,
    expires_at: expiresAt
  };

  const { data: insertedNote, error } = await supabase.from("wall_notes").insert(payload).select("id").single();

  if (error) {
    return {
      ok: false,
      status: "pending",
      message: "Sticky note nije spremljen. Probaj ponovno za trenutak."
    };
  }

  revalidatePath("/");
  return {
    ok: true,
    id: insertedNote.id,
    status: "approved",
    message: "Sticky note je objavljen. AI pregled je u tijeku."
  };
}

export async function moderateSubmittedWallNoteAction(input: unknown): Promise<PublicActionResult> {
  const parsed = moderationTargetSchema.safeParse(input);
  if (!parsed.success) return validationResult("Sticky note nije pronađen.");

  const supabase = createSupabaseServiceClient();
  const { data: note, error } = await supabase
    .from("wall_notes")
    .select("id, author_name, message, drawing_data, status")
    .eq("id", parsed.data.id)
    .maybeSingle();

  if (error || !note || note.status !== "approved") {
    return {
      ok: false,
      status: "pending",
      message: "AI pregled nije uspio pronaći sticky note."
    };
  }

  const drawingData = note.drawing_data && typeof note.drawing_data === "object" && !Array.isArray(note.drawing_data)
    ? note.drawing_data as Parameters<typeof moderateStickyNoteContent>[0]["drawingData"]
    : undefined;
  const moderation = await moderateStickyNoteContent({
    text: `${note.author_name}\n${note.message}`,
    drawingData,
    drawingDataUrl: parsed.data.drawingDataUrl
  });

  if (moderation.status === "rejected") {
    await supabase
      .from("wall_notes")
      .update({
        status: "rejected",
        moderation_reason: moderation.reason ?? "Sticky note nije prošao moderaciju."
      })
      .eq("id", note.id);
    revalidatePath("/");

    return {
      ok: true,
      id: note.id,
      status: "rejected",
      message: moderation.reason ?? "Sticky note je maknut jer nije prošao AI moderaciju.",
      reason: moderation.reason
    };
  }

  if (moderation.status === "pending") {
    return {
      ok: true,
      id: note.id,
      status: "pending",
      message: moderation.reason ?? "AI pregled trenutno nije dovršen. Sticky note ostaje objavljen."
    };
  }

  return {
    ok: true,
    id: note.id,
    status: "approved",
    message: "Sticky note je prošao AI pregled."
  };
}

export async function toggleCommentReactionAction(input: unknown): Promise<{
  ok: boolean;
  message: string;
  selectedEmoji?: string;
}> {
  const parsed = commentReactionSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: "Reakcija nije spremljena." };
  }

  const value = parsed.data;
  const supabase = createSupabaseServiceClient();
  const { data: comment, error: commentError } = await supabase
    .from("comments")
    .select("id, status")
    .eq("id", value.commentId)
    .maybeSingle();

  if (commentError || !comment || comment.status !== "approved") {
    return { ok: false, message: "Reakcije su moguće samo na objavljene komentare." };
  }

  const { data: existing, error: existingError } = await supabase
    .from("comment_reactions")
    .select("id, emoji")
    .eq("comment_id", value.commentId)
    .eq("client_id", value.clientId)
    .maybeSingle();

  if (existingError) {
    return { ok: false, message: "Reakcija nije spremljena." };
  }

  if (existing?.emoji === value.emoji) {
    const { error } = await supabase
      .from("comment_reactions")
      .delete()
      .eq("id", existing.id);

    if (error) return { ok: false, message: "Reakcija nije uklonjena." };
    revalidatePath("/");
    return { ok: true, message: "Reakcija uklonjena." };
  }

  if (existing) {
    const { error } = await supabase
      .from("comment_reactions")
      .update({ emoji: value.emoji })
      .eq("id", existing.id);

    if (error) return { ok: false, message: "Reakcija nije promijenjena." };
    revalidatePath("/");
    return { ok: true, selectedEmoji: value.emoji, message: "Reakcija promijenjena." };
  }

  const { error } = await supabase
    .from("comment_reactions")
    .insert({
      comment_id: value.commentId,
      client_id: value.clientId,
      emoji: value.emoji
    });

  if (error) return { ok: false, message: "Reakcija nije spremljena." };
  revalidatePath("/");
  return { ok: true, selectedEmoji: value.emoji, message: "Reakcija spremljena." };
}

export async function moveWallNoteAction(input: unknown): Promise<{ ok: boolean; message: string }> {
  const parsed = moveWallNoteSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: "Pomak nije spremljen." };
  }

  const supabase = createSupabaseServiceClient();
  const { error } = await supabase.rpc("public_move_wall_note", {
    p_id: parsed.data.id,
    p_x_position: parsed.data.xPosition,
    p_y_position: parsed.data.yPosition
  });

  if (error) {
    return { ok: false, message: "Pomak nije spremljen." };
  }

  revalidatePath("/");
  return { ok: true, message: "Pomak spremljen." };
}
