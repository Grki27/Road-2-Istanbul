import "server-only";
import { siteConfig } from "@/config/site";

const campaignRefreshSeconds = 15 * 60;

function parseLocalizedNumber(value: string) {
  const compact = value.replace(/[\s\u00a0]/g, "");
  if (!compact) return null;

  let normalized = compact;
  if (compact.includes(",")) {
    normalized = compact.replace(/\./g, "").replace(",", ".");
  } else if (/^\d{1,3}(?:\.\d{3})+$/.test(compact)) {
    normalized = compact.replace(/\./g, "");
  }

  const amount = Number(normalized);
  return Number.isFinite(amount) && amount >= 0 ? amount : null;
}

export function parseCampaignDonationAmount(html: string) {
  const progressText = html.match(
    /<[^>]+class=["'][^"']*\bes-entry-progress__text\b[^"']*["'][^>]*>([\s\S]*?)<\/[^>]+>/i
  )?.[1];

  if (!progressText) return null;

  const readableText = progressText
    .replace(/<[^>]*>/g, " ")
    .replace(/&(?:euro|#8364);/gi, "€")
    .replace(/&nbsp;|&#160;/gi, " ");
  const raisedAmount = readableText.match(/([\d\s.,]+)\s*(?:€|EUR)\s*\//i)?.[1];

  return raisedAmount ? parseLocalizedNumber(raisedAmount) : null;
}

export async function getCampaignDonationAmount() {
  try {
    const response = await fetch(siteConfig.donationUrl, {
      headers: {
        accept: "text/html,application/xhtml+xml",
        "user-agent": "SedmoNeboDonationSync/1.0 (+https://sedmonebo.com)"
      },
      next: { revalidate: campaignRefreshSeconds },
      signal: AbortSignal.timeout(10_000)
    });

    if (!response.ok) {
      console.warn(`SOS donation sync returned HTTP ${response.status}.`);
      return null;
    }

    const amount = parseCampaignDonationAmount(await response.text());
    if (amount === null) {
      console.warn("SOS donation sync could not find the campaign progress amount.");
    }

    return amount;
  } catch (error) {
    console.warn("SOS donation sync failed; using the Supabase fallback.", error);
    return null;
  }
}
