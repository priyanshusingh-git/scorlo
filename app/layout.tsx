import type { Metadata, Viewport } from "next";
import { Host_Grotesk, Instrument_Serif } from "next/font/google";
import { PwaRegister } from "@/components/pwa-register";
import "./globals.css";

const hostGrotesk = Host_Grotesk({
  subsets: ["latin"],
  variable: "--font-ui",
  display: "swap"
});

const instrumentSerif = Instrument_Serif({
  subsets: ["latin"],
  variable: "--font-display",
  weight: "400",
  display: "swap"
});

export const metadata: Metadata = {
  title: "Scorlo",
  description: "A mobile-first academic companion for AKTU students.",
  applicationName: "Scorlo",
  appleWebApp: {
    capable: true,
    title: "Scorlo",
    statusBarStyle: "default"
  },
  formatDetection: {
    telephone: false
  }
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#f6f2ea"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${hostGrotesk.variable} ${instrumentSerif.variable}`}>
        <PwaRegister />
        {children}
      </body>
    </html>
  );
}
