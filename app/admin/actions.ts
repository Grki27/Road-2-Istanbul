"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";
import { requireAdminContext } from "@/lib/auth/admin-server";
import type { Database } from "@/types/database";
import {
  locationInputSchema,
  mapEventInputSchema,
  recapInputSchema,
  tripSettingsInputSchema,
  type LocationInput,
  type MapEventInput,
  type RecapInput,
  type TripSettingsInput
} from "@/lib/validation/admin";

export type AdminActionResult = {
  ok: boolean;
  message: string;
  id?: string;
  fieldErrors?: Record<string, string[]>;
};

type ImageKind = "recap" | "event";

const EARTH_RADIUS_METERS = 6378137;
const LIVE_LOCATION_OFFSET_METERS = 500;
const LIVE_LOCATION_OFFSET_BEARING_DEGREES = 45;

const imageInputSchema = z.object({
  kind: z.enum(["recap", "event"]),
  parentId: z.string().uuid(),
  imageUrl: z.string().url(),
  storagePath: z.string().min(1).max(500),
  sortOrder: z.number().int().min(0).max(100),
  altText: z.string().trim().max(200).optional()
});

const reorderSchema = z.object({
  kind: z.enum(["recap", "event"]),
  items: z.array(z.object({ id: z.string().uuid(), sortOrder: z.number().int().min(0) })).max(15)
});

function validationError(error: z.ZodError): AdminActionResult {
  return {
    ok: false,
    message: "Provjeri označena polja.",
    fieldErrors: error.flatten().fieldErrors as Record<string, string[]>
  };
}

function nullIfEmpty(value?: string) {
  const cleaned = value?.trim();
  return cleaned ? cleaned : null;
}

function formatKmValue(value: number) {
  return Number.isInteger(value) ? String(value) : value.toFixed(1).replace(/\.0$/, "");
}

function toRadians(value: number) {
  return (value * Math.PI) / 180;
}

function toDegrees(value: number) {
  return (value * 180) / Math.PI;
}

function offsetCoordinates(latitude: number, longitude: number, distanceMeters: number, bearingDegrees: number) {
  const bearing = toRadians(bearingDegrees);
  const angularDistance = distanceMeters / EARTH_RADIUS_METERS;
  const lat1 = toRadians(latitude);
  const lng1 = toRadians(longitude);

  const lat2 = Math.asin(
    Math.sin(lat1) * Math.cos(angularDistance) +
      Math.cos(lat1) * Math.sin(angularDistance) * Math.cos(bearing)
  );
  const lng2 =
    lng1 +
    Math.atan2(
      Math.sin(bearing) * Math.sin(angularDistance) * Math.cos(lat1),
      Math.cos(angularDistance) - Math.sin(lat1) * Math.sin(lat2)
    );

  return {
    latitude: Number(toDegrees(lat2).toFixed(7)),
    longitude: Number((((toDegrees(lng2) + 540) % 360) - 180).toFixed(7))
  };
}

async function recalculateRecapKilometerRanges(supabase: SupabaseClient<Database>) {
  const { data, error } = await supabase
    .from("daily_recaps")
    .select("id, distance_km")
    .neq("status", "archived")
    .order("day_number", { ascending: true })
    .order("date", { ascending: true });

  if (error) return error.message;

  let totalKm = 0;
  for (const recap of data ?? []) {
    const distanceKm = recap.distance_km;
    const startLocation = distanceKm === null ? null : formatKmValue(totalKm);
    if (distanceKm !== null) totalKm += Number(distanceKm);
    const endLocation = distanceKm === null ? null : formatKmValue(totalKm);

    const updateResult = await supabase
      .from("daily_recaps")
      .update({
        start_location: startLocation,
        end_location: endLocation
      })
      .eq("id", recap.id);

    if (updateResult.error) return updateResult.error.message;
  }

  return undefined;
}

async function updateLiveLocationFromPoint(
  supabase: SupabaseClient<Database>,
  point: {
    latitude: number | null;
    longitude: number | null;
    note?: string | null;
    country?: string | null;
  },
  options?: {
    offsetFromPointByMeters?: number;
  }
) {
  if (point.latitude === null || point.longitude === null) return undefined;
  const coordinates = options?.offsetFromPointByMeters
    ? offsetCoordinates(
        point.latitude,
        point.longitude,
        options.offsetFromPointByMeters,
        LIVE_LOCATION_OFFSET_BEARING_DEGREES
      )
    : {
        latitude: point.latitude,
        longitude: point.longitude
      };

  const { error } = await supabase.rpc("admin_update_current_location", {
    p_latitude: coordinates.latitude,
    p_longitude: coordinates.longitude,
    p_note: nullIfEmpty(point.note ?? undefined),
    p_current_country: nullIfEmpty(point.country ?? undefined)
  });

  return error?.message;
}

function refreshPublicAndAdmin() {
  revalidatePath("/");
  revalidatePath("/admin");
  revalidatePath("/admin/recaps");
  revalidatePath("/admin/map-events");
  revalidatePath("/admin/settings");
}

export async function signOutAction() {
  const { supabase } = await requireAdminContext();
  await supabase.auth.signOut();
  redirect("/admin/login");
}

export async function saveRecapAction(input: RecapInput): Promise<AdminActionResult> {
  const parsed = recapInputSchema.safeParse(input);
  if (!parsed.success) return validationError(parsed.error);

  const { supabase } = await requireAdminContext();
  const value = parsed.data;
  const payload = {
    day_number: value.dayNumber,
    date: value.date,
    title: value.title,
    start_location: nullIfEmpty(value.startLocation),
    end_location: nullIfEmpty(value.endLocation),
    sleeping_location: nullIfEmpty(value.sleepingLocation),
    country: nullIfEmpty(value.country),
    latitude: value.latitude,
    longitude: value.longitude,
    distance_km: value.distanceKm,
    short_text: nullIfEmpty(value.shortText),
    fatigue_rating: value.fatigueRating,
    marin_fatigue_rating: value.marinFatigueRating,
    marko_fatigue_rating: value.markoFatigueRating,
    highlight_of_the_day: nullIfEmpty(value.highlightOfTheDay),
    problem_of_the_day: nullIfEmpty(value.problemOfTheDay),
    is_rest_day: value.isRestDay,
    special_milestone_type: nullIfEmpty(value.specialMilestoneType),
    status: value.status
  };

  const result = value.id
    ? await supabase.from("daily_recaps").update(payload).eq("id", value.id).select("id").single()
    : await supabase.from("daily_recaps").insert(payload).select("id").single();

  if (result.error) {
    return { ok: false, message: `Recap nije spremljen: ${result.error.message}` };
  }

  const recalculationError = await recalculateRecapKilometerRanges(supabase);
  if (recalculationError) {
    return { ok: false, message: `Recap je spremljen, ali kilometri nisu presloženi: ${recalculationError}` };
  }

  if (value.status === "published") {
    const locationError = await updateLiveLocationFromPoint(supabase, {
      latitude: value.latitude,
      longitude: value.longitude,
      country: value.country,
      note: `Dan ${value.dayNumber}: ${value.title}`
    }, {
      offsetFromPointByMeters: LIVE_LOCATION_OFFSET_METERS
    });

    if (locationError) {
      return { ok: false, message: `Recap je spremljen, ali live lokacija nije ažurirana: ${locationError}` };
    }
  }

  refreshPublicAndAdmin();
  return {
    ok: true,
    id: result.data.id,
    message: value.status === "published" ? "Recap je objavljen." : "Nacrt je spremljen."
  };
}

export async function setRecapStatusAction(
  id: string,
  status: "draft" | "published" | "archived"
): Promise<AdminActionResult> {
  const parsed = z.object({ id: z.string().uuid(), status: z.enum(["draft", "published", "archived"]) })
    .safeParse({ id, status });
  if (!parsed.success) return validationError(parsed.error);

  const { supabase } = await requireAdminContext();
  const { error } = await supabase
    .from("daily_recaps")
    .update({ status: parsed.data.status })
    .eq("id", parsed.data.id);

  if (error) return { ok: false, message: `Status nije promijenjen: ${error.message}` };

  const recalculationError = await recalculateRecapKilometerRanges(supabase);
  if (recalculationError) return { ok: false, message: `Status je promijenjen, ali kilometri nisu presloženi: ${recalculationError}` };

  refreshPublicAndAdmin();
  return { ok: true, message: status === "archived" ? "Recap je arhiviran." : "Status je promijenjen." };
}

export async function deleteRecapAction(id: string): Promise<AdminActionResult> {
  const parsed = z.string().uuid().safeParse(id);
  if (!parsed.success) return { ok: false, message: "Neispravan recap ID." };

  const { supabase } = await requireAdminContext();
  const { data: images, error: imageError } = await supabase
    .from("recap_images")
    .select("storage_path")
    .eq("recap_id", parsed.data);

  if (imageError) return { ok: false, message: `Slike nisu provjerene: ${imageError.message}` };

  const storagePaths = (images ?? []).flatMap((image) => image.storage_path ? [image.storage_path] : []);
  if (storagePaths.length) {
    const { error } = await supabase.storage.from("recap-images").remove(storagePaths);
    if (error) return { ok: false, message: `Slike nisu obrisane: ${error.message}` };
  }

  const { error } = await supabase.from("daily_recaps").delete().eq("id", parsed.data);
  if (error) return { ok: false, message: `Recap nije obrisan: ${error.message}` };

  const recalculationError = await recalculateRecapKilometerRanges(supabase);
  if (recalculationError) return { ok: false, message: `Recap je obrisan, ali kilometri nisu presloženi: ${recalculationError}` };

  refreshPublicAndAdmin();
  return { ok: true, message: "Recap i njegove slike trajno su obrisani." };
}

export async function updateCurrentLocationAction(input: LocationInput): Promise<AdminActionResult> {
  const parsed = locationInputSchema.safeParse(input);
  if (!parsed.success) return validationError(parsed.error);

  const { supabase } = await requireAdminContext();
  const { data, error } = await supabase.rpc("admin_update_current_location", {
    p_latitude: parsed.data.latitude,
    p_longitude: parsed.data.longitude,
    p_note: nullIfEmpty(parsed.data.note),
    p_current_country: nullIfEmpty(parsed.data.currentCountry)
  });

  if (error) {
    return {
      ok: false,
      message: `Lokacija nije spremljena: ${error.message}. Provjeri je li migracija 002 primijenjena.`
    };
  }

  refreshPublicAndAdmin();
  return { ok: true, id: data.id, message: "Nova lokacija je odmah vidljiva na javnoj karti." };
}

export async function saveMapEventAction(input: MapEventInput): Promise<AdminActionResult> {
  const parsed = mapEventInputSchema.safeParse(input);
  if (!parsed.success) return validationError(parsed.error);

  const { supabase } = await requireAdminContext();
  const value = parsed.data;
  const payload = {
    emoji: value.emoji,
    title: value.title,
    description: nullIfEmpty(value.description),
    location_name: nullIfEmpty(value.locationName),
    country: nullIfEmpty(value.country),
    latitude: value.latitude,
    longitude: value.longitude
  };

  const result = value.id
    ? await supabase.from("map_events").update(payload).eq("id", value.id).select("id").single()
    : await supabase.from("map_events").insert(payload).select("id").single();

  if (result.error) return { ok: false, message: `Pin nije spremljen: ${result.error.message}` };

  const locationError = await updateLiveLocationFromPoint(supabase, {
    latitude: value.latitude,
    longitude: value.longitude,
    country: value.country,
    note: `Pin: ${value.title}`
  }, {
    offsetFromPointByMeters: LIVE_LOCATION_OFFSET_METERS
  });

  if (locationError) {
    return { ok: false, message: `Pin je spremljen, ali live lokacija nije ažurirana: ${locationError}` };
  }

  refreshPublicAndAdmin();
  return { ok: true, id: result.data.id, message: "Pin je spremljen i vidljiv na karti." };
}

export async function deleteMapEventAction(id: string): Promise<AdminActionResult> {
  const parsed = z.string().uuid().safeParse(id);
  if (!parsed.success) return { ok: false, message: "Neispravan pin ID." };

  const { supabase } = await requireAdminContext();
  const { data: images, error: imageError } = await supabase
    .from("map_event_images")
    .select("storage_path")
    .eq("map_event_id", parsed.data);
  if (imageError) return { ok: false, message: `Slike nisu provjerene: ${imageError.message}` };

  const storagePaths = (images ?? []).flatMap((image) => image.storage_path ? [image.storage_path] : []);
  if (storagePaths.length) {
    const { error } = await supabase.storage.from("map-event-images").remove(storagePaths);
    if (error) return { ok: false, message: `Slike nisu obrisane: ${error.message}` };
  }

  const { error } = await supabase.from("map_events").delete().eq("id", parsed.data);
  if (error) return { ok: false, message: `Pin nije obrisan: ${error.message}` };
  refreshPublicAndAdmin();
  return { ok: true, message: "Pin i njegove slike trajno su obrisani." };
}

export async function saveTripSettingsAction(input: TripSettingsInput): Promise<AdminActionResult> {
  const parsed = tripSettingsInputSchema.safeParse(input);
  if (!parsed.success) return validationError(parsed.error);

  const { supabase } = await requireAdminContext();
  const value = parsed.data;
  const { error } = await supabase
    .from("trip_settings")
    .update({
      planned_total_km: value.plannedTotalKm,
      current_country: nullIfEmpty(value.currentCountry),
      countries_visited: value.countriesVisited,
      border_crossings: value.borderCrossings,
      donation_goal: value.donationGoal,
      donation_raised: value.donationRaised,
      donation_url: nullIfEmpty(value.donationUrl)
    })
    .eq("id", 1);

  if (error) return { ok: false, message: `Postavke nisu spremljene: ${error.message}` };
  refreshPublicAndAdmin();
  return { ok: true, message: "Postavke su spremljene i javna stranica je osvježena." };
}

function imageTable(kind: ImageKind) {
  return kind === "recap" ? "recap_images" as const : "map_event_images" as const;
}

function imageBucket(kind: ImageKind) {
  return kind === "recap" ? "recap-images" : "map-event-images";
}

export async function createImageRecordAction(input: unknown): Promise<AdminActionResult> {
  const parsed = imageInputSchema.safeParse(input);
  if (!parsed.success) return validationError(parsed.error);

  const { supabase } = await requireAdminContext();
  const value = parsed.data;
  const table = imageTable(value.kind);
  const maxImages = value.kind === "recap" ? 10 : 5;
  const countResult = value.kind === "recap"
    ? await supabase
        .from("recap_images")
        .select("id", { count: "exact", head: true })
        .eq("recap_id", value.parentId)
    : await supabase
        .from("map_event_images")
        .select("id", { count: "exact", head: true })
        .eq("map_event_id", value.parentId);
  const { count, error: countError } = countResult;

  if (countError) return { ok: false, message: `Slike nisu provjerene: ${countError.message}` };
  if ((count ?? 0) >= maxImages) return { ok: false, message: `Dosegnut je limit od ${maxImages} slika.` };

  const payload = value.kind === "recap"
    ? {
        recap_id: value.parentId,
        image_url: value.imageUrl,
        storage_path: value.storagePath,
        alt_text: nullIfEmpty(value.altText),
        sort_order: value.sortOrder
      }
    : {
        map_event_id: value.parentId,
        image_url: value.imageUrl,
        storage_path: value.storagePath,
        sort_order: value.sortOrder
      };

  const result = await supabase.from(table).insert(payload as never).select("id").single();
  if (result.error) return { ok: false, message: `Slika nije povezana: ${result.error.message}` };
  refreshPublicAndAdmin();
  return { ok: true, id: result.data.id, message: "Slika je uploadana." };
}

export async function deleteImageAction(kind: ImageKind, id: string): Promise<AdminActionResult> {
  const parsed = z.object({ kind: z.enum(["recap", "event"]), id: z.string().uuid() }).safeParse({ kind, id });
  if (!parsed.success) return validationError(parsed.error);

  const { supabase } = await requireAdminContext();
  const table = imageTable(parsed.data.kind);
  const { data, error: readError } = await supabase
    .from(table)
    .select("storage_path")
    .eq("id", parsed.data.id)
    .single();
  if (readError) return { ok: false, message: `Slika nije pronađena: ${readError.message}` };

  if (data.storage_path) {
    const { error } = await supabase.storage.from(imageBucket(parsed.data.kind)).remove([data.storage_path]);
    if (error) return { ok: false, message: `Storage brisanje nije uspjelo: ${error.message}` };
  }

  const { error } = await supabase.from(table).delete().eq("id", parsed.data.id);
  if (error) return { ok: false, message: `Slika nije uklonjena: ${error.message}` };
  refreshPublicAndAdmin();
  return { ok: true, message: "Slika je uklonjena." };
}

export async function reorderImagesAction(input: unknown): Promise<AdminActionResult> {
  const parsed = reorderSchema.safeParse(input);
  if (!parsed.success) return validationError(parsed.error);

  const { supabase } = await requireAdminContext();
  const table = imageTable(parsed.data.kind);
  const results = await Promise.all(
    parsed.data.items.map((item) =>
      supabase.from(table).update({ sort_order: item.sortOrder } as never).eq("id", item.id)
    )
  );
  const firstError = results.find((result) => result.error)?.error;
  if (firstError) return { ok: false, message: `Redoslijed nije spremljen: ${firstError.message}` };
  refreshPublicAndAdmin();
  return { ok: true, message: "Redoslijed slika je spremljen." };
}
