import type { Metadata, Viewport } from "next";
import { Host_Grotesk, Instrument_Serif } from "next/font/google";
import { PwaRegister } from "@/components/pwa-register";
import { ToastProvider } from "@/components/toast-provider";
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
  display: "swap",
  preload: false
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
  },
  icons: {
    icon: [
      { url: "/favicon-32x32.png", sizes: "32x32" },
      { url: "/favicon-48x48.png", sizes: "48x48" },
      { url: "/icon.png" }
    ],
    apple: "/icons/apple-touch-icon.png"
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
    <html lang="en" suppressHydrationWarning>
      <body className={`${hostGrotesk.variable} ${instrumentSerif.variable}`}>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function () {
                try {
                  var isLogin = window.location.pathname === "/login";
                  var loggedOut = sessionStorage.getItem("scorlo:logged_out") === "1";
                  if (!isLogin && loggedOut) {
                    document.documentElement.setAttribute("data-protected-pending", "1");
                  }
                } catch (e) {}
              })();
            `
          }}
        />
        <PwaRegister />
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
