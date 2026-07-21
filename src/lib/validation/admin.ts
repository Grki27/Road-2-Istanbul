import { z } from "zod";

const optionalText = z.string().trim().max(2000).optional().or(z.literal(""));
const coordinate = z.number().finite();

export const recapStatusSchema = z.enum(["draft", "published", "archived"]);

export const recapInputSchema = z
  .object({
    id: z.string().uuid().optional(),
    dayNumber: z.number().int().min(1).max(365),
    date: z.string().date(),
    title: z.string().trim().min(1).max(120),
    startLocation: z.string().trim().max(120).optional().or(z.literal("")),
    endLocation: z.string().trim().max(120).optional().or(z.literal("")),
    sleepingLocation: z.string().trim().max(120).optional().or(z.literal("")),
    country: z.string().trim().max(80).optional().or(z.literal("")),
    latitude: coordinate.min(-90).max(90).nullable(),
    longitude: coordinate.min(-180).max(180).nullable(),
    distanceKm: z.number().min(0).max(500).nullable(),
    shortText: z.string().trim().max(4000).optional().or(z.literal("")),
    fatigueRating: z.number().int().min(1).max(5).nullable(),
    marinFatigueRating: z.number().int().min(1).max(5).nullable(),
    markoFatigueRating: z.number().int().min(1).max(5).nullable(),
    highlightOfTheDay: optionalText,
    problemOfTheDay: optionalText,
    isRestDay: z.boolean(),
    specialMilestoneType: z.string().trim().max(80).optional().or(z.literal("")),
    status: recapStatusSchema
  })
  .superRefine((value, context) => {
    if (value.status !== "published") return;

    const requiredText: Array<[keyof typeof value, string]> = [
      ["startLocation", "Upiši početnu lokaciju."],
      ["endLocation", "Upiši završnu lokaciju."],
      ["country", "Upiši državu."],
      ["shortText", "Upiši tekst recapa."],
      ["highlightOfTheDay", "Upiši highlight dana."],
      ["problemOfTheDay", "Upiši problem dana."]
    ];

    requiredText.forEach(([key, message]) => {
      if (!value[key]) {
        context.addIssue({ code: "custom", path: [key], message });
      }
    });

    if (value.latitude === null) {
      context.addIssue({ code: "custom", path: ["latitude"], message: "Upiši latitude." });
    }
    if (value.longitude === null) {
      context.addIssue({ code: "custom", path: ["longitude"], message: "Upiši longitude." });
    }
    if (value.distanceKm === null) {
      context.addIssue({ code: "custom", path: ["distanceKm"], message: "Upiši kilometre." });
    }
    if (value.fatigueRating === null) {
      context.addIssue({ code: "custom", path: ["fatigueRating"], message: "Odaberi stanje dana." });
    }
  });

export const locationInputSchema = z.object({
  latitude: coordinate.min(-90).max(90),
  longitude: coordinate.min(-180).max(180),
  note: z.string().trim().max(300).optional().or(z.literal("")),
  currentCountry: z.string().trim().max(80).optional().or(z.literal(""))
});

export const mapEventInputSchema = z.object({
  id: z.string().uuid().optional(),
  emoji: z.string().trim().min(1).max(16),
  title: z.string().trim().min(1).max(120),
  description: z.string().trim().max(2000).optional().or(z.literal("")),
  locationName: z.string().trim().max(120).optional().or(z.literal("")),
  country: z.string().trim().max(80).optional().or(z.literal("")),
  latitude: coordinate.min(-90).max(90),
  longitude: coordinate.min(-180).max(180)
});

export const tripSettingsInputSchema = z.object({
  plannedTotalKm: z.number().min(1).max(10000),
  currentCountry: z.string().trim().max(80).optional().or(z.literal("")),
  countriesVisited: z.number().int().min(0).max(100),
  borderCrossings: z.number().int().min(0).max(500),
  donationGoal: z.number().min(0).max(10000000),
  donationRaised: z.number().min(0).max(10000000),
  donationUrl: z.string().trim().url().optional().or(z.literal(""))
});

export type RecapInput = z.infer<typeof recapInputSchema>;
export type LocationInput = z.infer<typeof locationInputSchema>;
export type MapEventInput = z.infer<typeof mapEventInputSchema>;
export type TripSettingsInput = z.infer<typeof tripSettingsInputSchema>;
