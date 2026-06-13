import type { Metadata } from "next";
import { Archivo_Black } from "next/font/google";
import { PlausibleScript } from "@/components/analytics/PlausibleScript";
import { OnboardingProvider } from "@/contexts/onboarding-context";
import "./globals.css";

// Archivo Black carries the heavy display headings + wordmark. UI body text
// uses a clean Arial/Helvetica stack.
const archivoBlack = Archivo_Black({
  variable: "--font-archivo-black",
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
        className={`${archivoBlack.variable} font-sans antialiased`}
      >
        <PlausibleScript />
        <OnboardingProvider>{children}</OnboardingProvider>
      </body>
    </html>
  );
}
