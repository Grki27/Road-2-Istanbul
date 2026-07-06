import { siteConfig } from "@/config/site";
import type { DailyRecap } from "@/types";

export function getTripStats(recaps: DailyRecap[]) {
  const totalDistanceKm = recaps.reduce((sum, recap) => sum + recap.distanceKm, 0);
  const daysOnRoad = recaps.length;
  const longestDayKm = recaps.reduce(
    (longest, recap) => Math.max(longest, recap.distanceKm),
    0
  );
  const averageKmPerDay = daysOnRoad ? Math.round(totalDistanceKm / daysOnRoad) : 0;

  return {
    totalDistanceKm,
    kilometersToIstanbul: Math.max(siteConfig.plannedTotalKm - totalDistanceKm, 0),
    averageKmPerDay,
    longestDayKm,
    daysOnRoad,
    restDays: 0,
    currentCountry: daysOnRoad ? recaps[recaps.length - 1]?.country : "Čekamo start",
    countriesVisited: daysOnRoad ? 1 : 0,
    borderCrossings: 0
  };
}
