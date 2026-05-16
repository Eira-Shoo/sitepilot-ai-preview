import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { AppChrome } from "@/components/marketing/app-chrome";
import { DemoRibbon } from "@/components/marketing/demo-ribbon";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "SitePilot AI — Free website draft for your business",
    template: "%s | SitePilot AI",
  },
  description:
    "Get a ready-to-launch website draft for your business in minutes. Free AI draft with copy, sections, SEO, and contact blocks.",
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL ??
      (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000"),
  ),
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} min-h-screen font-sans`}
      >
        <AppChrome>{children}</AppChrome>
        <DemoRibbon />
        <Toaster richColors position="top-center" />
      </body>
    </html>
  );
}
