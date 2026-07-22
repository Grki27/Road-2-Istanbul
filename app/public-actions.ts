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
};

const AUTHOR_MAX_LENGTH = 24;
const COMMENT_MAX_WORDS = 80;
const WALL_NOTE_MAX_WORDS = 20;
const COMMENT_MAX_LENGTH = 700;
const WALL_NOTE_MAX_LENGTH = 240;
const allowedPenColors = ["#111111", "#d33a2c", "#1f65d6", "#2f8a4b", "#f0b429", "#7c3aed"] as const;
const allowedNoteColors = ["#ffe08a", "#c8f3d4", "#ffd0df", "#d6edff", "#f8c98d"] as const;

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

function statusMessage(status: PublicModerationStatus, kind: "comment" | "note", reason?: string) {
  if (status === "approved") {
    return kind === "comment"
      ? "Komentar je objavljen."
      : "Sticky note je objavljen na zidu.";
  }

  if (status === "pending") {
    return kind === "comment"
      ? "Komentar je pending i ceka kratko admin odobrenje."
      : "Sticky note je objavljen na zidu.";
  }

  return reason || (kind === "comment"
    ? "Komentar nije prosao moderaciju."
    : "Sticky note nije prosao moderaciju.");
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

  const moderation = await moderatePublicContent({
    text: `${value.authorName}\n${value.message}`
  });

  const { error } = await supabase.from("comments").insert({
    recap_id: value.recapId,
    author_name: value.authorName,
    message: value.message,
    status: moderation.status,
    moderation_reason: moderation.reason ?? null
  });

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
    status: moderation.status,
    message: statusMessage(moderation.status, "comment", moderation.reason),
    reason: moderation.reason
  };
}

export async function submitWallNoteAction(input: unknown): Promise<PublicActionResult> {
  const parsed = wallNoteSchema.safeParse(input);
  if (!parsed.success) return validationResult(parsed.error.issues[0]?.message ?? "Provjeri poruku.");

  const value = parsed.data;
  if (countWords(value.message) > WALL_NOTE_MAX_WORDS) {
    return validationResult(`Sticky note moze imati najvise ${WALL_NOTE_MAX_WORDS} rijeci.`);
  }

  const moderation = await moderateStickyNoteContent({
    text: `${value.authorName}\n${value.message}`,
    drawingDataUrl: value.drawingDataUrl
  });
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
    status: moderation.status,
    moderation_reason: moderation.reason ?? null,
    expires_at: expiresAt
  };

  const { error } = await supabase.from("wall_notes").insert(payload);

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
    status: moderation.status,
    message: statusMessage(moderation.status, "note", moderation.reason),
    reason: moderation.reason
  };
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
