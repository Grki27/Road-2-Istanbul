import type { Metadata } from "next";
import { Fraunces, Inter } from "next/font/google";
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
  metadataBase: new URL("https://sedmo-nebo-road-to-istanbul.vercel.app"),
  title: "Sedmo Nebo: Road to Istanbul",
  description:
    "Live dnevnik puta: dva studenta, dvije bicikle, preko 1500 kilometara i humanitarna priča za SOS Dječje selo Hrvatska.",
  openGraph: {
    title: "Sedmo Nebo: Road to Istanbul",
    description:
      "Prati biciklističku avanturu od Dubrovnika do Istanbula, dan po dan.",
    images: ["/assets/hero-road-to-istanbul.jpg"]
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
      </body>
    </html>
  );
}
