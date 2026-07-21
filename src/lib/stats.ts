import type { DailyRecap, TripSettings, TripStats } from "@/types";

export function getTripStats(recaps: DailyRecap[], settings: TripSettings): TripStats {
  const totalDistanceKm = recaps.reduce((sum, recap) => sum + recap.distanceKm, 0);
  const daysOnRoad = recaps.length;
  const longestDayKm = recaps.reduce(
    (longest, recap) => Math.max(longest, recap.distanceKm),
    0
  );
  const averageKmPerDay = daysOnRoad ? Math.round(totalDistanceKm / daysOnRoad) : 0;
  const latestRecap = recaps.at(-1);

  return {
    totalDistanceKm,
    kilometersToIstanbul: Math.max(settings.plannedTotalKm - totalDistanceKm, 0),
    averageKmPerDay,
    longestDayKm,
    daysOnRoad,
    restDays: recaps.filter((recap) => recap.isRestDay).length,
    currentCountry: settings.currentCountry || latestRecap?.country || "Čekamo start",
    countriesVisited: settings.countriesVisited,
    borderCrossings: settings.borderCrossings
  };
}
