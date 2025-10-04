import type { Metadata } from "next";
import Link from "next/link";
import SiteHeader from "../components/SiteHeader";
import ClientAuthSync from "../components/ClientAuthSync";
import SiteFooter from "../components/SiteFooter";
import { Geist, Geist_Mono } from "next/font/google";
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
  title: "Reviews & Marketing — Turn Happy Customers into 5★ Reviews",
  description:
    "All-in-one toolkit to collect reviews, generate QR codes, share links, and measure impact—built for local businesses.",
  metadataBase: new URL("https://reviewsandmarketing.com"),
  openGraph: {
    title: "Reviews & Marketing",
    description:
      "Collect more 5★ reviews and grow with built-in analytics.",
    url: "https://reviewsandmarketing.com",
    siteName: "Reviews & Marketing",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Reviews & Marketing",
    description: "Collect more 5★ reviews and grow.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        {process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY ? (
          <script
            src={`https://www.google.com/recaptcha/api.js?render=${process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY}`}
            async
            defer
          />
        ) : null}
        <ClientAuthSync />
        <SiteHeader />
        {children}
        <SiteFooter />
      </body>
    </html>
  );
}
// Force rebuild - Fri Oct  3 19:45:30 -05 2025
