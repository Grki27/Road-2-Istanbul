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
import { wallNotes } from "@/data/mockData";
import { getPublicSiteData } from "@/lib/public-data";
import { getTripStats } from "@/lib/stats";

export const dynamic = "force-dynamic";

export default async function Home() {
  const data = await getPublicSiteData();
  const stats = getTripStats(data.isPreview ? [] : data.recaps, data.settings);
  const latestRecap = data.recaps.at(-1);

  return (
    <main>
      <HeroSection />
      <StatsStrip
        stats={[
          { label: "Odvoženo", value: `${stats.totalDistanceKm} km` },
          { label: "Do Istanbula", value: `${stats.kilometersToIstanbul} km` },
          { label: "Dana na putu", value: `${stats.daysOnRoad}` },
          {
            label: "Trenutna država",
            value: data.isPreview ? "Čekamo start" : stats.currentCountry
          }
        ]}
      />
      <MapPreview
        currentLocation={data.currentLocation}
        recaps={data.recaps}
        mapEvents={data.mapEvents}
        isPreview={data.isPreview}
        hasDataError={data.hasDataError}
      />
      <LatestUpdate recap={latestRecap} isPreview={data.isPreview} />
      <Timeline recaps={data.recaps} isPreview={data.isPreview} />
      <WallOfSupport notes={wallNotes} />
      <HumanitarianSection settings={data.settings} />
      <RidersSection latestRecap={data.isPreview ? undefined : latestRecap} />
      <PartnersSection />
      <Footer />
    </main>
  );
}
