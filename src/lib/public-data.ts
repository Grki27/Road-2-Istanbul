import { siteConfig } from "@/config/site";
import {
  previewCurrentLocation,
  previewMapEvents,
  previewRecaps
} from "@/data/mockData";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type {
  CurrentLocation,
  DailyRecap,
  MapEvent,
  TripSettings
} from "@/types";
import type { Database } from "@/types/database";

type DailyRecapRow = Database["public"]["Tables"]["daily_recaps"]["Row"];
type RecapImageRow = Database["public"]["Tables"]["recap_images"]["Row"];
type CurrentLocationRow = Database["public"]["Tables"]["current_locations"]["Row"];
type MapEventRow = Database["public"]["Tables"]["map_events"]["Row"];
type MapEventImageRow = Database["public"]["Tables"]["map_event_images"]["Row"];
type TripSettingsRow = Database["public"]["Tables"]["trip_settings"]["Row"];

const PUBLIC_DATA_TIMEOUT_MS = 8000;

export type PublicSiteData = {
  recaps: DailyRecap[];
  currentLocation?: CurrentLocation;
  mapEvents: MapEvent[];
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

function mapRecaps(rows: DailyRecapRow[], imageRows: RecapImageRow[]): DailyRecap[] {
  const imagesByRecap = new Map<string, string[]>();

  imageRows.forEach((image) => {
    const images = imagesByRecap.get(image.recap_id) ?? [];
    images.push(image.image_url);
    imagesByRecap.set(image.recap_id, images);
  });

  let totalDistanceKm = 0;

  return rows.map((row) => {
    const distanceKm = Number(row.distance_km ?? 0);
    const images = imagesByRecap.get(row.id) ?? [];
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
      images
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
      supabase.from("trip_settings").select("*").eq("id", 1).maybeSingle()
    ]));

    const firstError = [
      recapsResult.error,
      recapImagesResult.error,
      currentLocationResult.error,
      mapEventsResult.error,
      mapEventImagesResult.error,
      settingsResult.error
    ].find(Boolean);

    if (firstError) {
      console.error("Public Supabase fetch failed:", firstError.message);
      return previewData(true);
    }

    const recaps = mapRecaps(recapsResult.data ?? [], recapImagesResult.data ?? []);
    const currentLocation = mapCurrentLocation(currentLocationResult.data);
    const mapEventsData = mapEvents(mapEventsResult.data ?? [], mapEventImagesResult.data ?? []);
    const hasLiveJourneyData = Boolean(recaps.length || currentLocation || mapEventsData.length);

    if (!hasLiveJourneyData) {
      return {
        ...previewData(false),
        settings: mapSettings(settingsResult.data)
      };
    }

    return {
      recaps,
      currentLocation,
      mapEvents: mapEventsData,
      settings: mapSettings(settingsResult.data),
      isPreview: false,
      hasDataError: false
    };
  } catch (error) {
    console.error("Public data loader failed:", error);
    return previewData(true);
  }
}
