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
import { getTripStats } from "@/lib/stats";

export default async function Home() {
  const stats = getTripStats(dailyRecaps);
  const latestRecap = dailyRecaps.at(-1);

  return (
    <main>
      <HeroSection />
      <StatsStrip
        stats={[
          { label: "Odvoženo", value: `${stats.totalDistanceKm} km` },
          { label: "Do Istanbula", value: `${stats.kilometersToIstanbul} km` },
          { label: "Dana na putu", value: `${stats.daysOnRoad}` },
          { label: "Trenutna država", value: stats.currentCountry }
        ]}
      />
      <MapPreview />
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
