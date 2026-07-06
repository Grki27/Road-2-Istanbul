import { HeroSection } from "@/components/HeroSection";
import { StatsStrip } from "@/components/StatsStrip";
import { MapPreview } from "@/components/MapPreview";
import { LatestUpdate } from "@/components/LatestUpdate";
import { Timeline } from "@/components/Timeline";
import { WallOfSupport } from "@/components/WallOfSupport";
import { HumanitarianSection } from "@/components/HumanitarianSection";
import { RidersSection } from "@/components/RidersSection";
import { PartnersSection } from "@/components/PartnersSection";
import { Footer } from "@/components/Footer";
import { dailyRecaps, previewRecaps, wallNotes } from "@/data/mockData";
import { getRouteSvgPoints } from "@/lib/gpx";
import { getTripStats } from "@/lib/stats";

export default async function Home() {
  const stats = getTripStats(dailyRecaps);
  const routePoints = await getRouteSvgPoints();
  const latestRecap = dailyRecaps.at(-1);

  return (
    <main>
      <HeroSection />
      <StatsStrip
        stats={[
          { label: "Odvoženo", value: `${stats.totalDistanceKm} km`, note: "kreće 25.8.2026." },
          { label: "Do Istanbula", value: `${stats.kilometersToIstanbul} km`, note: "planirana ruta" },
          { label: "Dana na putu", value: `${stats.daysOnRoad}`, note: "objavljeni recapovi" },
          { label: "Trenutna država", value: stats.currentCountry, note: "admin update" }
        ]}
      />
      <MapPreview routePoints={routePoints} />
      <LatestUpdate recap={latestRecap} />
      <Timeline recaps={dailyRecaps} preview={previewRecaps} />
      <WallOfSupport notes={wallNotes} />
      <HumanitarianSection />
      <RidersSection />
      <PartnersSection />
      <Footer />
    </main>
  );
}
