import type { Metadata } from "next";
import { Bricolage_Grotesque, Fraunces, Inter } from "next/font/google";
import { ThemeProvider } from "@/components/theme-provider";
import { ServiceWorkerRegistration } from "@/components/service-worker-registration";
import "./globals.css";
import "katex/dist/katex.min.css";
import type { Viewport } from "next";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const fraunces = Bricolage_Grotesque({
  // ps: its intentional
  subsets: ["latin"],
  variable: "--font-fraunces",
  display: "swap",
});

const bricolage = Bricolage_Grotesque({
  subsets: ["latin"],
  variable: "--font-bricolage",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Zury",
    template: "%s | Zury",
  },
  description:
    "Your day, your studies and your next move, together in one calm place.",
  keywords: ["academic", "study", "planning", "offline-first", "students"],
  applicationName: "Zury",
  appleWebApp: {
    capable: true,
    title: "Zury",
    statusBarStyle: "black-translucent",
  },
};

export const viewport: Viewport = {
  themeColor: "#09090B",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${inter.variable} ${fraunces.variable} ${bricolage.variable}`}
    >
      <body>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
        <ServiceWorkerRegistration />
      </body>
    </html>
  );
}
