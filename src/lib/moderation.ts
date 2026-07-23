import { getOpenAIKey } from "@/lib/env";
import type { DrawingData, DrawingPoint } from "@/types";

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
  /[\u5350\u534d]/u,
  /\bza\s+dom\s+spremni\b/i,
  /\bzds\b/i,
  /\bndh\b/i,
  /\busta(?:s|š|sh|ch|c)[a-zčćđšž]*\b/i,
  /\b(?:nazi|nacist[a-zčćđšž]*|hitler|heil\s+hitler)\b/i,
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

function drawingBounds(drawingData: DrawingData) {
  const points = drawingData.strokes.flatMap((stroke) => stroke.points);
  if (!points.length) return undefined;

  return points.reduce(
    (bounds, point) => ({
      minX: Math.min(bounds.minX, point.x),
      maxX: Math.max(bounds.maxX, point.x),
      minY: Math.min(bounds.minY, point.y),
      maxY: Math.max(bounds.maxY, point.y)
    }),
    { minX: 1, maxX: 0, minY: 1, maxY: 0 }
  );
}

function segmentLength(first: DrawingPoint, second: DrawingPoint) {
  return Math.hypot(second.x - first.x, second.y - first.y);
}

function isHorizontalSegment(first: DrawingPoint, second: DrawingPoint) {
  const dx = Math.abs(second.x - first.x);
  const dy = Math.abs(second.y - first.y);
  return dx > 0.025 && dy <= dx * 0.55;
}

function isVerticalSegment(first: DrawingPoint, second: DrawingPoint) {
  const dx = Math.abs(second.x - first.x);
  const dy = Math.abs(second.y - first.y);
  return dy > 0.025 && dx <= dy * 0.55;
}

function countOrthogonalTurns(points: DrawingPoint[]) {
  let turns = 0;

  for (let index = 2; index < points.length; index += 1) {
    const first = points[index - 2];
    const middle = points[index - 1];
    const last = points[index];
    const firstHorizontal = isHorizontalSegment(first, middle);
    const firstVertical = isVerticalSegment(first, middle);
    const secondHorizontal = isHorizontalSegment(middle, last);
    const secondVertical = isVerticalSegment(middle, last);

    if ((firstHorizontal && secondVertical) || (firstVertical && secondHorizontal)) {
      turns += 1;
    }
  }

  return turns;
}

function hasSuspiciousSwastikaDrawing(drawingData?: DrawingData) {
  if (!drawingData?.strokes.length) return false;
  const bounds = drawingBounds(drawingData);
  if (!bounds) return false;

  const width = bounds.maxX - bounds.minX;
  const height = bounds.maxY - bounds.minY;
  if (width < 0.16 || height < 0.16) return false;

  let horizontalLength = 0;
  let verticalLength = 0;
  let orthogonalTurns = 0;
  let upperHorizontal = false;
  let lowerHorizontal = false;
  let leftVertical = false;
  let rightVertical = false;

  for (const stroke of drawingData.strokes) {
    orthogonalTurns += countOrthogonalTurns(stroke.points);

    for (let index = 1; index < stroke.points.length; index += 1) {
      const previous = stroke.points[index - 1];
      const current = stroke.points[index];
      const length = segmentLength(previous, current);
      const midX = (previous.x + current.x) / 2;
      const midY = (previous.y + current.y) / 2;

      if (isHorizontalSegment(previous, current)) {
        horizontalLength += length;
        if (midY < bounds.minY + height * 0.45) upperHorizontal = true;
        if (midY > bounds.minY + height * 0.55) lowerHorizontal = true;
      }

      if (isVerticalSegment(previous, current)) {
        verticalLength += length;
        if (midX < bounds.minX + width * 0.45) leftVertical = true;
        if (midX > bounds.minX + width * 0.55) rightVertical = true;
      }
    }
  }

  return (
    horizontalLength > 0.22 &&
    verticalLength > 0.22 &&
    orthogonalTurns >= 2 &&
    upperHorizontal &&
    lowerHorizontal &&
    leftVertical &&
    rightVertical
  );
}

function hasSuspiciousUWithCrossDrawing(drawingData?: DrawingData) {
  if (!drawingData?.strokes.length) return false;
  const bounds = drawingBounds(drawingData);
  if (!bounds) return false;

  const width = bounds.maxX - bounds.minX;
  const height = bounds.maxY - bounds.minY;
  if (width < 0.12 || height < 0.14) return false;

  let leftVerticalLength = 0;
  let rightVerticalLength = 0;
  let bottomSpanMin = 1;
  let bottomSpanMax = 0;
  let crossVertical = false;
  let crossHorizontal = false;

  for (const stroke of drawingData.strokes) {
    for (let index = 1; index < stroke.points.length; index += 1) {
      const previous = stroke.points[index - 1];
      const current = stroke.points[index];
      const length = segmentLength(previous, current);
      const midX = (previous.x + current.x) / 2;
      const midY = (previous.y + current.y) / 2;

      if (isVerticalSegment(previous, current) && midY > bounds.minY + height * 0.35) {
        if (midX < bounds.minX + width * 0.45) leftVerticalLength += length;
        if (midX > bounds.minX + width * 0.55) rightVerticalLength += length;
      }

      if (midY > bounds.minY + height * 0.62) {
        bottomSpanMin = Math.min(bottomSpanMin, previous.x, current.x);
        bottomSpanMax = Math.max(bottomSpanMax, previous.x, current.x);
      }

      if (
        isVerticalSegment(previous, current) &&
        midX > bounds.minX + width * 0.36 &&
        midX < bounds.minX + width * 0.64 &&
        midY < bounds.minY + height * 0.52 &&
        length > 0.055
      ) {
        crossVertical = true;
      }

      if (
        isHorizontalSegment(previous, current) &&
        midX > bounds.minX + width * 0.28 &&
        midX < bounds.minX + width * 0.72 &&
        midY < bounds.minY + height * 0.46 &&
        length > 0.045
      ) {
        crossHorizontal = true;
      }
    }
  }

  return (
    leftVerticalLength > 0.08 &&
    rightVerticalLength > 0.08 &&
    bottomSpanMax - bottomSpanMin > width * 0.35 &&
    crossVertical &&
    crossHorizontal
  );
}

function hasSevereStickyDrawing(drawingData?: DrawingData) {
  return hasSuspiciousSwastikaDrawing(drawingData) || hasSuspiciousUWithCrossDrawing(drawingData);
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

  if (!response.ok) {
    console.error("OpenAI moderation failed", response.status, await response.text());
    return undefined;
  }

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
  drawingData,
  drawingDataUrl
}: {
  text: string;
  drawingData?: DrawingData;
  drawingDataUrl?: string;
}): Promise<ModerationDecision> {
  const cleanedText = text.trim();

  if (hasSevereStickyBlock(cleanedText) || hasSevereStickyDrawing(drawingData)) {
    return {
      status: "rejected",
      reason: "Sticky note nije prosao moderaciju."
    };
  }

  try {
    const flagged = await callModerationApi({ text: cleanedText, drawingDataUrl });

    if (flagged === undefined) {
      return {
        status: "pending",
        reason: "AI pregled trenutno nije dovršen."
      };
    }

    if (flagged) {
      return {
        status: "rejected",
        reason: "Sticky note nije prosao moderaciju."
      };
    }

    return { status: "approved" };
  } catch (error) {
    console.error("OpenAI sticky note moderation error", error);
    return {
      status: "pending",
      reason: "AI pregled trenutno nije dovršen."
    };
  }
}
