import type { Metadata } from "next";
import { Inter, Instrument_Sans, Bebas_Neue } from "next/font/google";
import { PlausibleScript } from "@/components/analytics/PlausibleScript";
import { OnboardingProvider } from "@/contexts/onboarding-context";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  style: ["normal", "italic"],
});

const instrumentSans = Instrument_Sans({
  variable: "--font-instrument-sans",
  subsets: ["latin"],
});

// Bebas Neue stands in for Nike's proprietary Futura ND campaign display tier.
const bebasNeue = Bebas_Neue({
  variable: "--font-bebas",
  weight: "400",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "KinMatch",
  description: "KinMatch MVP",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${inter.variable} ${instrumentSans.variable} ${bebasNeue.variable} font-sans antialiased`}
      >
        <PlausibleScript />
        <OnboardingProvider>{children}</OnboardingProvider>
      </body>
    </html>
  );
}
