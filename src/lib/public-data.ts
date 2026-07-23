import { siteConfig } from "@/config/site";
import {
  previewCurrentLocation,
  previewMapEvents,
  previewRecaps,
  wallNotes
} from "@/data/mockData";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type {
  CurrentLocation,
  DailyRecap,
  MapEvent,
  RecapComment,
  StickyNote,
  TripSettings
} from "@/types";
import type { Database } from "@/types/database";

type DailyRecapRow = Database["public"]["Tables"]["daily_recaps"]["Row"];
type RecapImageRow = Database["public"]["Tables"]["recap_images"]["Row"];
type CurrentLocationRow = Database["public"]["Tables"]["current_locations"]["Row"];
type MapEventRow = Database["public"]["Tables"]["map_events"]["Row"];
type MapEventImageRow = Database["public"]["Tables"]["map_event_images"]["Row"];
type CommentRow = Database["public"]["Tables"]["comments"]["Row"];
type CommentReactionRow = Database["public"]["Tables"]["comment_reactions"]["Row"];
type WallNoteRow = Database["public"]["Tables"]["wall_notes"]["Row"];
type TripSettingsRow = Database["public"]["Tables"]["trip_settings"]["Row"];

const PUBLIC_DATA_TIMEOUT_MS = 8000;

export type PublicSiteData = {
  recaps: DailyRecap[];
  currentLocation?: CurrentLocation;
  mapEvents: MapEvent[];
  wallNotes: StickyNote[];
  settings: TripSettings;
  isPreview: boolean;
  hasDataError: boolean;
};

const defaultSettings: TripSettings = {
  plannedTotalKm: siteConfig.plannedTotalKm,
  currentCountry: undefined,
  countriesVisited: 0,
  borderCrossings: 0,
  donationGoal: siteConfig.donationGoal,
  donationRaised: siteConfig.donationRaised,
  donationUrl: siteConfig.donationUrl || undefined
};

function toFatigueRating(value: number | null): 1 | 2 | 3 | 4 | 5 {
  if (value && value >= 1 && value <= 5) {
    return value as 1 | 2 | 3 | 4 | 5;
  }

  return 3;
}

function mapCommentReactions(rows: CommentReactionRow[]) {
  const reactionsByComment = new Map<string, Map<string, number>>();

  rows.forEach((row) => {
    const reactions = reactionsByComment.get(row.comment_id) ?? new Map<string, number>();
    reactions.set(row.emoji, (reactions.get(row.emoji) ?? 0) + 1);
    reactionsByComment.set(row.comment_id, reactions);
  });

  return reactionsByComment;
}

function mapComments(rows: CommentRow[], reactionRows: CommentReactionRow[]): RecapComment[] {
  const reactionsByComment = mapCommentReactions(reactionRows);

  return rows.map((row) => ({
    id: row.id,
    recapId: row.recap_id,
    authorName: row.author_name,
    message: row.message,
    status: row.status,
    reactions: Array.from(reactionsByComment.get(row.id)?.entries() ?? [])
      .map(([emoji, count]) => ({ emoji, count }))
      .sort((first, second) => second.count - first.count),
    createdAt: row.created_at
  }));
}

function mapRecaps(rows: DailyRecapRow[], imageRows: RecapImageRow[], commentRows: CommentRow[], reactionRows: CommentReactionRow[]): DailyRecap[] {
  const imagesByRecap = new Map<string, string[]>();
  const commentsByRecap = new Map<string, RecapComment[]>();

  imageRows.forEach((image) => {
    const images = imagesByRecap.get(image.recap_id) ?? [];
    images.push(image.image_url);
    imagesByRecap.set(image.recap_id, images);
  });

  mapComments(commentRows, reactionRows).forEach((comment) => {
    const comments = commentsByRecap.get(comment.recapId) ?? [];
    comments.push(comment);
    commentsByRecap.set(comment.recapId, comments);
  });

  let totalDistanceKm = 0;

  return rows.map((row) => {
    const distanceKm = Number(row.distance_km ?? 0);
    const images = imagesByRecap.get(row.id) ?? [];
    const comments = commentsByRecap.get(row.id) ?? [];
    totalDistanceKm += distanceKm;

    return {
      id: row.id,
      dayNumber: row.day_number,
      date: row.date,
      title: row.title,
      startLocation: String(totalDistanceKm - distanceKm),
      endLocation: String(totalDistanceKm),
      sleepingLocation: row.sleeping_location ?? undefined,
      country: row.country ?? "Država nije upisana",
      latitude: row.latitude ?? undefined,
      longitude: row.longitude ?? undefined,
      distanceKm,
      totalDistanceKm,
      shortText: row.short_text ?? "",
      fatigueRating: toFatigueRating(row.fatigue_rating),
      marinFatigueRating: row.marin_fatigue_rating
        ? toFatigueRating(row.marin_fatigue_rating)
        : undefined,
      markoFatigueRating: row.marko_fatigue_rating
        ? toFatigueRating(row.marko_fatigue_rating)
        : undefined,
      highlightOfTheDay: row.highlight_of_the_day ?? "Highlight stiže uskoro.",
      problemOfTheDay: row.problem_of_the_day ?? "Bez prijavljenih problema.",
      isRestDay: row.is_rest_day,
      specialMilestoneType: row.special_milestone_type ?? undefined,
      coverImage: images[0],
      images,
      comments,
      commentCount: comments.length
    };
  });
}

function mapCurrentLocation(row: CurrentLocationRow | null): CurrentLocation | undefined {
  if (!row) {
    return undefined;
  }

  return {
    id: row.id,
    latitude: row.latitude,
    longitude: row.longitude,
    note: row.note ?? undefined,
    createdAt: row.created_at
  };
}

function mapEvents(rows: MapEventRow[], imageRows: MapEventImageRow[]): MapEvent[] {
  const imagesByEvent = new Map<string, string[]>();

  imageRows.forEach((image) => {
    const images = imagesByEvent.get(image.map_event_id) ?? [];
    images.push(image.image_url);
    imagesByEvent.set(image.map_event_id, images);
  });

  return rows.map((row) => ({
    id: row.id,
    emoji: row.emoji,
    title: row.title,
    description: row.description ?? undefined,
    locationName: row.location_name ?? undefined,
    country: row.country ?? undefined,
    latitude: row.latitude,
    longitude: row.longitude,
    images: imagesByEvent.get(row.id) ?? [],
    createdAt: row.created_at
  }));
}

function mapWallNotes(rows: WallNoteRow[]): StickyNote[] {
  return rows.map((row) => ({
    id: row.id,
    authorName: row.author_name,
    message: row.message,
    noteColor: row.note_color ?? "#ffe08a",
    xPosition: Number(row.x_position ?? 8),
    yPosition: Number(row.y_position ?? 18),
    rotation: Number(row.rotation ?? 0),
    drawingData: row.drawing_data && typeof row.drawing_data === "object" && !Array.isArray(row.drawing_data)
      ? row.drawing_data as StickyNote["drawingData"]
      : undefined,
    status: row.status,
    moderationReason: row.moderation_reason ?? undefined,
    createdAt: row.created_at,
    expiresAt: row.expires_at
  }));
}

function mapSettings(row: TripSettingsRow | null): TripSettings {
  if (!row) {
    return defaultSettings;
  }

  return {
    plannedTotalKm: Number(row.planned_total_km),
    currentCountry: row.current_country ?? undefined,
    countriesVisited: row.countries_visited,
    borderCrossings: row.border_crossings,
    donationGoal: Number(row.donation_goal),
    donationRaised: Number(row.donation_raised),
    donationUrl: row.donation_url ?? undefined
  };
}

function previewData(hasDataError: boolean): PublicSiteData {
  return {
    recaps: previewRecaps,
    currentLocation: previewCurrentLocation,
    mapEvents: previewMapEvents,
    wallNotes,
    settings: defaultSettings,
    isPreview: true,
    hasDataError
  };
}

function withTimeout<T>(promise: Promise<T>, timeoutMs = PUBLIC_DATA_TIMEOUT_MS): Promise<T> {
  let timeout: ReturnType<typeof setTimeout> | undefined;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timeout = setTimeout(() => reject(new Error("Public Supabase fetch timed out")), timeoutMs);
  });

  return Promise.race([
    promise.finally(() => {
      if (timeout) clearTimeout(timeout);
    }),
    timeoutPromise
  ]);
}

export async function getPublicSiteData(): Promise<PublicSiteData> {
  try {
    const supabase = await createSupabaseServerClient();
    const [
      recapsResult,
      recapImagesResult,
      currentLocationResult,
      mapEventsResult,
      mapEventImagesResult,
      commentsResult,
      commentReactionsResult,
      wallNotesResult,
      settingsResult
    ] = await withTimeout(Promise.all([
      supabase
        .from("daily_recaps")
        .select("*")
        .eq("status", "published")
        .order("day_number", { ascending: true })
        .order("date", { ascending: true }),
      supabase.from("recap_images").select("*").order("sort_order", { ascending: true }),
      supabase
        .from("current_locations")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase.from("map_events").select("*").order("created_at", { ascending: true }),
      supabase.from("map_event_images").select("*").order("sort_order", { ascending: true }),
      supabase
        .from("comments")
        .select("*")
        .eq("status", "approved")
        .order("created_at", { ascending: true }),
      supabase
        .from("comment_reactions")
        .select("*")
        .order("created_at", { ascending: true }),
      supabase
        .from("wall_notes")
        .select("*")
        .eq("status", "approved")
        .gt("expires_at", new Date().toISOString())
        .order("created_at", { ascending: true }),
      supabase.from("trip_settings").select("*").eq("id", 1).maybeSingle()
    ]));

    const firstError = [
      recapsResult.error,
      recapImagesResult.error,
      currentLocationResult.error,
      mapEventsResult.error,
      mapEventImagesResult.error,
      commentsResult.error,
      wallNotesResult.error,
      settingsResult.error
    ].find(Boolean);

    if (firstError) {
      console.error("Public Supabase fetch failed:", firstError.message);
      return previewData(true);
    }

    const recaps = mapRecaps(
      recapsResult.data ?? [],
      recapImagesResult.data ?? [],
      commentsResult.data ?? [],
      commentReactionsResult.error ? [] : commentReactionsResult.data ?? []
    );
    const currentLocation = mapCurrentLocation(currentLocationResult.data);
    const mapEventsData = mapEvents(mapEventsResult.data ?? [], mapEventImagesResult.data ?? []);
    const wallNotesData = mapWallNotes(wallNotesResult.data ?? []);
    const hasLiveJourneyData = Boolean(recaps.length || currentLocation || mapEventsData.length);

    if (!hasLiveJourneyData) {
      return {
        ...previewData(false),
        wallNotes: wallNotesData.length ? wallNotesData : wallNotes,
        settings: mapSettings(settingsResult.data)
      };
    }

    return {
      recaps,
      currentLocation,
      mapEvents: mapEventsData,
      wallNotes: wallNotesData,
      settings: mapSettings(settingsResult.data),
      isPreview: false,
      hasDataError: false
    };
  } catch (error) {
    console.error("Public data loader failed:", error);
    return previewData(true);
  }
}
