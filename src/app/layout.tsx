import type { Metadata } from "next";
import { Archivo_Black, VT323 } from "next/font/google";
import { PlausibleScript } from "@/components/analytics/PlausibleScript";
import { OnboardingProvider } from "@/contexts/onboarding-context";
import "./globals.css";

// Archivo Black stands in for Arial Black on the chunky box-art display
// headings + wordmark. UI body text uses the era-authentic Arial stack.
const archivoBlack = Archivo_Black({
  variable: "--font-archivo-black",
  weight: "400",
  subsets: ["latin"],
});

// VT323 — a softer terminal-bitmap face for the "silkscreen legend" micro
// labels (eyebrows, nav labels). Reads cleaner at small sizes than Silkscreen.
const vt323 = VT323({
  variable: "--font-pixel",
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
        className={`${archivoBlack.variable} ${vt323.variable} font-sans antialiased`}
      >
        <PlausibleScript />
        <OnboardingProvider>{children}</OnboardingProvider>
      </body>
    </html>
  );
}
