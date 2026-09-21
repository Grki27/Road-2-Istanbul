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
import { WanderingBicycle } from "@/components/WanderingBicycle";
import { siteConfig } from "@/config/site";
import { getCampaignDonationAmount } from "@/lib/campaign-donations";
import { getPublicSiteData } from "@/lib/public-data";
import { getTripStats } from "@/lib/stats";

export const revalidate = 900;

export default async function Home() {
  const [data, campaignDonationAmount] = await Promise.all([
    getPublicSiteData(),
    getCampaignDonationAmount()
  ]);
  const settings = campaignDonationAmount === null
    ? data.settings
    : { ...data.settings, donationRaised: campaignDonationAmount };
  const stats = getTripStats(data.recaps, data.settings);
  const latestRecap = data.recaps.at(-1);
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Sedmo Nebo",
    alternateName: ["Sedmo Nebo Road to Istanbul", "sedmonebo"],
    url: siteConfig.url,
    description:
      "Live biciklisticki dnevnik puta od Dubrovnika do Istanbula i humanitarna kampanja za SOS Djecje selo Hrvatska.",
    image: `${siteConfig.url}/assets/hero-road-to-istanbul.jpg`,
    sameAs: [
      siteConfig.socials.instagram,
      siteConfig.socials.tiktok,
      siteConfig.socials.youtube,
      siteConfig.socials.facebook
    ]
  };

  return (
    <main>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <WanderingBicycle />
      <HeroSection />
      <StatsStrip
        tripCompleted={stats.kilometersToIstanbul === 0 && stats.totalDistanceKm >= data.settings.plannedTotalKm}
        stats={[
          { label: "Odvoženo", value: `${stats.totalDistanceKm} km` },
          { label: "Do Istanbula", value: `${stats.kilometersToIstanbul} km` },
          { label: "Dana na putu", value: `${stats.daysOnRoad}` },
          {
            label: "Trenutna država",
            value: stats.currentCountry
          }
        ]}
      />
      <MapPreview
        currentLocation={data.currentLocation}
        recaps={data.recaps}
        mapEvents={data.mapEvents}
        hasDataError={data.hasDataError}
      />
      <div id="zadnji-update" className="scroll-mt-24" aria-hidden="true" />
      <LatestUpdate recap={latestRecap} />
      <Timeline recaps={data.recaps} />
      <WallOfSupport notes={data.wallNotes} />
      <HumanitarianSection settings={settings} />
      <RidersSection latestRecap={latestRecap} />
      <PartnersSection />
      <Footer />
    </main>
  );
}
