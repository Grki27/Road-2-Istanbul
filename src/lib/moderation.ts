import { getOpenAIKey } from "@/lib/env";

export type PublicModerationStatus = "approved" | "pending" | "rejected";

export type ModerationDecision = {
  status: PublicModerationStatus;
  reason?: string;
};

const OPENAI_MODERATION_URL = "https://api.openai.com/v1/moderations";
const MODERATION_MODEL = "omni-moderation-latest";

const blockedPatterns = [
  /\bnigger\b/i,
  /\bnigga\b/i,
  /\bfaggot\b/i,
  /\bcigan(?:in|e|i)?\b/i,
  /\bretard(?:ed)?\b/i,
  /\bubij\s+se\b/i,
  /\bkill yourself\b/i,
  /\bjebem\s+ti\s+(mater|majku)\b/i,
  /\bpick[au]\s+ti\s+mater/i
];

const severeStickyPatterns = [
  /卐|卍/,
  /\bza\s+dom\s+spremni\b/i,
  /\bzds\b/i,
  /\bndh\b/i,
  /\bustas(?:a|e|ha|ki|ko|tvo)\b/i,
  /\bwhite\s+power\b/i,
  /\bsieg\s+heil\b/i,
  /\bkill\s+(all|them)\b/i
];

function hasLocalBlock(text: string) {
  return blockedPatterns.some((pattern) => pattern.test(text));
}

function hasSevereStickyBlock(text: string) {
  return severeStickyPatterns.some((pattern) => pattern.test(text));
}

function decisionFromFlagged(flagged: boolean, reason = "Poruka nije prosla moderaciju.") {
  return flagged
    ? { status: "rejected" as const, reason }
    : { status: "approved" as const };
}

async function callModerationApi({
  text,
  drawingDataUrl
}: {
  text: string;
  drawingDataUrl?: string;
}) {
  const apiKey = getOpenAIKey();
  if (!apiKey) return undefined;

  const input = drawingDataUrl
    ? [
        { type: "text", text },
        { type: "image_url", image_url: { url: drawingDataUrl } }
      ]
    : text;

  const response = await fetch(OPENAI_MODERATION_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: MODERATION_MODEL,
      input
    })
  });

  if (!response.ok) return undefined;

  const payload = await response.json() as {
    results?: Array<{ flagged?: boolean }>;
  };

  return Boolean(payload.results?.some((result) => result.flagged));
}

export async function moderatePublicContent({
  text,
  drawingDataUrl
}: {
  text: string;
  drawingDataUrl?: string;
}): Promise<ModerationDecision> {
  const cleanedText = text.trim();

  if (hasLocalBlock(cleanedText)) {
    return {
      status: "rejected",
      reason: "Poruka je previse uvredljiva za javni prikaz."
    };
  }

  if (!getOpenAIKey()) {
    return {
      status: "pending",
      reason: "Ceka admin odobrenje."
    };
  }

  try {
    const flagged = await callModerationApi({ text: cleanedText, drawingDataUrl });

    if (flagged === undefined) {
      return {
        status: "pending",
        reason: "Ceka admin odobrenje."
      };
    }

    return decisionFromFlagged(flagged);
  } catch {
    return {
      status: "pending",
      reason: "Ceka admin odobrenje."
    };
  }
}

export async function moderateStickyNoteContent({
  text,
  drawingDataUrl
}: {
  text: string;
  drawingDataUrl?: string;
}): Promise<ModerationDecision> {
  const cleanedText = text.trim();

  if (hasSevereStickyBlock(cleanedText)) {
    return {
      status: "rejected",
      reason: "Sticky note nije prosao moderaciju."
    };
  }

  try {
    const flagged = await callModerationApi({ text: cleanedText, drawingDataUrl });

    if (flagged) {
      return {
        status: "rejected",
        reason: "Sticky note nije prosao moderaciju."
      };
    }

    return { status: "approved" };
  } catch {
    return { status: "approved" };
  }
}
