import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque, DM_Sans } from "next/font/google";
import { Toaster } from "@/components/ui/toaster";
import "./globals.css";

const bricolage = Bricolage_Grotesque({
  subsets: ["latin"],
  weight: ["600", "800"],
  variable: "--font-bricolage",
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-dm-sans",
});

export const metadata: Metadata = {
  title: { default: "CityPulse", template: "%s · CityPulse" },
  description: "Discover local events, personalise your feed and never miss a plan.",
};

export const viewport: Viewport = {
  themeColor: "#fff6e9",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${bricolage.variable} ${dmSans.variable}`}>
      <body className="flex min-h-dvh flex-col font-sans antialiased">
        {children}
        <Toaster />
      </body>
    </html>
  );
}
