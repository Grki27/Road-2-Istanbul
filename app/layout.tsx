import type { Metadata } from "next";
import { Fraunces, Inter } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { siteConfig } from "@/config/site";
import "leaflet/dist/leaflet.css";
import "./globals.css";

const inter = Inter({
  subsets: ["latin", "latin-ext"],
  variable: "--font-sans"
});

const fraunces = Fraunces({
  subsets: ["latin", "latin-ext"],
  variable: "--font-display"
});

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  applicationName: "Sedmo Nebo",
  title: {
    default: "Sedmo Nebo | Road to Istanbul",
    template: "%s | Sedmo Nebo"
  },
  description:
    "Sedmo Nebo Road to Istanbul je live biciklisticki dnevnik puta od Dubrovnika do Istanbula i humanitarna prica za SOS Djecje selo Hrvatska.",
  keywords: [
    "Sedmo Nebo",
    "Sedmo Nebo Road to Istanbul",
    "sedmonebo",
    "sedmo nebo bicikla",
    "Dubrovnik Istanbul biciklom",
    "Road to Istanbul",
    "SOS Djecje selo Hrvatska"
  ],
  authors: [{ name: "Sedmo Nebo", url: siteConfig.url }],
  creator: "Sedmo Nebo",
  publisher: "Sedmo Nebo",
  alternates: {
    canonical: "/"
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1
    }
  },
  openGraph: {
    type: "website",
    locale: "hr_HR",
    url: siteConfig.url,
    siteName: "Sedmo Nebo",
    title: "Sedmo Nebo | Road to Istanbul",
    description:
      "Prati biciklisticku avanturu od Dubrovnika do Istanbula, dan po dan.",
    images: [
      {
        url: "/assets/hero-road-to-istanbul.jpg",
        width: 1600,
        height: 1067,
        alt: "Sedmo Nebo Road to Istanbul"
      }
    ]
  },
  twitter: {
    card: "summary_large_image",
    title: "Sedmo Nebo | Road to Istanbul",
    description:
      "Live dnevnik puta od Dubrovnika do Istanbula: karta, recapovi i humanitarna kampanja.",
    images: ["/assets/hero-road-to-istanbul.jpg"]
  },
  icons: {
    icon: "/assets/sedmo-nebo-logo.png",
    apple: "/assets/sedmo-nebo-logo.png"
  }
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="hr">
      <body className={`${inter.variable} ${fraunces.variable} font-sans antialiased`}>
        {children}
        <Analytics />
      </body>
    </html>
  );
}

